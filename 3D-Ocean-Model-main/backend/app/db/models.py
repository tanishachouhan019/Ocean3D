import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(100), default="Officer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    bookmarks = relationship("BookmarkModel", back_populates="user", cascade="all, delete-orphan")
    observation_notes = relationship("ObservationNoteModel", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name or self.username,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }


class BookmarkModel(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    variable = Column(String(100), nullable=False, default="temperature")
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    depth_m = Column(Float, default=0.0)
    time_index = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("UserModel", back_populates="bookmarks")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "variable": self.variable,
            "lat": self.lat,
            "lon": self.lon,
            "depth_m": self.depth_m,
            "time_index": self.time_index,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ObservationNoteModel(Base):
    __tablename__ = "observation_notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    float_id = Column(String(100), nullable=False, index=True)
    cycle_number = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("UserModel", back_populates="observation_notes")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "float_id": self.float_id,
            "cycle_number": self.cycle_number,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SystemLogModel(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "action": self.action,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
