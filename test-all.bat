@echo off
echo ========================================
echo Testing PII Detection System
echo ========================================
echo.

echo [1/6] Testing Health Check...
curl -s http://localhost:3000/health
echo.
echo.

echo [2/6] Testing PII Detection - Phone Number (should detect)...
curl -s -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Call me at 555-1234\", \"userId\": \"test-user\"}"
echo.
echo.

echo [3/6] Testing PII Detection - Email (should detect)...
curl -s -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Email me at john@example.com\", \"userId\": \"test-user\"}"
echo.
echo.

echo [4/6] Testing PII Detection - Clean Message (should NOT detect)...
curl -s -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Hello, how are you doing today?\", \"userId\": \"test-user\"}"
echo.
echo.

echo [5/6] Testing Send Message - With PII (should flag)...
curl -s -X POST http://localhost:3000/api/chat/send-message -H "Content-Type: application/json" -d "{\"message\": \"Contact me at 555-9999\", \"senderId\": \"user123\", \"receiverId\": \"user456\"}"
echo.
echo.

echo [6/6] Testing API Stats...
curl -s http://localhost:3000/api/stats
echo.
echo.

echo ========================================
echo All tests completed!
echo ========================================
echo.
echo Check the responses above to verify:
echo - Health check returned "status": "ok"
echo - PII was detected in messages 2 and 3
echo - No PII detected in message 4
echo - Message 5 was flagged
echo - Stats show request counts
echo.
pause
