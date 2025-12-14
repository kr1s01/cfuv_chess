# Chess Site Backend

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Database**
   Ensure you have PostgreSQL running.
   Create a database named `chess_db`.
   Update the `DATABASE_URL` in `database.py` if your credentials differ from `postgres:password@localhost`.


3. **Run Backend**
   ```bash
   cd chess-site/backend
   uvicorn main:app --reload
   ```

## Frontend Setup

1. **Install Dependencies**
   ```bash
   cd chess-site/frontend
   npm install
   ```

2. **Run Frontend**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Endpoints

- **Auth**: `/register`, `/login`, `/users/me`
- **Games**: `/games`, `/games/{id}`, `/games/{id}/move`, `/games/{id}/join`
- **History**: `/games/{id}/history`, `/users/{id}/history`
- **Ratings**: `/ratings`
- **WebSocket**: `ws://localhost:8000/ws/game/{id}`

## Logic

- **Chess Logic**: Uses `python-chess` for move validation and FEN/PGN handling.
- **Ratings**: Updates ELO ratings after a game finishes (checkmate or other termination).
- **Real-time**: WebSocket broadcasts moves to connected clients.
