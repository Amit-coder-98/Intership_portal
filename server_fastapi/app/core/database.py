from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_default_database()
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("prn", unique=True, sparse=True)
    await db.weekly_reports.create_index([("student", 1), ("weekNumber", 1)], unique=True)
    print("✅ Connected to MongoDB")


async def close_db():
    global client
    if client:
        client.close()
        print("❌ MongoDB connection closed")


def get_db():
    return db
