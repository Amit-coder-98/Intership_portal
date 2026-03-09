import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def fix():
    client = AsyncIOMotorClient("mongodb://localhost:27017/mit_internship")
    db = client.get_default_database()
    r1 = await db.users.update_one(
        {"email": "student@mitvpu.ac.in"},
        {"$set": {"password": pwd.hash("student123")}}
    )
    r2 = await db.users.update_one(
        {"email": "mentor@mitvpu.ac.in"},
        {"$set": {"password": pwd.hash("mentor123")}}
    )
    print(f"Student updated: {r1.modified_count}, Mentor updated: {r2.modified_count}")
    client.close()

asyncio.run(fix())
