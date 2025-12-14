import asyncio
import aiohttp
import sys

async def test_register():
    url = "http://127.0.0.1:8000/register"
    payload = {
        "username": "debug_user",
        "email": "debug@example.com",
        "password": "password123"
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                print(f"Status: {response.status}")
                print(f"Content: {await response.text()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_register())
