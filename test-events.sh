# Script de Testing Rápido - Orchestrator

echo "🧪 Testing Smart Wallet Orchestrator"
echo "===================================="
echo ""

# Test 1: Financial Insight Agent
echo "📊 Test 1: NEW_TRANSACTION → Financial Insight Agent"
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "type": "NEW_TRANSACTION",
    "data": {
      "amount": 50000,
      "category": "food"
    }
  }'
echo -e "\n"

# Test 2: Goals Agent
echo "🎯 Test 2: NEW_GOAL_CREATED → Goals Agent"
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user456",
    "type": "NEW_GOAL_CREATED",
    "data": {
      "name": "Comprar moto",
      "targetAmount": 5000000
    }
  }'
echo -e "\n"

# Test 3: Budget Balancer Agent
echo "💰 Test 3: SPENDING_LIMIT_EXCEEDED → Budget Balancer Agent"
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user789",
    "type": "SPENDING_LIMIT_EXCEEDED",
    "data": {
      "category": "entertainment",
      "overspent": 20000
    }
  }'
echo -e "\n"

# Test 4: Motivational Coach Agent
echo "🎉 Test 4: MILESTONE_REACHED → Motivational Coach Agent"
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user999",
    "type": "MILESTONE_REACHED",
    "data": {
      "goalId": "goal001",
      "milestone": "25%"
    }
  }'
echo -e "\n"

echo "✅ Tests completados!"
