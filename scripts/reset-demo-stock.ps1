# Reset stock to 1 for race condition demo (PowerShell)

Write-Host "🔄 Resetting stock to 1 for race condition demo..." -ForegroundColor Yellow

# Update PostgreSQL
docker exec postgres psql -U flashsale -d flash_sale -c "UPDATE products SET current_stock = 1 WHERE id = 'FLASH_SALE_PRODUCT_001';"

# Update Redis
docker exec redis redis-cli -a flashsale123 SET stock:FLASH_SALE_PRODUCT_001 1

Write-Host "✅ Stock reset to 1" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Demo Instructions:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000 in 2 browser tabs/windows"
Write-Host "2. Fill in different user IDs (e.g., user_1 and user_2)"
Write-Host "3. Click 'Buy Now' simultaneously in both tabs"
Write-Host "4. Only ONE order will be CONFIRMED, the other will be CANCELLED (Out of stock)"
Write-Host ""
Write-Host "This demonstrates Kafka's event-driven architecture and Redis atomic operations preventing race conditions!" -ForegroundColor Magenta

