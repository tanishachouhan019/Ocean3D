from typing import Optional
from pydantic import BaseModel


class BookmarkCreate(BaseModel):
    name: str
    variable: str = "temperature"
    lat: float
    lon: float
    depth_m: float = 0.0
    time_index: int = 0
    notes: Optional[str] = None


class BookmarkOut(BaseModel):
    id: int
    user_id: int
    name: str
    variable: str
    lat: float
    lon: float
    depth_m: float
    time_index: int
    notes: Optional[str] = None
    created_at: str
