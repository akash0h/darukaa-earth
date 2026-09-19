from datetime import date

from pydantic import BaseModel


class AnalyticsCreate(BaseModel):
    date: date
    carbon_value: float | None = None
    biodiversity_value: float | None = None
    performance_value: float | None = None


class AnalyticsResponse(BaseModel):
    id: int
    site_id: int
    date: date
    carbon_value: float | None
    biodiversity_value: float | None
    performance_value: float | None

    class Config:
        from_attributes = True
