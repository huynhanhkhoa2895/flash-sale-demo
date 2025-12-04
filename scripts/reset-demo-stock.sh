#!/bin/bash
# Reset stock to 1 for race condition demo

echo "🔄 Resetting stock to 1 for race condition demo..."

# Update PostgreSQL
docker exec postgres psql -U flashsale -d flash_sale -c "UPDATE products SET current_stock = 1 WHERE id = 'FLASH_SALE_PRODUCT_001';"

# Update Redis
docker exec redis redis-cli -a flashsale123 SET stock:FLASH_SALE_PRODUCT_001 1

echo "✅ Stock reset to 1"
echo ""
echo "📝 Demo Instructions:"
echo "1. Open http://localhost:3000 in 2 browser tabs/windows"
echo "2. Fill in different user IDs (e.g., user_1 and user_2)"
echo "3. Click 'Buy Now' simultaneously in both tabs"
echo "4. Only ONE order will be CONFIRMED, the other will be CANCELLED (Out of stock)"
echo ""
echo "This demonstrates Kafka's event-driven architecture and Redis atomic operations preventing race conditions!"

