import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def register(username, email, password):
    url = f"{BASE_URL}/register"
    payload = {
        "username": username,
        "email": email,
        "password": password
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Register failed: {e.code} {e.read().decode('utf-8')}")
        # If already exists, ignored
        return None

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
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Game Create Status: {response.status}")
            print(f"Game Content: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"Game Create HTTP Error: {e.code}")
        print(f"Content: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Game Create Error: {e}")

if __name__ == "__main__":
    ts = int(time.time())
    u = f"user_{ts}"
    e = f"user_{ts}@example.com"
    p = "password123"
    
    print(f"Registering {u}...")
    register(u, e, p)
    
    print("Logging in...")
    try:
        token_data = login(u, p)
        token = token_data["access_token"]
        print("Logged in. Creating game...")
        create_game(token)
    except Exception as err:
        print(f"Login failed: {err}")
