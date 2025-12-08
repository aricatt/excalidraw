@echo off
setlocal enabledelayedexpansion

echo [34m🚀 Starting Excalidraw Plus Production Deployment...[0m
echo [33m   Using external Aliyun RDS MySQL database[0m
echo [33m   For local development, use: docker-dev.bat[0m
echo.

:: 检查 .env 文件
if not exist "servers\api-service\.env" (
    echo [31m❌ Error: .env file not found[0m
    echo [33mPlease configure database connection first:[0m
    echo    1. Copy example file: copy servers\api-service\.env.example servers\api-service\.env
    echo    2. Edit .env file with your Aliyun RDS MySQL connection info
    echo    3. Format: DATABASE_URL="mysql://username:password@RDS_HOST:3306/database_name"
    pause
    exit /b 1
)

:: 1. 停止并清理旧容器
echo [33m🛑 Stopping old containers...[0m
docker-compose down

:: 2. 构建并启动服务
echo [33m🏗️  Building and starting services...[0m
docker-compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo [31m❌ Docker start failed.[0m
    pause
    exit /b %ERRORLEVEL%
)

:: 3. 等待服务启动
echo [33m⏳ Waiting for services to start (5 seconds)...[0m
timeout /t 5 /nobreak >nul

:: 4. 执行数据库迁移
echo [33m🔄 Running database migrations...[0m
echo [33m   Connecting to Aliyun RDS MySQL...[0m
docker-compose exec -T backend npx prisma migrate deploy

if %ERRORLEVEL% EQU 0 (
    echo [32m✅ Database migration successful![0m
) else (
    echo [31m❌ Database migration failed[0m
    echo [33mPossible reasons:[0m
    echo    1. Incorrect RDS MySQL connection info
    echo    2. Server IP not in RDS whitelist
    echo    3. Database does not exist or insufficient permissions
    echo.
    echo [33mPlease check DATABASE_URL in servers\api-service\.env[0m
    echo [33mFor first deployment, create database in RDS first:[0m
    echo    CREATE DATABASE excalidraw_plus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
)

echo.
echo [32m🎉 Deployment Complete![0m
echo.
echo [32m📱 Access URLs (HTTPS):[0m
echo    - Frontend: https://localhost
echo    - Backend API: https://localhost/api
echo    - Voice Service: https://localhost/voice
echo.
echo [33m⚠️  First-time access requires trusting the self-signed certificate[0m
echo    Chrome: Click 'Advanced' -^> 'Proceed to localhost (unsafe)'
echo    Edge: Click 'Advanced' -^> 'Continue to localhost (unsafe)'
echo.
echo [33m💾 Database Info:[0m
echo    - Using external Aliyun RDS MySQL
echo    - Data persistence managed by Aliyun RDS
echo.
echo [33m📚 Full deployment guide: type HTTPS_DEPLOYMENT.md[0m
echo [33m🔍 To view logs: docker-compose logs -f[0m
pause


