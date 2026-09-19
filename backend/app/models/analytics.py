from sqlalchemy import Column, Integer, Float, Date, ForeignKey

from ..database import Base


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)

    date = Column(Date, nullable=False)
    carbon_value = Column(Float)
    biodiversity_value = Column(Float)
    performance_value = Column(Float)