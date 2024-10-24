FROM python:3.8-slim

WORKDIR /app

# Set environment variable for Hugging Face cache to /app/data
ENV TRANSFORMERS_CACHE=/app/data

# Create the 'data' directory and set permissions
RUN mkdir -p /app/data && chmod -R 777 /app/data

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["python", "app.py"]
