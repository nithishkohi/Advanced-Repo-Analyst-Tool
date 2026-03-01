import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from app.api.v1.sandbox import ingest_github, GithubIngestPayload

async def test():
    try:
        res = await ingest_github(GithubIngestPayload(url="https://github.com/OCA/crm"))
        print(res.keys())
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
