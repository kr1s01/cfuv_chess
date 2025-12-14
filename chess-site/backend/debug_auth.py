import auth
# Fix async loop policy for windows if importing auth imports models/db which imports asyncio stuff? 
# actually auth imports models, but that's fine.

try:
    print("Testing hashing...")
    pwd = "password123"
    hashed = auth.get_password_hash(pwd)
    print(f"Hashed: {hashed}")
    
    print("Testing verification...")
    valid = auth.verify_password(pwd, hashed)
    print(f"Valid: {valid}")
    
    invalid = auth.verify_password("wrong", hashed)
    print(f"Invalid check: {not invalid}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
