import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def get_games():
    url = f"{BASE_URL}/games"
    try:
        with urllib.request.urlopen(url) as response:
            print(f"Status: {response.status}")
            data = json.loads(response.read().decode('utf-8'))
            print(f"Games found: {len(data)}")
            # print(data) 
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(f"Content: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_games()
