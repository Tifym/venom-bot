import asyncio
import feedparser
import structlog
from typing import List, Dict, Any
from datetime import datetime

logger = structlog.get_logger()

class NewsFetcher:
    def __init__(self, urls: List[str] = None):
        self.urls = urls or [
            "https://www.coindesk.com/arc/outboundfeed/rss/",
            "https://cointelegraph.com/rss"
        ]
        self.latest_news = []

    async def fetch_once(self) -> List[Dict[str, Any]]:
        news_items = []
        for url in self.urls:
            try:
                # Use a thread for feedparser as it's blocking
                feed = await asyncio.to_thread(feedparser.parse, url)
                for entry in feed.entries[:5]:
                    news_items.append({
                        "title": entry.title,
                        "link": entry.link,
                        "published": entry.published,
                        "source": feed.feed.title if hasattr(feed.feed, 'title') else "Crypto News",
                        "timestamp": datetime.now().isoformat()
                    })
            except Exception as e:
                logger.error("news_fetch_error", url=url, error=str(e))
        
        # Sort by timestamp (approximate) and take top 10
        self.latest_news = news_items[:10]
        return self.latest_news

    async def start_polling(self, callback=None, interval: int = 300):
        while True:
            news = await self.fetch_once()
            if callback and news:
                await callback(news)
            await asyncio.sleep(interval)
