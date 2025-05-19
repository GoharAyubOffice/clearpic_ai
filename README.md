# ClearPic.AI

ClearPic.AI is a web application that removes backgrounds from images using the U2NET model. It consists of a Next.js frontend and a FastAPI backend.

## Project Structure

```
clearpic_ai/
├── clearpic-backend/     # FastAPI backend
│   ├── U-2-Net/         # U2NET model files
│   ├── main.py          # FastAPI application
│   └── u2net_infer.py   # Background removal logic
└── clearpic-frontend/    # Next.js frontend
    ├── pages/           # Next.js pages
    ├── public/          # Static assets
    └── styles/          # CSS styles
```

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd clearpic-backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

4. Install Python dependencies:
```bash
pip install -r requirements.txt
```

5. Download the U2NET model weights:
```bash
python U-2-Net/setup_model_weights.py
```

6. Start the backend server:
```bash
uvicorn main:app --reload
```
The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd clearpic-frontend
```

2. Install Node.js dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```
The frontend will be available at `http://localhost:3000`

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Click the upload button or drag and drop an image
3. Wait for the background removal process to complete
4. Download the processed image with a transparent background

## API Endpoints

### Backend API

- `GET /`: API information
- `POST /remove-bg`: Remove background from an image
  - Accepts: Image file (multipart/form-data)
  - Returns: Processed image with transparent background

### API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

### Backend Development

The backend is built with:
- FastAPI
- U2NET for background removal
- Python 3.8+

### Frontend Development

The frontend is built with:
- Next.js
- TypeScript
- Tailwind CSS

## Troubleshooting

1. If you get a "Model weights not found" error:
   - Make sure you've run `python U-2-Net/setup_model_weights.py`
   - Check if the weights file exists at `U-2-Net/saved_models/u2net/u2net.pth`

2. If the frontend can't connect to the backend:
   - Ensure both servers are running
   - Check if the backend URL is correctly configured in the frontend
   - Verify CORS settings in the backend

3. If you get dependency errors:
   - Make sure you're using the correct Python version
   - Try updating pip: `python -m pip install --upgrade pip`
   - Reinstall dependencies: `pip install -r requirements.txt`

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](clearpic-backend/LICENSE) file for details. 