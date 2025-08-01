import asyncio
import json
import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain.callbacks.base import AsyncCallbackHandler
from langchain.chains import RetrievalQA
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.llms import OpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from pydantic import BaseModel

import config
from response_model import ResponseModel

# -------- ENV SETUP --------
env = os.getenv("APP_ENV", "dev")
config.load_env(env)
openai_api_key = os.getenv("OPENAI_API_KEY")
assert openai_api_key, "OPENAI_API_KEY must be set"
json_path = "website_content.json"

# -------- DATA LOAD --------

def load_website_json_content():
    with open(json_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    documents = [Document(page_content=item['content'], metadata={"url": item["url"]}) for item in raw_data]

    # -------- SPLIT & EMBEDDING --------
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = [Document(page_content=chunk, metadata=doc.metadata)
            for doc in documents for chunk in splitter.split_text(doc.page_content)]

    embedding = OpenAIEmbeddings(openai_api_key=openai_api_key)
    vector_store = FAISS.from_documents(chunks, embedding)
    retriever = vector_store.as_retriever(search_type="mmr", search_kwargs={"k": 3})
    return retriever

# -------- STREAM HANDLER --------
class AggregatingStreamHandler(AsyncCallbackHandler):
    def __init__(self):
        self.tokens = []
        self.done = asyncio.Event()

    async def on_llm_new_token(self, token: str, **kwargs):
        self.tokens.append(token)

    async def on_llm_end(self, *args, **kwargs):
        self.done.set()

    async def get_final_text(self):
        await self.done.wait()
        return "".join(self.tokens)

# -------- FASTAPI --------
# app = FastAPI(title="LocumStory ChatBot API")
router = APIRouter()

class QueryRequest(BaseModel):
    question: str

@router.post("/ask/stream")
async def ask_stream(query_request: QueryRequest):
    if not os.path.exists(json_path):
        return ResponseModel(
            success=True,
            message="No data found",
            status=200
        )
    query = query_request.question.strip()
    if not query:
        return ResponseModel(
            success=False,
            message="Query cannot be empty.",
            status=400
        )
    try:
        stream_handler = AggregatingStreamHandler()

        llm = OpenAI(
            temperature=0,
            streaming=True,
            callbacks=[stream_handler],
            openai_api_key=openai_api_key
        )

        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=load_website_json_content(),
            return_source_documents=True
            )

        return StreamingResponse(
            generate_response(qa_chain, stream_handler, query),
            media_type="application/json"
            )
    except Exception as e:
        error_response = ResponseModel(
            success=False,
            message=str(e),
            status=500
        )

async def generate_response(qa_chain, stream_handler, query):
    try:
        result = await qa_chain.ainvoke({"query": query})
        final_answer = await stream_handler.get_final_text()
        docs = result.get("source_documents", [])

        urls = []
        seen = set()
        for doc in docs:
            url = doc.metadata.get("url")
            if url and url not in seen:
                urls.append(url)
                seen.add(url)
            if len(urls) == 5:
                break

        combined_content = ""
        for doc in docs[:2]:
            content = doc.page_content.strip()
            if content:
                combined_content += content + "\n\n"

        response = {
            "answer": final_answer.strip(),
            "combined_content": combined_content.strip(),
            "source_urls": urls
        }
        yield json.dumps(response)
    except Exception as e:
        error_response = ResponseModel(
            success=False,
            message= str(e),
            status=500
        )
        yield error_response.model_dump_json()


