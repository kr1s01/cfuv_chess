from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(UserBase):
    id: int
    rating: int
    created_at: datetime
    last_active: Optional[datetime]

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class MoveCreate(BaseModel):
    san: str # e2e4, Nf3 etc.

class MoveOut(BaseModel):
    id: int
    move_san: str
    fen_after: str
    created_at: datetime
    player_id: int

    class Config:
        orm_mode = True

class GameBase(BaseModel):
    pass

class GameCreate(GameBase):
    pass # Just POST to create, maybe optional params later

class GameOut(GameBase):
    id: int
    white_player_id: int
    black_player_id: Optional[int]
    fen: str
    status: str
    result: Optional[str]
    created_at: datetime
    moves: List[MoveOut] = []

    class Config:
        orm_mode = True
