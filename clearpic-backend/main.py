from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from u2net_infer import remove_background
import uuid
import os

# Initialize FastAP
app = FastAPI(
    title="ClearPic.AI API",
    description="API for removing backgrounds from images using U2NET",
    version="1.0.0"
)

# Enable CORS (allows frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔐 In production, replace with your domain
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
            "/remove-bg": "POST - Remove background from an image"
        }
    }

# Background removal endpoint
@app.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    filename = f"input_{uuid.uuid4()}.png"
    output_path = f"output_{uuid.uuid4()}.png"

    # Save uploaded file
    with open(filename, "wb") as f:
        f.write(await file.read())

    # Process background removal
    remove_background(input_path=filename, output_path=output_path)

    # Return processed image
    return FileResponse(output_path, media_type="image/png")
