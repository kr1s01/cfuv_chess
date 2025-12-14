import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def login(username, password):
    url = f"{BASE_URL}/login"
    data = urllib.parse.urlencode({
        "username": username,
        "password": password
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def create_game(token):
    url = f"{BASE_URL}/games"
    req = urllib.request.Request(url, method="POST")
    req.add_header('Authorization', f'Bearer {token}')
    
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def make_move(token, game_id, san):
    url = f"{BASE_URL}/games/{game_id}/move"
    payload = {"san": san}
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Move Status: {response.status}")
            print(f"Move Result: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"Move HTTP Error: {e.code}")
        print(f"Content: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Move Error: {e}")

if __name__ == "__main__":
    # Use existing user if possible or new one
    ts = int(time.time())
    u = "user_1765572343" # Re-use from previous step if possible, or creating new
    p = "password123"
    
    print("Logging in...")
    try:
        # Try login first
        token_data = login(u, p)
    except:
        # fallback register
        print("User not found, skipping (assuming server persistence). You might need to update username manually if DB was wiped.")
        exit(1)

    token = token_data["access_token"]
    print("Logged in. Creating game...")
    game = create_game(token)
    game_id = game["id"]
    print(f"Game created: {game_id}")
    
    # User is White. Try moving e4.
    print("Attempting move e4...")
    make_move(token, game_id, "e4")
