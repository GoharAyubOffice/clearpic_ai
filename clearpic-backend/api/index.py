from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routes import webhooks, auth, credits, subscription

app = FastAPI(
    title="ClearPic.AI API",
    description="API for removing backgrounds from images using U2NET",
    version="1.0.0"
)

# Enable CORS - Update this with your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For testing, you can use "*". In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(credits.router, prefix="/credits", tags=["credits"])
app.include_router(subscription.router, prefix="/subscription", tags=["subscription"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to ClearPic.AI API",
        "status": "operational",
        "endpoints": {
            "/webhooks": "Stripe webhook endpoints",
            "/auth": "Authentication endpoints",
            "/credits": "Credit management endpoints",
            "/subscription": "Subscription management endpoints"
        }
    }
