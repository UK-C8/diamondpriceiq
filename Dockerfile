FROM python:3.11-slim

WORKDIR /app

# LightGBM requires libgomp (GNU OpenMP runtime), not included in slim
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy API source code
COPY api/ ./api/

# Copy model artifacts AND the src/ module (data_pipeline.py lives here)
COPY model/artifacts/ ./model/artifacts/
COPY model/src/ ./model/src/

# Make data_pipeline importable regardless of MODEL_DIR value
ENV PYTHONPATH="/app/model/src:${PYTHONPATH}"

WORKDIR /app/api

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
