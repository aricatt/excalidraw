@echo off
setlocal enabledelayedexpansion

echo [34m🚀 Starting Excalidraw Plus Local Development Environment...[0m
echo [33m   Using full Docker containers (including MySQL)[0m
echo.

:: 1. 停止并清理旧容器
echo [33m🛑 Stopping old containers...[0m
docker-compose -f docker-compose.dev.yml down

:: 2. 构建并启动服务
echo [33m🏗️  Building and starting services...[0m
docker-compose -f docker-compose.dev.yml up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo [31m❌ Docker start failed.[0m
    pause
    exit /b %ERRORLEVEL%
)

:: 3. 等待 MySQL 启动
echo [33m⏳ Waiting for MySQL database to start (15 seconds)...[0m
timeout /t 15 /nobreak >nul

:: 4. 检查 MySQL 健康状态
echo [33m🔍 Checking MySQL connection status...[0m
set MYSQL_READY=0
for /L %%i in (1,1,10) do (
    docker-compose -f docker-compose.dev.yml exec -T mysql mysqladmin ping -h localhost -u excalidraw -pexcalidraw_password >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [32m✅ MySQL is ready![0m
        set MYSQL_READY=1
        goto :mysql_ready
    )
    echo [33m   Waiting for MySQL to start... (%%i/10)[0m
    timeout /t 3 /nobreak >nul
)

:mysql_ready
if %MYSQL_READY% EQU 0 (
    echo [31m❌ MySQL startup timeout[0m
    echo [33mPlease check logs: docker-compose -f docker-compose.dev.yml logs mysql[0m
    pause
    exit /b 1
)

:: 5. 执行数据库迁移
echo [33m🔄 Running database migrations...[0m
docker-compose -f docker-compose.dev.yml exec -T backend npx prisma migrate deploy

if %ERRORLEVEL% EQU 0 (
    echo [32m✅ Database migration successful![0m
) else (
    echo [33m⚠️  Database migration failed, trying to push schema...[0m
    docker-compose -f docker-compose.dev.yml exec -T backend npx prisma db push --accept-data-loss
)

echo.
echo [32m🎉 Local Development Environment Deployment Complete![0m
echo.
echo [32m📱 Access URLs (HTTPS):[0m
echo    - Frontend: [34mhttps://localhost[0m
echo    - Backend API: [34mhttps://localhost/api[0m
echo    - Voice Service: [34mhttps://localhost/voice[0m
echo.
echo [33m⚠️  First-time access requires trusting the self-signed certificate[0m
echo    Chrome: Click 'Advanced' -^> 'Proceed to localhost (unsafe)'
echo    Edge: Click 'Advanced' -^> 'Continue to localhost (unsafe)'
echo.
echo [34m💾 Database Info:[0m
echo    - Using local Docker MySQL container
echo    - Database: excalidraw_plus
echo    - Username: excalidraw
echo    - Password: excalidraw_password
echo    - Port: 3306 (internal)
echo.
echo [34m🔧 Development Tools:[0m
echo    - View logs: [33mdocker-compose -f docker-compose.dev.yml logs -f[0m
echo    - Access database: [33mdocker-compose -f docker-compose.dev.yml exec mysql mysql -u excalidraw -p excalidraw_plus[0m
echo    - Prisma Studio: [33mcd servers\api-service ^&^& npx prisma studio[0m
echo    - Stop services: [33mdocker-compose -f docker-compose.dev.yml down[0m
echo.
echo [32m📚 Full documentation: type HTTPS_DEPLOYMENT.md[0m
pause
