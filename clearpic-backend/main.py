from fastapi import FastAPI, File, UploadFile
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from u2net_infer import remove_background
import io

# Initialize FastAPI
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
    # Read the uploaded file into memory
    contents = await file.read()
    
    # Process the image in memory
    processed_image = remove_background(contents)
    
    # Return the processed image directly
    return Response(content=processed_image, media_type="image/png")
