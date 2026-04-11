# Build stage
FROM composer:2 AS builder
WORKDIR /usr/src/app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --prefer-dist --no-scripts
COPY . .
RUN composer dump-autoload --optimize

# Production stage
FROM php:8.3-fpm-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache libpq-dev && \
    docker-php-ext-install pdo pdo_pgsql
COPY --from=builder /usr/src/app .
EXPOSE 9000
ENTRYPOINT ["php-fpm"]
