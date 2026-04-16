import feedparser
import structlog
from typing import List, Dict
from datetime import datetime

logger = structlog.get_logger()

class NewsAggregator:
    def __init__(self):
        self.feeds = [
            "https://cointelegraph.com/rss",
            "https://www.coindesk.com/arc/outboundfeeds/rss/",
            "https://decrypt.co/feed"
        ]
        self.last_news: List[Dict] = []

    async def poll_news(self) -> List[Dict]:
        all_items = []
        for url in self.feeds:
            try:
                # feedparser.parse is blocking, but for small feeds it's usually fast enough.
                # In a high-traffic env, we'd use run_in_executor.
                feed = feedparser.parse(url)
                for entry in feed.entries[:5]:
                    all_items.append({
                        "title": entry.get("title", "No Title"),
                        "link": entry.get("link", ""),
                        "source": url.split("/")[2],
                        "timestamp": datetime.utcnow().isoformat()
                    })
            except Exception as e:
                logger.error("news_poll_error", url=url, error=str(e))
        
        # Sort or filter for uniqueness if needed
        self.last_news = all_items[:20]
        return self.last_news

news_aggregator = NewsAggregator()
