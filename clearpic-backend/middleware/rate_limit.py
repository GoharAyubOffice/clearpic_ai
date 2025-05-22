from fastapi import HTTPException
from fastapi.responses import JSONResponse
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    async def check_rate_limit(self, user_id: str):
        now = time.time()
        minute_ago = now - 60

        # Clean old requests
        self.requests[user_id] = [req_time for req_time in self.requests[user_id] if req_time > minute_ago]

        # Check if rate limit exceeded
        if len(self.requests[user_id]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )

        # Add new request
        self.requests[user_id].append(now)
        return True

rate_limiter = RateLimiter()
