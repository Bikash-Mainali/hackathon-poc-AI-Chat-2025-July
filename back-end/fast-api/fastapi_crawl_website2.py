import json
import os
import re
from urllib.parse import urljoin, urlparse

import requests
import urllib3
from bs4 import BeautifulSoup, Comment
from fastapi import APIRouter
from lxml.etree import ParserError
from starlette.concurrency import run_in_threadpool
from response_model import ResponseModel

# Disable SSL warnings for development purposse. Must be enabled in production.
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://locumstory.com/"
DOMAIN = urlparse(BASE_URL).netloc

visited = set()
pages_data = []

headers = {"User-Agent": "Mozilla/5.0"}

def is_visible_element(element):
    if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]']:
        return False
    if isinstance(element, Comment):
        return False
    return True

def clean_and_extract_text(soup):
    # Remove known boilerplate elements
    for selector in ['footer', 'nav', 'header', '.footer', '.site-footer', '.nav-menu', '.header', '#footer', '#nav', '#header']:
        for elem in soup.select(selector):
            elem.decompose()

    boilerplate_phrases = [
        "follow us", "privacy policy", "©", "do not sell my information", "sign up", "newsletter", "about us"
    ]

    texts = soup.findAll(text=True)
    visible_texts = filter(is_visible_element, texts)

    filtered_texts = []
    for t in visible_texts:
        t_lower = t.lower().strip()
        if any(phrase in t_lower for phrase in boilerplate_phrases):
            continue
        filtered_texts.append(t.strip())

    content = "\n".join(filtered_texts)

    # Clean excessive spaces and newlines
    cleaned_content = clean_text(content)

    if len(cleaned_content) < 100:
        return ""

    return cleaned_content

def clean_text(text):
    # Replace multiple consecutive whitespace characters (including newlines) with a single space
    text = re.sub(r'\s+', ' ', text)

    # Optionally, restore some newlines for readability (e.g., after periods)
    # For example, add newline after each period followed by a space:
    text = re.sub(r'\. ', '.\n', text)

    # Strip leading/trailing whitespace
    return text.strip()

def crawl(url, depth=0, max_depth=2):
    if url in visited or depth > max_depth:
        return

    try:
        print(f"[Depth {depth}] Crawling: {url}")
        visited.add(url)

        response = requests.get(url, headers=headers, verify=False, timeout=10)
        if response.status_code != 200:
            print(f"Skipping {url}: status code {response.status_code}")
            return

        # Try parsing with BeautifulSoup (fallback if lxml fails)
        soup = BeautifulSoup(response.text, "html.parser")

        # Optionally: If you want to parse with lxml for readability, catch errors here
        # from readability import Document
        # try:
        #     doc = Document(response.text)
        # except ParserError as e:
        #     print(f"lxml ParserError for {url}: {e}")
        #     return

        # Extract visible text
        text = clean_and_extract_text(soup)

        # Skip pages with very little or empty content
        if len(text.strip()) < 30:
            print(f"Skipping {url}: content too short or empty")
            return

        pages_data.append({
            "url": url,
            "content": text
        })

        # Crawl internal links
        for link in soup.find_all("a", href=True):
            href = link["href"]
            full_url = urljoin(url, href)
            parsed = urlparse(full_url)
            if parsed.netloc == DOMAIN and full_url not in visited:
                crawl(full_url, depth + 1, max_depth)

    except ParserError as e:
        print(f"ParserError while crawling {url}: {e}")
    except Exception as e:
        print(f"Error crawling {url}: {e}")

# ---------- FASTAPI ROUTE ----------

router = APIRouter()
@router.get("/crawl")
async def crawl_endpoint():
    json_path = "website_content.json"
    try:
        if os.path.exists(json_path):
            return ResponseModel(
                success=True,
                message="Data already exists. Crawling skipped.",
                status=200
            )

        # If file doesn't exist, do the crawl
        pages_data.clear()
        # If crawl() is blocking, run in threadpool
        await run_in_threadpool(crawl, "https://locumstory.com/", 0, 2)

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(pages_data, f, indent=2, ensure_ascii=False)

        return ResponseModel(
            success=True,
            message="Crawling completed and data saved.",
            status=200
        )

    except Exception as e:
        return ResponseModel(
            success=False,
            message="An error occurred during crawling.",
            status = 500
        )

# ---------- RUN ----------
# Run with: uvicorn async_crawler:app --reload --port 8000
