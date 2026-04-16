import httpx
import structlog
from typing import Optional

logger = structlog.get_logger()

class SentimentTracker:
    def __init__(self):
        self.fng_url = "https://api.alternative.me/fng/?limit=1&format=json"
        self.last_score: int = 50
        self.last_value_text: str = "Neutral"

    async def poll_fng(self) -> Optional[int]:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                res = await client.get(self.fng_url)
                if res.status_code == 200:
                    data = res.json()
                    val = data.get("data", [{}])[0].get("value")
                    txt = data.get("data", [{}])[0].get("value_classification")
                    if val is not None:
                        self.last_score = int(val)
                        self.last_value_text = txt
                        return self.last_score
        except Exception as e:
            logger.error("fng_poll_error", error=str(e))
        return None

sentiment_tracker = SentimentTracker()
