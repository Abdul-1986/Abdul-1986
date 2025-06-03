from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date
import requests
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class Member(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_number: str = Field(default_factory=lambda: f"MM{str(uuid.uuid4())[:8].upper()}")
    name: str
    phone: str
    email: Optional[str] = None
    address: str
    id_proof_type: str  # Aadhar, Pan, Passport, etc
    id_proof_number: str
    is_committee_member: bool = False
    committee_position: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class MemberCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: str
    id_proof_type: str
    id_proof_number: str
    is_committee_member: bool = False
    committee_position: Optional[str] = None

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_id: str
    member_name: str
    member_account_number: str
    amount: float
    payment_type: str  # monthly_chanda, ramzan_taravi, donation
    payment_method: str = "UPI"
    transaction_id: Optional[str] = None
    receipt_number: str = Field(default_factory=lambda: f"RCP{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}")
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    month_year: Optional[str] = None  # For monthly payments like "2025-03"
    status: str = "completed"

class PaymentCreate(BaseModel):
    member_id: str
    amount: float
    payment_type: str
    transaction_id: Optional[str] = None
    month_year: Optional[str] = None

class PrayerTimes(BaseModel):
    date: str
    hijri_date: str
    fajr: str
    dhuhr: str
    asr: str
    maghrib: str
    isha: str
    location: str = "Ripponpet, Bangalore"

class Imam(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    qualification: str
    experience_years: int
    appointment_date: date
    salary: Optional[float] = None
    is_active: bool = True

class ImamCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    qualification: str
    experience_years: int
    appointment_date: date
    salary: Optional[float] = None

class Announcement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    priority: str = "normal"  # high, normal, low

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    created_by: str
    priority: str = "normal"

# Prayer Times Service
async def get_prayer_times_from_api():
    try:
        # Using Aladhan API for prayer times in Bangalore
        lat, lon = 12.9715987, 77.5945627  # Ripponpet, Bangalore coordinates
        url = f"http://api.aladhan.com/v1/timings?latitude={lat}&longitude={lon}&method=4"
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            timings = data['data']['timings']
            hijri_date = data['data']['date']['hijri']
            
            return PrayerTimes(
                date=datetime.now().strftime('%Y-%m-%d'),
                hijri_date=f"{hijri_date['date']} {hijri_date['month']['en']} {hijri_date['year']}",
                fajr=timings['Fajr'],
                dhuhr=timings['Dhuhr'],
                asr=timings['Asr'],
                maghrib=timings['Maghrib'],
                isha=timings['Isha']
            )
    except Exception as e:
        logging.error(f"Error fetching prayer times: {e}")
        # Return default times if API fails
        return PrayerTimes(
            date=datetime.now().strftime('%Y-%m-%d'),
            hijri_date="",
            fajr="05:30",
            dhuhr="12:30",
            asr="16:00",
            maghrib="18:30",
            isha="19:45"
        )

# API Routes
@api_router.get("/")
async def root():
    return {"message": "MAKKA MASJID RIPPONPET - Management System API"}

# Member Management Routes
@api_router.post("/members", response_model=Member)
async def create_member(member_data: MemberCreate):
    member = Member(**member_data.dict())
    await db.members.insert_one(member.dict())
    return member

@api_router.get("/members", response_model=List[Member])
async def get_members():
    members = await db.members.find({"is_active": True}).to_list(1000)
    return [Member(**member) for member in members]

@api_router.get("/members/{member_id}", response_model=Member)
async def get_member(member_id: str):
    member = await db.members.find_one({"id": member_id, "is_active": True})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return Member(**member)

@api_router.put("/members/{member_id}", response_model=Member)
async def update_member(member_id: str, member_data: MemberCreate):
    existing_member = await db.members.find_one({"id": member_id})
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    updated_data = member_data.dict()
    updated_data["id"] = member_id
    updated_data["account_number"] = existing_member["account_number"]
    updated_data["created_at"] = existing_member["created_at"]
    
    member = Member(**updated_data)
    await db.members.replace_one({"id": member_id}, member.dict())
    return member

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str):
    result = await db.members.update_one({"id": member_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member deleted successfully"}

# Payment Routes
@api_router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate):
    # Get member details
    member = await db.members.find_one({"id": payment_data.member_id, "is_active": True})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    payment = Payment(
        **payment_data.dict(),
        member_name=member["name"],
        member_account_number=member["account_number"]
    )
    
    await db.payments.insert_one(payment.dict())
    return payment

@api_router.get("/payments", response_model=List[Payment])
async def get_payments():
    payments = await db.payments.find().sort("payment_date", -1).to_list(1000)
    return [Payment(**payment) for payment in payments]

@api_router.get("/payments/member/{member_id}", response_model=List[Payment])
async def get_member_payments(member_id: str):
    payments = await db.payments.find({"member_id": member_id}).sort("payment_date", -1).to_list(1000)
    return [Payment(**payment) for payment in payments]

# Prayer Times Route
@api_router.get("/prayer-times", response_model=PrayerTimes)
async def get_prayer_times():
    # Check if we have today's prayer times cached
    today = datetime.now().strftime('%Y-%m-%d')
    cached_times = await db.prayer_times.find_one({"date": today})
    
    if cached_times:
        return PrayerTimes(**cached_times)
    
    # Fetch new prayer times
    prayer_times = await get_prayer_times_from_api()
    
    # Cache the prayer times
    await db.prayer_times.replace_one(
        {"date": today}, 
        prayer_times.dict(), 
        upsert=True
    )
    
    return prayer_times

# Imam Management Routes
@api_router.post("/imam", response_model=Imam)
async def create_imam(imam_data: ImamCreate):
    # Check if active imam exists
    existing_imam = await db.imams.find_one({"is_active": True})
    if existing_imam:
        raise HTTPException(status_code=400, detail="Active imam already exists. Please deactivate current imam first.")
    
    imam = Imam(**imam_data.dict())
    await db.imams.insert_one(imam.dict())
    return imam

@api_router.get("/imam", response_model=Optional[Imam])
async def get_active_imam():
    imam = await db.imams.find_one({"is_active": True})
    if not imam:
        return None
    return Imam(**imam)

@api_router.put("/imam/{imam_id}", response_model=Imam)
async def update_imam(imam_id: str, imam_data: ImamCreate):
    existing_imam = await db.imams.find_one({"id": imam_id})
    if not existing_imam:
        raise HTTPException(status_code=404, detail="Imam not found")
    
    updated_data = imam_data.dict()
    updated_data["id"] = imam_id
    updated_data["is_active"] = existing_imam["is_active"]
    
    imam = Imam(**updated_data)
    await db.imams.replace_one({"id": imam_id}, imam.dict())
    return imam

# Announcements Routes
@api_router.post("/announcements", response_model=Announcement)
async def create_announcement(announcement_data: AnnouncementCreate):
    announcement = Announcement(**announcement_data.dict())
    await db.announcements.insert_one(announcement.dict())
    return announcement

@api_router.get("/announcements", response_model=List[Announcement])
async def get_announcements():
    announcements = await db.announcements.find({"is_active": True}).sort("created_at", -1).to_list(100)
    return [Announcement(**announcement) for announcement in announcements]

# Dashboard Statistics Route
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_members = await db.members.count_documents({"is_active": True})
    committee_members = await db.members.count_documents({"is_active": True, "is_committee_member": True})
    
    # This month's collections
    current_month = datetime.now().strftime('%Y-%m')
    monthly_collections = await db.payments.aggregate([
        {"$match": {"month_year": current_month}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    total_monthly = monthly_collections[0]["total"] if monthly_collections else 0
    
    # Recent payments
    recent_payments = await db.payments.find().sort("payment_date", -1).limit(5).to_list(5)
    
    return {
        "total_members": total_members,
        "committee_members": committee_members,
        "monthly_collections": total_monthly,
        "recent_payments": [Payment(**payment) for payment in recent_payments]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
