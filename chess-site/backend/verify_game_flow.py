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
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Move HTTP Error: {e.code} {e.read().decode('utf-8')}")
        raise

if __name__ == "__main__":
    ts = int(time.time())
    u1 = f"player1_{ts}"
    e1 = f"player1_{ts}@example.com"
    p = "password123"
    
    u2 = f"player2_{ts}"
    e2 = f"player2_{ts}@example.com"
    
    print(f"1. Registering White ({u1})...")
    if not register(u1, e1, p): exit(1)

    print(f"2. Registering Black ({u2})...")
    if not register(u2, e2, p): exit(1)
        
    print("3. Logging in both players...")
    token1 = login(u1, p)["access_token"]
    token2 = login(u2, p)["access_token"]
    
    print("4. Player 1 creates game...")
    game = create_game(token1)
    game_id = game["id"]
    print(f"   Game created with ID: {game_id} (Status: {game['status']})")
    
    print("5. Player 2 joins game...")
    url_join = f"{BASE_URL}/games/{game_id}/join"
    req_join = urllib.request.Request(url_join, method="POST")
    req_join.add_header('Authorization', f'Bearer {token2}')
    with urllib.request.urlopen(req_join) as response:
        game = json.loads(response.read().decode('utf-8'))
    print(f"   Joined. Game Status: {game['status']}")

    print("6. Player 1 makes move 'e4'...")
    game_after_move = make_move(token1, game_id, "e4")
    print("   Move successful.")
    
    fen = game_after_move["fen_after"]
    print(f"   New FEN: {fen}")
    
    if "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR" in fen:
        print("SUCCESS: FEN matches e4 move.")
    else:
        print("WARNING: FEN does not look like standard e4.")
