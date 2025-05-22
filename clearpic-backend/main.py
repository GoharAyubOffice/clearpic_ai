from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from u2net_infer import remove_background
from ai_bg_generator import generate_ai_background, compose_subject_on_background
import requests

# Initialize FastAPI
app = FastAPI(
    title="ClearPic.AI API",
    description="API for removing backgrounds from images using U2NET",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update to frontend domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to ClearPic.AI API",
        "endpoints": {
            "/remove-bg": "POST - Remove background from an image",
            "/replace-bg": "POST - Replace background with AI-generated image"
        }
    }

# Basic background removal
@app.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    contents = await file.read()
    result = remove_background(contents)
    return Response(content=result, media_type="image/png")

# AI background replacement
@app.post("/replace-bg")
async def replace_bg(prompt: str = Form(...), file: UploadFile = File(...)):
    try:
        # Read uploaded image
        contents = await file.read()

        # Remove background → subject RGBA image
        subject_image = remove_background(contents)

        # Generate AI background from prompt
        bg_url = generate_ai_background(prompt)

        # Download background image from Replicate
        bg_response = requests.get(bg_url)
        bg_image = bg_response.content

        # Compose final result in memory
        composite_image = compose_subject_on_background(
            subject_image=subject_image,
            background_image=bg_image
        )

        return Response(content=composite_image, media_type="image/png")

    except Exception as e:
        return Response(
            content=str(e),
            status_code=500,
            media_type="text/plain"
        )
