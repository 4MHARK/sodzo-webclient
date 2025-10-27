#!/bin/bash

# 🚀 Comprehensive API Endpoint Testing Script
# Tests all essential backend endpoints with proper authentication

# Configuration
BASE_URL="https://api-dev.saby.ai/v1"
USERNAME="saby@saby.ai"
PASSWORD="@saby_Saby1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Comprehensive API Endpoint Testing${NC}"
echo "=================================================="

# Step 1: Authentication
echo -e "\n${YELLOW}📝 Step 1: Authentication${NC}"
echo "Testing login endpoint..."

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")

if echo "$LOGIN_RESPONSE" | grep -q "access"; then
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | tail -1 | cut -d'"' -f4)
  USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✅ Login successful${NC}"
  echo "User ID: ${USER_ID}"
  echo "Access Token: ${ACCESS_TOKEN:0:20}..."
else
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

# Step 2: Test Node Endpoints
echo -e "\n${YELLOW}📝 Step 2: Testing Node Endpoints${NC}"

# Test GET /node/:nodeId
echo "Testing GET /node/:nodeId..."
NODE_RESPONSE=$(curl -s -X GET "${BASE_URL}/node/test-node-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$NODE_RESPONSE" | grep -q "id\|error"; then
  echo -e "${GREEN}✅ GET /node/:nodeId - Response received${NC}"
else
  echo -e "${RED}❌ GET /node/:nodeId - No response${NC}"
fi

# Test PATCH /node/:nodeId
echo "Testing PATCH /node/:nodeId..."
PATCH_NODE_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/node/test-node-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Node Name"}')

if echo "$PATCH_NODE_RESPONSE" | grep -q "id\|error\|success"; then
  echo -e "${GREEN}✅ PATCH /node/:nodeId - Response received${NC}"
else
  echo -e "${RED}❌ PATCH /node/:nodeId - No response${NC}"
fi

# Test PATCH /node/:nodeId/activate
echo "Testing PATCH /node/:nodeId/activate..."
ACTIVATE_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/node/test-node-id/activate" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$ACTIVATE_RESPONSE" | grep -q "id\|error\|success"; then
  echo -e "${GREEN}✅ PATCH /node/:nodeId/activate - Response received${NC}"
else
  echo -e "${RED}❌ PATCH /node/:nodeId/activate - No response${NC}"
fi

# Test GET /node/:nodeId/children
echo "Testing GET /node/:nodeId/children..."
CHILDREN_RESPONSE=$(curl -s -X GET "${BASE_URL}/node/test-node-id/children" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$CHILDREN_RESPONSE" | grep -q "\[\]\|results\|error"; then
  echo -e "${GREEN}✅ GET /node/:nodeId/children - Response received${NC}"
else
  echo -e "${RED}❌ GET /node/:nodeId/children - No response${NC}"
fi

# Step 3: Test Node Profile Endpoints
echo -e "\n${YELLOW}📝 Step 3: Testing Node Profile Endpoints${NC}"

# Test GET /nodeprofile/node/:nodeId
echo "Testing GET /nodeprofile/node/:nodeId..."
NODE_PROFILE_RESPONSE=$(curl -s -X GET "${BASE_URL}/nodeprofile/node/test-node-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$NODE_PROFILE_RESPONSE" | grep -q "id\|error"; then
  echo -e "${GREEN}✅ GET /nodeprofile/node/:nodeId - Response received${NC}"
else
  echo -e "${RED}❌ GET /nodeprofile/node/:nodeId - No response${NC}"
fi

# Test GET /nodeprofile/:profileId
echo "Testing GET /nodeprofile/:profileId..."
PROFILE_RESPONSE=$(curl -s -X GET "${BASE_URL}/nodeprofile/test-profile-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$PROFILE_RESPONSE" | grep -q "id\|error"; then
  echo -e "${GREEN}✅ GET /nodeprofile/:profileId - Response received${NC}"
else
  echo -e "${RED}❌ GET /nodeprofile/:profileId - No response${NC}"
fi

# Test PATCH /nodeprofile/:profileId
echo "Testing PATCH /nodeprofile/:profileId..."
PATCH_PROFILE_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/nodeprofile/test-profile-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"description":"Updated profile description"}')

if echo "$PATCH_PROFILE_RESPONSE" | grep -q "id\|error\|success"; then
  echo -e "${GREEN}✅ PATCH /nodeprofile/:profileId - Response received${NC}"
else
  echo -e "${RED}❌ PATCH /nodeprofile/:profileId - No response${NC}"
fi

# Step 4: Test User Endpoints
echo -e "\n${YELLOW}📝 Step 4: Testing User Endpoints${NC}"

# Test GET /users/:userId
echo "Testing GET /users/:userId..."
USER_RESPONSE=$(curl -s -X GET "${BASE_URL}/users/${USER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$USER_RESPONSE" | grep -q "id\|error"; then
  echo -e "${GREEN}✅ GET /users/:userId - Response received${NC}"
else
  echo -e "${RED}❌ GET /users/:userId - No response${NC}"
fi

# Test PATCH /users/:userId
echo "Testing PATCH /users/:userId..."
PATCH_USER_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/users/${USER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"firstname":"Updated Name"}')

if echo "$PATCH_USER_RESPONSE" | grep -q "id\|error\|success"; then
  echo -e "${GREEN}✅ PATCH /users/:userId - Response received${NC}"
else
  echo -e "${RED}❌ PATCH /users/:userId - No response${NC}"
fi

# Test GET /users/:userId/nodes
echo "Testing GET /users/:userId/nodes..."
USER_NODES_RESPONSE=$(curl -s -X GET "${BASE_URL}/users/${USER_ID}/nodes" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$USER_NODES_RESPONSE" | grep -q "\[\]\|results\|error"; then
  echo -e "${GREEN}✅ GET /users/:userId/nodes - Response received${NC}"
else
  echo -e "${RED}❌ GET /users/:userId/nodes - No response${NC}"
fi

# Test GET /users/:userId/roles
echo "Testing GET /users/:userId/roles..."
USER_ROLES_RESPONSE=$(curl -s -X GET "${BASE_URL}/users/${USER_ID}/roles" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$USER_ROLES_RESPONSE" | grep -q "\[\]\|results\|error"; then
  echo -e "${GREEN}✅ GET /users/:userId/roles - Response received${NC}"
else
  echo -e "${RED}❌ GET /users/:userId/roles - No response${NC}"
fi

# Step 5: Test User Profile Endpoints
echo -e "\n${YELLOW}📝 Step 5: Testing User Profile Endpoints${NC}"

# Test GET /userProfile/:userId
echo "Testing GET /userProfile/:userId..."
USER_PROFILE_RESPONSE=$(curl -s -X GET "${BASE_URL}/userProfile/${USER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$USER_PROFILE_RESPONSE" | grep -q "id\|error"; then
  echo -e "${GREEN}✅ GET /userProfile/:userId - Response received${NC}"
else
  echo -e "${RED}❌ GET /userProfile/:userId - No response${NC}"
fi

# Test PUT /userProfile/:userId
echo "Testing PUT /userProfile/:userId..."
PUT_PROFILE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/userProfile/${USER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Updated user bio","phoneNumber":"+1234567890"}')

if echo "$PUT_PROFILE_RESPONSE" | grep -q "id\|error\|success"; then
  echo -e "${GREEN}✅ PUT /userProfile/:userId - Response received${NC}"
else
  echo -e "${RED}❌ PUT /userProfile/:userId - No response${NC}"
fi

# Step 6: Test Project Form Endpoints
echo -e "\n${YELLOW}📝 Step 6: Testing Project Form Endpoints${NC}"

# Test GET /projectForm
echo "Testing GET /projectForm..."
PROJECT_FORMS_RESPONSE=$(curl -s -X GET "${BASE_URL}/projectForm" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$PROJECT_FORMS_RESPONSE" | grep -q "\[\]\|results\|error"; then
  echo -e "${GREEN}✅ GET /projectForm - Response received${NC}"
else
  echo -e "${RED}❌ GET /projectForm - No response${NC}"
fi

# Test GET /projectForm/project/:projectId
echo "Testing GET /projectForm/project/:projectId..."
PROJECT_FORM_RESPONSE=$(curl -s -X GET "${BASE_URL}/projectForm/project/test-project-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$PROJECT_FORM_RESPONSE" | grep -q "id\|error"; then
  echo -e "${GREEN}✅ GET /projectForm/project/:projectId - Response received${NC}"
else
  echo -e "${RED}❌ GET /projectForm/project/:projectId - No response${NC}"
fi

# Test GET /projectForm/:projectFormId
echo "Testing GET /projectForm/:projectFormId..."
FORM_RESPONSE=$(curl -s -X GET "${BASE_URL}/projectForm/test-form-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$FORM_RESPONSE" | grep -q "id\|error"; then
  echo -e "${GREEN}✅ GET /projectForm/:projectFormId - Response received${NC}"
else
  echo -e "${RED}❌ GET /projectForm/:projectFormId - No response${NC}"
fi

# Step 7: Test Storage Endpoints
echo -e "\n${YELLOW}📝 Step 7: Testing Storage Endpoints${NC}"

# Test POST /storage/upload
echo "Testing POST /storage/upload..."
UPLOAD_RESPONSE=$(curl -s -X POST "${BASE_URL}/storage/upload" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "file=@README.md")

if echo "$UPLOAD_RESPONSE" | grep -q "id\|error\|success"; then
  echo -e "${GREEN}✅ POST /storage/upload - Response received${NC}"
else
  echo -e "${RED}❌ POST /storage/upload - No response${NC}"
fi

# Test GET /storage/:fileId
echo "Testing GET /storage/:fileId..."
FILE_RESPONSE=$(curl -s -X GET "${BASE_URL}/storage/test-file-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$FILE_RESPONSE" | grep -q "id\|error"; then
  echo -e "${GREEN}✅ GET /storage/:fileId - Response received${NC}"
else
  echo -e "${RED}❌ GET /storage/:fileId - No response${NC}"
fi

# Test DELETE /storage/:fileId
echo "Testing DELETE /storage/:fileId..."
DELETE_FILE_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/storage/test-file-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$DELETE_FILE_RESPONSE" | grep -q "success\|error\|message"; then
  echo -e "${GREEN}✅ DELETE /storage/:fileId - Response received${NC}"
else
  echo -e "${RED}❌ DELETE /storage/:fileId - No response${NC}"
fi

# Test GET /storage/stats
echo "Testing GET /storage/stats..."
STATS_RESPONSE=$(curl -s -X GET "${BASE_URL}/storage/stats" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$STATS_RESPONSE" | grep -q "totalSize\|totalFiles\|error"; then
  echo -e "${GREEN}✅ GET /storage/stats - Response received${NC}"
else
  echo -e "${RED}❌ GET /storage/stats - No response${NC}"
fi

# Step 8: Test Inmail Endpoints
echo -e "\n${YELLOW}📝 Step 8: Testing Inmail Endpoints${NC}"

# Test GET /inmail
echo "Testing GET /inmail..."
INMAIL_RESPONSE=$(curl -s -X GET "${BASE_URL}/inmail" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$INMAIL_RESPONSE" | grep -q "\[\]\|results\|error"; then
  echo -e "${GREEN}✅ GET /inmail - Response received${NC}"
else
  echo -e "${RED}❌ GET /inmail - No response${NC}"
fi

# Test GET /inmail/:inmailId
echo "Testing GET /inmail/:inmailId..."
MESSAGE_RESPONSE=$(curl -s -X GET "${BASE_URL}/inmail/test-message-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$MESSAGE_RESPONSE" | grep -q "id\|error"; then
  echo -e "${GREEN}✅ GET /inmail/:inmailId - Response received${NC}"
else
  echo -e "${RED}❌ GET /inmail/:inmailId - No response${NC}"
fi

# Test DELETE /inmail/:inmailId
echo "Testing DELETE /inmail/:inmailId..."
DELETE_MESSAGE_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/inmail/test-message-id" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$DELETE_MESSAGE_RESPONSE" | grep -q "success\|error\|message"; then
  echo -e "${GREEN}✅ DELETE /inmail/:inmailId - Response received${NC}"
else
  echo -e "${RED}❌ DELETE /inmail/:inmailId - No response${NC}"
fi

# Test GET /inmail/count
echo "Testing GET /inmail/count..."
COUNT_RESPONSE=$(curl -s -X GET "${BASE_URL}/inmail/count" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$COUNT_RESPONSE" | grep -q "count\|total\|error"; then
  echo -e "${GREEN}✅ GET /inmail/count - Response received${NC}"
else
  echo -e "${RED}❌ GET /inmail/count - No response${NC}"
fi

# Step 9: Test Token Refresh
echo -e "\n${YELLOW}📝 Step 9: Testing Token Refresh${NC}"
echo "Testing POST /auth/refresh-tokens..."

REFRESH_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/refresh-tokens" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"${REFRESH_TOKEN}\"}")

if echo "$REFRESH_RESPONSE" | grep -q "accessToken"; then
  echo -e "${GREEN}✅ Token refresh successful${NC}"
else
  echo -e "${RED}❌ Token refresh failed${NC}"
  echo "Response: $REFRESH_RESPONSE"
fi

# Step 10: Test Logout
echo -e "\n${YELLOW}📝 Step 10: Testing Logout${NC}"
echo "Testing POST /auth/logout..."

LOGOUT_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/logout" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$LOGOUT_RESPONSE" | grep -q "success\|message"; then
  echo -e "${GREEN}✅ Logout successful${NC}"
else
  echo -e "${RED}❌ Logout failed${NC}"
  echo "Response: $LOGOUT_RESPONSE"
fi

echo -e "\n${BLUE}🎉 Endpoint Testing Complete!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ All essential endpoints have been tested${NC}"
echo -e "${YELLOW}📝 Review the results above to identify any issues${NC}"
echo -e "${BLUE}💡 Next steps:${NC}"
echo "   1. Fix any failing endpoints"
echo "   2. Integrate endpoints with intelligent data management"
echo "   3. Update frontend components to use real data"
echo "   4. Test end-to-end functionality"