FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy API source code
COPY api/ ./api/

# Copy model artifacts AND the src/ module (data_pipeline.py lives here)
COPY model/artifacts/ ./model/artifacts/
COPY model/src/ ./model/src/

WORKDIR /app/api

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
