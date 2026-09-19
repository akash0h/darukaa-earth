from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import Analytics, Site, Project
from ..schemas.analytics import AnalyticsCreate, AnalyticsResponse
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/sites/{site_id}/analytics",
    tags=["Analytics"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_user_site(
    site_id: int,
    db: Session,
    user_id: int
):
    site = (
        db.query(Site)
        .join(Project, Site.project_id == Project.id)
        .filter(
            Site.id == site_id,
            Project.owner_id == user_id
        )
        .first()
    )

    if site is None:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    return site


@router.post("/", response_model=AnalyticsResponse)
def create_analytics(
    site_id: int,
    analytics: AnalyticsCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    site = get_user_site(
        site_id,
        db,
        current_user.id
    )

    new_analytics = Analytics(
        site_id=site.id,
        date=analytics.date,
        carbon_value=analytics.carbon_value,
        biodiversity_value=analytics.biodiversity_value,
        performance_value=analytics.performance_value
    )

    db.add(new_analytics)
    db.commit()
    db.refresh(new_analytics)

    return new_analytics


@router.get("/", response_model=list[AnalyticsResponse])
def get_analytics(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    site = get_user_site(
        site_id,
        db,
        current_user.id
    )

    analytics = (
        db.query(Analytics)
        .filter(Analytics.site_id == site.id)
        .order_by(Analytics.date.asc())
        .all()
    )

    return analytics


@router.get("/{analytics_id}", response_model=AnalyticsResponse)
def get_single_analytics(
    site_id: int,
    analytics_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    site = get_user_site(
        site_id,
        db,
        current_user.id
    )

    analytics = (
        db.query(Analytics)
        .filter(
            Analytics.id == analytics_id,
            Analytics.site_id == site.id
        )
        .first()
    )

    if analytics is None:
        raise HTTPException(
            status_code=404,
            detail="Analytics record not found"
        )

    return analytics


@router.delete("/{analytics_id}")
def delete_analytics(
    site_id: int,
    analytics_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    site = get_user_site(
        site_id,
        db,
        current_user.id
    )

    analytics = (
        db.query(Analytics)
        .filter(
            Analytics.id == analytics_id,
            Analytics.site_id == site.id
        )
        .first()
    )

    if analytics is None:
        raise HTTPException(
            status_code=404,
            detail="Analytics record not found"
        )

    db.delete(analytics)
    db.commit()

    return {
        "message": "Analytics deleted successfully"
    }