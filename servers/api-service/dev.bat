@echo off
rem One-click script to start the full development environment (Windows)

setlocal

echo.
echo [INFO] Starting the full development environment...

rem Step 1: Prepare the environment by running start.bat
call start.bat
if %errorlevel% neq 0 (
    echo [ERROR] Environment preparation failed (start.bat).
    pause
    exit /b 1
)

rem Step 2: Update the database schema
echo.
echo [INFO] Updating database schema...
npm run db:push

if %errorlevel% neq 0 (
    echo [ERROR] Database schema update failed (db:push).
    pause
    exit /b 1
)

echo [SUCCESS] Database schema updated.

rem Step 3: Start the API server
echo.
echo [INFO] Starting the API server...
echo [HINT] Press Ctrl+C to stop the server.
echo.
npm run dev

endlocal

