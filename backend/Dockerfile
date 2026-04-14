FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source into backend/
COPY . ./backend/

# Set Python path to /app so 'import backend' works
ENV PYTHONPATH=/app

# Make entrypoint executable
RUN chmod +x ./backend/entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["./backend/entrypoint.sh"]
