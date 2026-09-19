from pydantic import BaseModel
from typing import Any


class SiteCreate(BaseModel):
    name: str
    geometry: dict[str, Any]


class SiteResponse(BaseModel):
    id: int
    name: str
    project_id: int
    area: float | None
    geometry: dict[str, Any] | None = None

    class Config:
        from_attributes = True