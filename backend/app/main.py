from fastapi import FastAPI, Depends
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .models import User, Project, Site, Analytics
from .routers.auth import router as auth_router
from fastapi import Depends
from .dependencies import get_current_user
from .routers.projects import router as projects_router
from .routers.sites import router as sites_router
from .routers.analytics import router as analytics_router
# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Darukaa.Earth API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(sites_router)
app.include_router(analytics_router)

@app.get("/")
def root():
    return {
        "message": "Darukaa.Earth API is running"
    }


@app.get("/db-test")
def db_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version()"))

        return {
            "database": result.scalar()
        }
        
@app.get("/protected")
def protected_route(
    current_user = Depends(get_current_user)
):
    return {
        "message": "You are authenticated",
        "user_id": current_user.id,
        "email": current_user.email
    }