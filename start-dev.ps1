Write-Host "Starting LogisticFlow Development Server..." -ForegroundColor Green
Write-Host ""

# Set environment variables
$env:NODE_ENV = "development"
$env:PORT = "3000"

Write-Host "Environment: $env:NODE_ENV" -ForegroundColor Yellow
Write-Host "Port: $env:PORT" -ForegroundColor Yellow
Write-Host ""

# Start the development server
Write-Host "Starting server with tsx..." -ForegroundColor Cyan
npx tsx server/index.ts 