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
echo    - Frontend: http://localhost:4417
echo    - Backend API: http://localhost:6601
echo    - Voice Service: http://localhost:4408
echo.
echo [33mTo view logs: docker-compose logs -f[0m
pause
