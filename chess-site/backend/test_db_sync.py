import sys
try:
    import psycopg2
except ImportError:
    print("psycopg2 not installed, installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
    import psycopg2

def test_connection():
    print("Attempting sync connection with psycopg2...")
    try:
        conn = psycopg2.connect("postgresql://postgres:password@127.0.0.1/chess_db")
        print("Successfully connected!")
        conn.close()
    except Exception as e:
        print(f"Sync connection failed: {e}")

if __name__ == "__main__":
    test_connection()
