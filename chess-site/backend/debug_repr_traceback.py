from fastapi.testclient import TestClient
from main import app
import sys

# Windows loop policy fix (just in case, though TestClient is sync)
import asyncio
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

client = TestClient(app)

def test_register_crash():
    payload = {
        "username": "crash_test",
        "email": "crash@example.com",
        "password": "password123"
    }
    print("Sending registration request...")
    try:
        response = client.post("/register", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print("Captured Exception during request:")
        print(e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_register_crash()
