import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

def setup_middlewares(app: FastAPI):
    # CORS Middleware restricted to localhost
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.exception(f"Unhandled Exception: {request.method} {request.url.path} - {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error. Please try again later."}
            )
