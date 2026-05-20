FROM python:3.11-slim

WORKDIR /app

# System deps for OpenCV, librosa, etc.
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglx-mesa0 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.docker.txt .
RUN pip install --default-timeout=300 --retries 5 --trusted-host pypi.org --trusted-host files.pythonhosted.org --no-cache-dir -r requirements.docker.txt

COPY app/ ./app/
COPY models/ ./models/

ENV PYTHONPATH=/app
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
