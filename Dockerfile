FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy API source code
COPY api/ ./api/

# Copy model artifacts (needed by the API at runtime)
COPY model/artifacts/ ./model/artifacts/

WORKDIR /app/api

EXPOSE 8000

# $PORT is set by Railway at runtime; fall back to 8000 for local Docker runs
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
