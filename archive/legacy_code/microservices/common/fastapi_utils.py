"""
FastAPI Utilities

Provides common FastAPI utilities for creating consistent microservices including:
- Application factory
- CORS middleware configuration
- Database session dependency
- Error handlers 
- Health check endpoints
"""

import os
import fastapi
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from .db_init import get_db_session

# Application factory
def create_app(name: str, description: str = None, version: str = "0.1.0", debug: bool = False) -> FastAPI:
    """
    Create a FastAPI application with standard configuration
    
    Args:
        name: Name of the microservice
        description: Description of the microservice
        version: Version of the microservice
        debug: Enable debug mode
        
    Returns:
        Configured FastAPI application
    """
    # Create FastAPI app
    app = FastAPI(
        title=f"IntelligentEstate {name.capitalize()} Service",
        description=description or f"IntelligentEstate {name.capitalize()} API",
        version=version,
        docs_url="/docs",
        redoc_url="/redoc",
        debug=debug or os.environ.get('DEBUG', 'false').lower() == 'true'
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, this should be more restrictive
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check():
        """
        Health check endpoint 
        """
        # Could add more health checks here (e.g., database connection)
        return {
            "status": "healthy",
            "service": name
        }
        
    # Ready check endpoint
    @app.get("/ready", tags=["Health"])
    async def ready_check():
        """
        Ready check endpoint
        """
        # Check database connection
        try:
            db = get_db_session()
            db.execute("SELECT 1")
            db.close()
            return {
                "status": "ready",
                "service": name,
                "database": "connected"
            }
        except Exception as e:
            return {
                "status": "not ready",
                "service": name,
                "database": "disconnected",
                "error": str(e)
            }
    
    # Root endpoint
    @app.get("/")
    async def root():
        """
        Root endpoint
        """
        return {
            "service": name,
            "version": version,
            "documentation": "/docs"
        }
        
    # Return configured app
    return app

# Database session dependency
def get_db():
    """
    Database session dependency
    """
    db = get_db_session()
    try:
        yield db
    finally:
        db.close()

# Error handlers
def handle_not_found_error(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle 404 Not Found errors
    """
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "Not Found",
            "message": str(exc),
            "path": request.url.path
        }
    )

def handle_validation_error(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle validation errors
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": str(exc),
            "path": request.url.path,
            "detail": getattr(exc, "errors", [])
        }
    )

def handle_database_error(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle database errors
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Database Error",
            "message": str(exc),
            "path": request.url.path
        }
    )

def handle_internal_server_error(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle internal server errors
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "path": request.url.path
        }
    )

def register_exception_handlers(app: FastAPI):
    """
    Register exception handlers
    """
    from fastapi.exceptions import RequestValidationError
    from sqlalchemy.exc import SQLAlchemyError
    
    app.add_exception_handler(fastapi.exceptions.HTTPException, handle_not_found_error)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(SQLAlchemyError, handle_database_error)
    app.add_exception_handler(Exception, handle_internal_server_error)