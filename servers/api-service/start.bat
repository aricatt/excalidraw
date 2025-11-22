@echo off
rem Excalidraw Plus API Service Startup Script (Windows)

setlocal

echo.
echo [INFO] Starting Excalidraw Plus API Service...

rem Check if Docker is running
echo.
echo [INFO] Checking Docker status...
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop manually and try again.
    echo [HINT]  You can start Docker Desktop from the Start Menu or a desktop shortcut.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Docker is running correctly.
)

rem Start PostgreSQL and Redis containers
echo.
echo [INFO] Starting database services...
npm run docker:dev

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker containers. Please check Docker and the docker-compose.dev.yml file.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Database containers started successfully.
echo [INFO] Waiting 10 seconds to ensure database services are ready...
timeout /t 10 /nobreak > nul

endlocal
