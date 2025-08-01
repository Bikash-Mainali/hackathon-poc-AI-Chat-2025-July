import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import fastapi_chatbot
import fastapi_crawl_website2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development only)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include your routers
app.include_router(fastapi_chatbot.router)
app.include_router(fastapi_crawl_website2.router)

if __name__ == "__main__":
    uvicorn.run("fastapi_main:app", host="0.0.0.0", port=8181, reload=True)
