import asyncio
from sqlalchemy import select
from database import SessionLocal
from models import Game

async def finish_all_games():
    async with SessionLocal() as session:
        result = await session.execute(select(Game).where(Game.status != "finished"))
        games = result.scalars().all()
        count = 0
        for game in games:
            game.status = "finished"
            game.result = "1/2-1/2"  # Set as draw/aborted
            count += 1
        
        await session.commit()
        print(f"Successfully finished {count} active games.")

if __name__ == "__main__":
    asyncio.run(finish_all_games())
