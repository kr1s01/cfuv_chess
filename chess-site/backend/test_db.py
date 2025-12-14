import asyncio
import asyncpg
import sys

# Policy fix for Windows
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test_connection():
    print("Attempting to connect to PostgreSQL...")
    try:
        conn = await asyncpg.connect('postgresql://postgres:1232@127.0.0.1/chess_db')
        print("Successfully connected!")
        await conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
