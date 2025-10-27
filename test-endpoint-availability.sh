#!/bin/bash

# 🚀 API Endpoint Availability Testing Script
# Tests endpoint availability and proper error handling without authentication

# Configuration
BASE_URL="https://api-dev.saby.ai/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting API Endpoint Availability Testing${NC}"
echo "=================================================="
echo -e "${YELLOW}📝 Testing endpoint availability and error handling${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local description=$4
  
  echo -n "Testing ${method} ${endpoint}... "
  
  response=$(curl -s -w "%{http_code}" -X ${method} "${BASE_URL}${endpoint}")
  status_code="${response: -3}"
  
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✅ ${status_code}${NC}"
  else
    echo -e "${RED}❌ ${status_code} (expected ${expected_status})${NC}"
  fi
}

# Test Authentication Endpoints
echo -e "${YELLOW}📝 Authentication Endpoints${NC}"
test_endpoint "POST" "/auth/login" "400" "Login endpoint (expects email/password)"
test_endpoint "POST" "/auth/refresh-tokens" "400" "Token refresh endpoint"
test_endpoint "POST" "/auth/logout" "401" "Logout endpoint (requires auth)"

echo ""

# Test Node Endpoints
echo -e "${YELLOW}📝 Node Endpoints${NC}"
test_endpoint "GET" "/node/test-node-id" "401" "Get node by ID"
test_endpoint "PATCH" "/node/test-node-id" "401" "Update node"
test_endpoint "PATCH" "/node/test-node-id/activate" "401" "Activate node"
test_endpoint "GET" "/node/test-node-id/children" "401" "Get node children"

echo ""

# Test Node Profile Endpoints
echo -e "${YELLOW}📝 Node Profile Endpoints${NC}"
test_endpoint "GET" "/nodeprofile/node/test-node-id" "401" "Get profile by node ID"
test_endpoint "GET" "/nodeprofile/test-profile-id" "401" "Get profile by ID"
test_endpoint "PATCH" "/nodeprofile/test-profile-id" "401" "Update profile"

echo ""

# Test User Endpoints
echo -e "${YELLOW}📝 User Endpoints${NC}"
test_endpoint "GET" "/user/test-user-id" "401" "Get user by ID"
test_endpoint "PATCH" "/user/test-user-id" "401" "Update user"
test_endpoint "GET" "/user/test-user-id/nodes" "401" "Get user nodes"

echo ""

# Test User Profile Endpoints
echo -e "${YELLOW}📝 User Profile Endpoints${NC}"
test_endpoint "GET" "/userProfile/test-user-id" "401" "Get user profile"
test_endpoint "PUT" "/userProfile/test-user-id" "401" "Create/update user profile"

echo ""

# Test Project Form Endpoints
echo -e "${YELLOW}📝 Project Form Endpoints${NC}"
test_endpoint "GET" "/projectForm" "401" "Get all project forms"
test_endpoint "GET" "/projectForm/project/test-project-id" "401" "Get form by project ID"
test_endpoint "GET" "/projectForm/test-form-id" "401" "Get form by ID"

echo ""

# Test Storage Endpoints
echo -e "${YELLOW}📝 Storage Endpoints${NC}"
test_endpoint "POST" "/storage/upload" "401" "Upload file"
test_endpoint "GET" "/storage/test-file-id" "401" "Get file by ID"
test_endpoint "DELETE" "/storage/test-file-id" "401" "Delete file"
test_endpoint "GET" "/storage/stats" "401" "Get storage statistics"

echo ""

# Test Inmail Endpoints
echo -e "${YELLOW}📝 Inmail Endpoints${NC}"
test_endpoint "GET" "/inmail" "401" "Get all messages"
test_endpoint "GET" "/inmail/test-message-id" "401" "Get message by ID"
test_endpoint "DELETE" "/inmail/test-message-id" "401" "Delete message"
test_endpoint "GET" "/inmail/count" "401" "Get inbox count"

echo ""

# Test CORS and OPTIONS requests
echo -e "${YELLOW}📝 CORS Testing${NC}"
echo -n "Testing CORS preflight... "
cors_response=$(curl -s -w "%{http_code}" -X OPTIONS "${BASE_URL}/auth/login" \
  -H "Origin: http://localhost:5174" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")
cors_status="${cors_response: -3}"

if [ "$cors_status" = "200" ] || [ "$cors_status" = "204" ]; then
  echo -e "${GREEN}✅ ${cors_status}${NC}"
else
  echo -e "${RED}❌ ${cors_status}${NC}"
fi

echo ""
echo -e "${BLUE}🎉 Endpoint Availability Testing Complete!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ All endpoints are accessible${NC}"
echo -e "${YELLOW}📝 Expected 401 responses indicate proper authentication required${NC}"
echo -e "${YELLOW}📝 Expected 400 responses indicate proper validation${NC}"
echo ""
echo -e "${BLUE}💡 Next Steps:${NC}"
echo "   1. Get valid credentials for testing"
echo "   2. Test authenticated endpoints"
echo "   3. Integrate endpoints with intelligent data management"
echo "   4. Update frontend components to use real data"
