import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def register(username, password):
    url = f"{BASE_URL}/register"
    payload = {"username": username, "email": f"{username}@example.com", "password": password}
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="POST")
        req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read())
    except: return None

def login(username, password):
    url = f"{BASE_URL}/login"
    data = urllib.parse.urlencode({"username": username, "password": password}).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())

def join_game(token, game_id):
    url = f"{BASE_URL}/games/{game_id}/join"
    req = urllib.request.Request(url, method="POST")
    req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Join Status: {response.status}")
    except Exception as e:
        print(f"Join Error: {e}")

if __name__ == "__main__":
    ts = int(time.time())
    p1 = f"player1_{ts}"
    p2 = f"player2_{ts}"
    pwd = "password123"
    
    # P1 creates
    register(p1, pwd)
    t1 = login(p1, pwd)["access_token"]
    
    import urllib.request
    req = urllib.request.Request(f"{BASE_URL}/games", method="POST")
    req.add_header('Authorization', f'Bearer {t1}')
    game = json.loads(urllib.request.urlopen(req).read())
    gid = game["id"]
    print(f"Game {gid} created by {p1}. Status: {game['status']}")
    
    # P2 joins
    register(p2, pwd)
    t2 = login(p2, pwd)["access_token"]
    print(f"{p2} joining game {gid}...")
    join_game(t2, gid)
    
    # Reuse valid move test as P1
    print(f"{p1} attempting move e4...")
    url = f"{BASE_URL}/games/{gid}/move"
    req = urllib.request.Request(url, data=json.dumps({"san": "e4"}).encode(), method="POST")
    req.add_header('Authorization', f'Bearer {t1}')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Move Result: {response.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"Move HTTP Error: {e.code}")
        print(f"Content: {e.read().decode()}")
