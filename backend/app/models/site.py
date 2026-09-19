from geoalchemy2 import Geometry
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func

from ..database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    geometry = Column(Geometry("POLYGON", srid=4326), nullable=False)

    area = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
