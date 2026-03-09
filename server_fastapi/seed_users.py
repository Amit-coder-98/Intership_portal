"""Seed demo users into MongoDB for testing."""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGODB_URI = "mongodb://localhost:27017/mit_internship"

DEMO_USERS = [
    {
        "name": "Rahul Sharma",
        "email": "student@mitvpu.ac.in",
        "password": pwd_context.hash("student123"),
        "role": "student",
        "prn": "MCA401",
        "class": "MCA",
        "semester": "IV",
        "division": "A",
        "phone": "9876543210",
        "avatar": "",
        "internshipStatus": "internship_started",
        "companyName": "TCS Digital",
        "companyMentor": None,
        "facultyMentor": None,
        "internshipStartDate": None,
        "internshipEndDate": None,
        "designation": "",
        "department": "",
        "mentorType": "",
        "assignedStudents": [],
        "createdAt": datetime.now(timezone.utc),
    },
    {
        "name": "Dr. Darshan Ruikar",
        "email": "mentor@mitvpu.ac.in",
        "password": pwd_context.hash("mentor123"),
        "role": "mentor",
        "prn": "",
        "class": "",
        "semester": "",
        "division": "",
        "phone": "9876543211",
        "avatar": "",
        "internshipStatus": "",
        "companyName": "",
        "companyMentor": None,
        "facultyMentor": None,
        "internshipStartDate": None,
        "internshipEndDate": None,
        "designation": "Program Head",
        "department": "School of Computing",
        "mentorType": "faculty",
        "assignedStudents": [],
        "createdAt": datetime.now(timezone.utc),
    },
    {
        "name": "Dr. Admin HOD",
        "email": "admin@mitvpu.ac.in",
        "password": pwd_context.hash("admin123"),
        "role": "admin",
        "prn": "",
        "class": "",
        "semester": "",
        "division": "",
        "phone": "9876543212",
        "avatar": "",
        "internshipStatus": "",
        "companyName": "",
        "companyMentor": None,
        "facultyMentor": None,
        "internshipStartDate": None,
        "internshipEndDate": None,
        "designation": "Head of Department",
        "department": "School of Computing",
        "mentorType": "",
        "assignedStudents": [],
        "createdAt": datetime.now(timezone.utc),
    },
]


async def seed():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.get_default_database()

    created_ids = {}
    for user in DEMO_USERS:
        existing = await db.users.find_one({"email": user["email"]})
        if existing:
            print(f"  Already exists: {user['email']} (skipped)")
            created_ids[user["email"]] = existing["_id"]
        else:
            # Remove empty prn to avoid duplicate key on sparse unique index
            if not user.get("prn"):
                user.pop("prn", None)
            result = await db.users.insert_one(user)
            created_ids[user["email"]] = result.inserted_id
            print(f"  Created: {user['email']}")

    # Auto-assign mentor to student
    mentor_id = created_ids.get("mentor@mitvpu.ac.in")
    student_id = created_ids.get("student@mitvpu.ac.in")
    if mentor_id and student_id:
        student = await db.users.find_one({"_id": student_id})
        if student and not student.get("facultyMentor"):
            await db.users.update_one(
                {"_id": student_id},
                {"$set": {"facultyMentor": mentor_id}},
            )
            await db.users.update_one(
                {"_id": mentor_id},
                {"$addToSet": {"assignedStudents": student_id}},
            )
            print(f"  Assigned mentor to student")

    client.close()
    print("\nDone! Demo accounts ready.")


if __name__ == "__main__":
    print("Seeding demo users...\n")
    asyncio.run(seed())
