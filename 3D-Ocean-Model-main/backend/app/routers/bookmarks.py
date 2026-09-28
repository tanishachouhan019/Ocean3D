from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import BookmarkModel, UserModel, SystemLogModel
from app.schemas.bookmark import BookmarkCreate, BookmarkOut

router = APIRouter(prefix="/api/v1/bookmarks", tags=["Bookmarks & Saved Points"])


@router.get("", response_model=List[BookmarkOut])
@router.get("/", response_model=List[BookmarkOut])
async def list_bookmarks(user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    """
    Fetch saved ocean points / bookmarks from the database.
    """
    bookmarks = db.query(BookmarkModel).filter(BookmarkModel.user_id == user_id).order_by(BookmarkModel.created_at.desc()).all()
    return [BookmarkOut(**b.to_dict()) for b in bookmarks]


@router.post("", response_model=BookmarkOut)
@router.post("/", response_model=BookmarkOut)
async def create_bookmark(req: BookmarkCreate, user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    """
    Save a new ocean point / location bookmark to the database.
    """
    # Ensure default officer user exists if user_id is 1
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        user = db.query(UserModel).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found in database.")
        user_id = user.id

    bookmark = BookmarkModel(
        user_id=user_id,
        name=req.name,
        variable=req.variable,
        lat=req.lat,
        lon=req.lon,
        depth_m=req.depth_m,
        time_index=req.time_index,
        notes=req.notes
    )
    db.add(bookmark)
    
    # Audit log entry
    sys_log = SystemLogModel(
        action="CREATE_BOOKMARK",
        details=f"Bookmark '{req.name}' ({req.lat}, {req.lon}) created by user ID {user_id}."
    )
    db.add(sys_log)
    db.commit()
    db.refresh(bookmark)

    return BookmarkOut(**bookmark.to_dict())


@router.delete("/{bookmark_id}")
async def delete_bookmark(bookmark_id: int, db: Session = Depends(get_db)):
    """
    Delete a saved ocean point bookmark from the database.
    """
    bookmark = db.query(BookmarkModel).filter(BookmarkModel.id == bookmark_id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found in database.")

    db.delete(bookmark)
    
    sys_log = SystemLogModel(
        action="DELETE_BOOKMARK",
        details=f"Bookmark ID {bookmark_id} deleted."
    )
    db.add(sys_log)
    db.commit()

    return {"success": True, "message": f"Bookmark {bookmark_id} deleted from database."}
