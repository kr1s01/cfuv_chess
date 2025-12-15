import sys
import asyncio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import models, schemas, database, auth, games

app = FastAPI(title="Chess Site Backend")

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(games.router)

@app.on_event("startup")
async def startup():
    # Initialize database tables
    async with database.engine.begin() as conn:
        # In production, use Alembic for migrations
        await conn.run_sync(models.Base.metadata.create_all)

@app.post("/register", response_model=schemas.UserOut)
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.User).filter(models.User.email == user.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    result = await db.execute(select(models.User).filter(models.User.username == user.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, username=user.username, hashed_password=hashed)
    db.add(new_user)
    await db.commit()
    # Eager load relationships for the response
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(models.User)
        .filter(models.User.id == new_user.id)
        .options(selectinload(models.User.games_white), selectinload(models.User.games_black))
    )
    new_user = result.scalars().first()
    return new_user

@app.post("/login", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.User).filter(models.User.username == form_data.username))
    user = result.scalars().first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserOut)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/ratings", response_model=List[schemas.UserOut])
async def get_ratings(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(database.get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(models.User)
        .options(selectinload(models.User.games_white), selectinload(models.User.games_black))
        .order_by(models.User.rating.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@app.get("/users/{user_id}/history", response_model=List[schemas.GameOut])
async def get_user_history(user_id: int, db: AsyncSession = Depends(database.get_db)):
    # Returns games where user was white or black
    # Note: Complex OR query in async sqlalchemy
    from sqlalchemy import or_
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(models.Game)
        .filter(or_(models.Game.white_player_id == user_id, models.Game.black_player_id == user_id))
        .options(selectinload(models.Game.moves))
        .order_by(models.Game.created_at.desc())
    )
    return result.scalars().all()
