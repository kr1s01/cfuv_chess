def calculate_elo(rating_a: int, rating_b: int, score_a: float, k: int = 32) -> int:
    """
    Calculate new rating for player A.
    score_a: 1 for win, 0 for loss, 0.5 for draw
    """
    expected_score = 1 / (1 + 10 ** ((rating_b - rating_a) / 400))
    new_rating = rating_a + k * (score_a - expected_score)
    return int(new_rating)
