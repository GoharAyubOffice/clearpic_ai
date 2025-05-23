import sys
import os

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from u2net_infer import remove_background
from ai_bg_generator import generate_ai_background, compose_subject_on_background
from openai_service import analyze_image, get_suggested_prompts, get_category_prompts, PROMPT_CATEGORIES, rewrite_prompt
import requests
import json
import logging
from typing import List, Dict
from routes import webhooks, auth, credits, subscription

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ClearPic API",
    description="API for removing backgrounds from images using U2NET",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(credits.router, prefix="/credits", tags=["credits"])
app.include_router(subscription.router, prefix="/subscription", tags=["subscription"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error handler caught: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )

@app.get("/")
async def root():
    return {
        "message": "Welcome to ClearPic API",
        "status": "operational",
        "endpoints": {
            "/webhooks": "Stripe webhook endpoints",
            "/auth": "Authentication endpoints",
            "/credits": "Credit management endpoints",
            "/subscription": "Subscription management endpoints"
        }
    }

# Basic background removal
@app.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    try:
        # Save the uploaded file
        file_path = "temp_input.png"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Remove background
        result_path = remove_background(file_path)
        
        # Read the result and return it
        with open(result_path, "rb") as f:
            result_data = f.read()
        
        # Clean up temporary files
        os.remove(file_path)
        os.remove(result_path)
        
        return Response(content=result_data, media_type="image/png")
        
    except Exception as e:
        # Clean up temporary files if they exist
        if os.path.exists("temp_input.png"):
            os.remove("temp_input.png")
        if os.path.exists("result_removed_bg.png"):
            os.remove("result_removed_bg.png")
        raise HTTPException(status_code=500, detail=str(e))

# AI background replacement
@app.post("/replace-bg")
async def replace_bg(file: UploadFile = File(...), prompt: str = Form(...)):
    try:
        # Save the uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Generate new background
        bg_url = generate_ai_background(prompt)
        
        # Download the background image
        bg_response = requests.get(bg_url)
        bg_path = "temp_bg.png"
        with open(bg_path, "wb") as f:
            f.write(bg_response.content)
        
        # Compose the image
        result_path = compose_subject_on_background(temp_path, bg_path)
        
        # Read the result
        with open(result_path, "rb") as f:
            result_data = f.read()
        
        # Clean up temporary files
        os.remove(temp_path)
        os.remove(bg_path)
        os.remove(result_path)
        
        return Response(content=result_data, media_type="image/png")
    except Exception as e:
        # Clean up temporary files if they exist
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(bg_path):
            os.remove(bg_path)
        if os.path.exists(result_path):
            os.remove(result_path)
        logger.error(f"Error in replace_bg: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rewrite-prompt")
async def rewrite_prompt_api(prompt: str = Form(...)):
    try:
        improved_prompt = await rewrite_prompt(prompt)
        if not improved_prompt:
            raise HTTPException(status_code=500, detail="Failed to rewrite prompt")
        return {"rewritten_prompt": improved_prompt}
    except Exception as e:
        logger.error(f"Error in rewrite_prompt_api: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prompts/{category}")
async def get_prompts(category: str):
    try:
        if category not in PROMPT_CATEGORIES:
            raise HTTPException(status_code=404, detail=f"Category '{category}' not found")
        prompts = get_category_prompts(category)
        return {"prompts": prompts}
    except Exception as e:
        logger.error(f"Error in get_prompts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prompt-categories")
async def get_prompt_categories():
    try:
        categories = list(PROMPT_CATEGORIES.keys())
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Error in get_prompt_categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
