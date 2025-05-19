# ClearPic.AI Backend

A FastAPI-based backend service for removing backgrounds from images using the U2NET model.

## Features

- Background removal from images
- RESTful API endpoints
- CORS enabled for frontend integration
- Fast and efficient image processing

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Download the U2NET model weights:
```bash
python U-2-Net/setup_model_weights.py
```

## Running the Server

Start the server with:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /`: API information
- `POST /remove-bg`: Remove background from an image
  - Accepts: Image file (multipart/form-data)
  - Returns: Processed image with transparent background

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## License

MIT License 