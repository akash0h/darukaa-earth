from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    project_type: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    project_type: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    project_type: str | None
    owner_id: int

    class Config:
        from_attributes = True
