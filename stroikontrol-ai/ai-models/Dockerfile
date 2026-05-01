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

COPY requirements.txt .
RUN pip install --default-timeout=300 --no-cache-dir -r requirements.txt

COPY cv/ ./cv/
COPY audio/ ./audio/
COPY training/ ./training/

ENV PYTHONPATH=/app
ENV CUDA_VISIBLE_DEVICES=""

CMD ["python3", "-c", "print('ML worker (CPU) ready')"]
