FROM python:3.12-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache gcc musl-dev libpq-dev
COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# Production stage
FROM python:3.12-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache libpq
COPY --from=builder /install /usr/local
COPY . .
EXPOSE 5001
ENTRYPOINT ["python", "app.py"]