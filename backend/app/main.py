import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import auth, profile, reference, exercises, workouts, measurements, goals, statistics

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fitness Tracker API",
    description="Backend API for the Fitness Tracker application.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(reference.router)
app.include_router(exercises.router)
app.include_router(workouts.router)
app.include_router(measurements.router, prefix="/api/v1/measurements", tags=["measurements"])
app.include_router(goals.router, prefix="/api/v1/goals", tags=["goals"])
app.include_router(statistics.router, prefix="/api/v1/statistics", tags=["statistics"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s %s", request.method, request.url, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/health", tags=["health"], summary="Health check")
def health_check():
    return {"status": "ok"}
