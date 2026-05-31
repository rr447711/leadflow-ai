#!/bin/bash
cd /home/team/shared/backend
echo "=== Starting server in background ==="
node index.js &
SERVER_PID=$!
sleep 2
echo "=== Testing endpoints ==="
curl -s http://localhost:3001/ | head -c 200
echo ""
echo "=== Testing stats ==="
curl -s http://localhost:3001/api/stats
echo ""
echo "=== Testing leads ==="
curl -s http://localhost:3001/api/leads
echo ""
kill $SERVER_PID 2>/dev/null
echo "=== Done ==="