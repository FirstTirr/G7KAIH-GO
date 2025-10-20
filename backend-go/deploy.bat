@echo off
REM G7KAIH Backend Deployment Script for Windows
REM Usage: deploy.bat [mode] [environment]

setlocal enabledelayedexpansion

set MODE=%1
set ENVIRONMENT=%2

if "%MODE%"=="" set MODE=monolith
if "%ENVIRONMENT%"=="" set ENVIRONMENT=development

echo ========================================
echo G7KAIH Backend Deployment
echo ========================================
echo Mode: %MODE%
echo Environment: %ENVIRONMENT%
echo ========================================

REM Check if .env exists
if not exist .env (
    echo [WARNING] .env file not found. Creating from .env.example...
    copy .env.example .env
    echo [INFO] Please edit .env file with your configuration
    pause
    exit /b 1
)

if "%MODE%"=="monolith" goto :monolith
if "%MODE%"=="mono" goto :monolith
if "%MODE%"=="microservices" goto :microservices
if "%MODE%"=="micro" goto :microservices

echo [ERROR] Invalid mode: %MODE%
echo Usage: deploy.bat [monolith^|microservices] [development^|staging^|production]
exit /b 1

:monolith
echo [INFO] Starting monolith deployment...
docker-compose down
docker-compose build
docker-compose up -d

echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak > nul

echo [INFO] Checking API health...
curl -f http://localhost:8080/health > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] API is healthy
) else (
    echo [ERROR] API health check failed
    docker-compose logs api
    exit /b 1
)

echo [INFO] Monolith deployment completed!
echo [INFO] API: http://localhost:8080
echo [INFO] Swagger: http://localhost:8080/swagger/index.html
goto :end

:microservices
echo [INFO] Starting microservices deployment...
docker-compose -f docker-compose.microservices.yml down
docker-compose -f docker-compose.microservices.yml build
docker-compose -f docker-compose.microservices.yml up -d

echo [INFO] Waiting for services to be ready...
timeout /t 15 /nobreak > nul

echo [INFO] Checking services health...
curl -f http://localhost:8080/health > nul 2>&1 && echo [INFO] API Gateway is healthy || echo [WARNING] API Gateway health check failed
curl -f http://localhost:8081/health > nul 2>&1 && echo [INFO] Auth Service is healthy || echo [WARNING] Auth Service health check failed
curl -f http://localhost:8082/health > nul 2>&1 && echo [INFO] Storage Service is healthy || echo [WARNING] Storage Service health check failed

echo [INFO] Microservices deployment completed!
echo [INFO] Nginx: http://localhost:80
echo [INFO] API Gateway: http://localhost:8080
goto :end

:end
echo.
echo [INFO] Running containers:
docker ps

echo.
echo [INFO] To view logs: docker-compose logs -f
echo [INFO] To stop: docker-compose down
pause
