@echo off
echo Starting LogisticFlow Development Server...
echo.

REM Set environment variables for Windows
set NODE_ENV=development
set PORT=3000

echo Environment: %NODE_ENV%
echo Port: %PORT%
echo.

REM Start the development server
echo Starting server with tsx...
npx tsx server/index.ts

pause 