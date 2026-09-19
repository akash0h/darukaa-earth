import json

from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.elements import WKTElement
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..dependencies import get_current_user
from ..models import Project, Site
from ..schemas.site import SiteCreate, SiteResponse

router = APIRouter(prefix="/projects/{project_id}/sites", tags=["Sites"])


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def polygon_to_wkt(geometry: dict) -> str:
    """
    Convert GeoJSON Polygon coordinates into WKT.
    """

    if geometry.get("type") != "Polygon":
        raise HTTPException(status_code=400, detail="Geometry must be a Polygon")

    coordinates = geometry.get("coordinates")

    if not coordinates:
        raise HTTPException(status_code=400, detail="Polygon coordinates are required")

    rings = []

    for ring in coordinates:
        if len(ring) < 4:
            raise HTTPException(
                status_code=400, detail="A polygon ring must contain at least 4 points"
            )

        if ring[0] != ring[-1]:
            raise HTTPException(status_code=400, detail="Polygon must be closed")

        points = []

        for point in ring:
            if len(point) < 2:
                raise HTTPException(status_code=400, detail="Invalid coordinate")

            longitude = point[0]
            latitude = point[1]

            if not (-180 <= longitude <= 180):
                raise HTTPException(status_code=400, detail="Invalid longitude")

            if not (-90 <= latitude <= 90):
                raise HTTPException(status_code=400, detail="Invalid latitude")

            points.append(f"{longitude} {latitude}")

        rings.append(f"({', '.join(points)})")

    return f"POLYGON({', '.join(rings)})"


def site_to_response(site: Site, db: Session):
    """
    Convert a SQLAlchemy Site object into
    a response containing GeoJSON geometry.
    """

    geometry_result = db.execute(
        text("""
            SELECT ST_AsGeoJSON(geometry)
            FROM sites
            WHERE id = :site_id
        """),
        {"site_id": site.id},
    ).scalar()

    return {
        "id": site.id,
        "name": site.name,
        "project_id": site.project_id,
        "area": site.area,
        "geometry": (json.loads(geometry_result) if geometry_result else None),
    }


# ---------------------------------------------------------
# CREATE SITE
# ---------------------------------------------------------


@router.post("/", response_model=SiteResponse)
def create_site(
    project_id: int,
    site: SiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    # Check project ownership
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    # Convert GeoJSON → WKT
    wkt = polygon_to_wkt(site.geometry)

    # Create site
    new_site = Site(
        name=site.name, project_id=project_id, geometry=WKTElement(wkt, srid=4326)
    )

    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    # Calculate area in square meters
    result = db.execute(
        text("""
            SELECT ST_Area(
                geometry::geography
            )
            FROM sites
            WHERE id = :site_id
        """),
        {"site_id": new_site.id},
    )

    new_site.area = result.scalar()

    db.commit()
    db.refresh(new_site)

    return site_to_response(new_site, db)


# ---------------------------------------------------------
# GET ALL SITES
# ---------------------------------------------------------


@router.get("/", response_model=list[SiteResponse])
def get_sites(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    # Check project ownership
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    sites = db.query(Site).filter(Site.project_id == project_id).all()

    return [site_to_response(site, db) for site in sites]


# ---------------------------------------------------------
# GET SINGLE SITE
# ---------------------------------------------------------


@router.get("/{site_id}", response_model=SiteResponse)
def get_site(
    project_id: int,
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    site = (
        db.query(Site)
        .join(Project, Site.project_id == Project.id)
        .filter(
            Site.id == site_id,
            Site.project_id == project_id,
            Project.owner_id == current_user.id,
        )
        .first()
    )

    if site is None:
        raise HTTPException(status_code=404, detail="Site not found")

    return site_to_response(site, db)


# ---------------------------------------------------------
# DELETE SITE
# ---------------------------------------------------------


@router.delete("/{site_id}")
def delete_site(
    project_id: int,
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    site = (
        db.query(Site)
        .join(Project, Site.project_id == Project.id)
        .filter(
            Site.id == site_id,
            Site.project_id == project_id,
            Project.owner_id == current_user.id,
        )
        .first()
    )

    if site is None:
        raise HTTPException(status_code=404, detail="Site not found")

    db.delete(site)
    db.commit()

    return {"message": "Site deleted successfully"}
