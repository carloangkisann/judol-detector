from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.config import get_settings
from app.routes import detection, comments, auth

settings = get_settings()

app = FastAPI(
    title="Judol Detector API",
    description="API for detecting gambling content in YouTube comments",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://judol-detector-gg.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(detection.router, prefix="/api/detection", tags=["Detection"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])

@app.get("/")
async def root():
    return {"message": "Judol Detector API is running!", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)