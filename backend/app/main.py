from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import conversations, visits, messages, reports

app = FastAPI(
    title="CARETAI API",
    description="Clinical Analysis for Responsive Evaluation & Tracking using AI",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8443", "http://127.0.0.1:8443"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(visits.router)
app.include_router(messages.router)
app.include_router(reports.router)
app.include_router(conversations.router)


@app.get("/")
def root():
    return {
        "message": "CARETAI backend is running",
        "status": "healthy",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}