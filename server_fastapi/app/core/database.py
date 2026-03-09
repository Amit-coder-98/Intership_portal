from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    if db is not None:
        return
    client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        serverSelectionTimeoutMS=5000,  # 5s timeout for serverless
    )
    # Verify connection works
    await client.admin.command("ping")
    # Try to get database from connection string, fallback to explicit name
    try:
        db = client.get_default_database()
    except Exception:
        db = client["mit_internship"]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("prn", unique=True, sparse=True)
    await db.weekly_reports.create_index([("student", 1), ("weekNumber", 1)], unique=True)
    print("✅ Connected to MongoDB")


async def close_db():
    global client, db
    if client:
        client.close()
        client = None
        db = None
        print("❌ MongoDB connection closed")


def get_db():
    """Get the database instance. For serverless, ensure connect_db() was called."""
    if db is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return db
