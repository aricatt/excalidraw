@echo off
setlocal enabledelayedexpansion

echo [33m🚀 Starting Excalidraw Plus Docker Deployment...[0m

:: 1. 停止并清理旧容器
echo [33m🛑 Stopping old containers...[0m
docker-compose down

:: 2. 构建并启动服务
echo [33m🏗️  Building and starting services...[0m
docker-compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker start failed.
    pause
    exit /b %ERRORLEVEL%
)

:: 3. 等待数据库启动
echo [33m⏳ Waiting for database to initialize (10 seconds)...[0m
timeout /t 10 /nobreak >nul

:: 4. 执行数据库迁移
echo [33m🔄 Running database migrations...[0m
docker-compose exec backend npx prisma migrate deploy

if %ERRORLEVEL% EQU 0 (
    echo [32m✅ Database migration successful![0m
) else (
    echo ❌ Database migration failed.
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
echo [33m📚 Full deployment guide: type HTTPS_DEPLOYMENT.md[0m
echo [33m🔍 To view logs: docker-compose logs -f[0m
pause

