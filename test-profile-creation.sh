#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="https://api-dev.saby.ai/v1"
USERNAME="saby@saby.ai"
PASSWORD="@saby_Saby1"

echo -e "${BLUE}🚀 Testing Profile Creation (UserProfile & NodeProfile)${NC}"
echo -e "${BLUE}================================================${NC}"

# Step 1: Login and get tokens
echo -e "\n${YELLOW}📝 Step 1: Authenticating${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")

echo "Login response: $LOGIN_RESPONSE"

# Extract tokens and user ID
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.access.token')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.refresh.token')
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id')

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo -e "${GREEN}✅ User ID: $USER_ID${NC}"
echo -e "${GREEN}✅ Access token obtained${NC}"

# Step 2: Get available nodes
echo -e "\n${YELLOW}📝 Step 2: Getting Available Nodes${NC}"
NODES_RESPONSE=$(curl -s -X GET "${BASE_URL}/node" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Nodes response: $NODES_RESPONSE"

# Extract first node ID
NODE_ID=$(echo "$NODES_RESPONSE" | jq -r '.results[0].id')
NODE_NAME=$(echo "$NODES_RESPONSE" | jq -r '.results[0].name')

if [ "$NODE_ID" = "null" ] || [ -z "$NODE_ID" ]; then
  echo -e "${RED}❌ No nodes found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found node: $NODE_NAME (ID: $NODE_ID)${NC}"

# Step 3: Test UserProfile Creation
echo -e "\n${YELLOW}📝 Step 3: Testing UserProfile Creation${NC}"

# First check if profile exists
echo "Checking existing user profile..."
EXISTING_PROFILE=$(curl -s -X GET "${BASE_URL}/userProfile/${USER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$EXISTING_PROFILE" | grep -q "Not found"; then
  echo -e "${BLUE}ℹ️  No existing profile found, creating new one...${NC}"
  
  # Create user profile with required fields from the model
  USER_PROFILE_DATA='{
    "title": "Mr.",
    "otherName": "Test",
    "phoneNumber": "+2348012345678",
    "gender": "Male",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "highestQualification": "Bachelor Degree",
    "professional": "Software Engineer",
    "maritalStatus": "Single",
    "stateOfOrigin": "Lagos",
    "lgaOfOrigin": "Ikeja",
    "homeTown": "Lagos",
    "nextOfKinName": "John Doe",
    "nextOfKinPhoneNumber": "+2348098765432",
    "nextOfKinRelationship": "Brother",
    "residentialAddress": "123 Main Street, Lagos",
    "stateOfResidence": "Lagos",
    "lgaOfResidence": "Ikeja",
    "employmentCategory": "Private",
    "occupation": "Software Developer",
    "employeeId": "EMP001"
  }'
  
  echo "Creating user profile with data: $USER_PROFILE_DATA"
  
  CREATE_PROFILE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/user-profiles/${USER_ID}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$USER_PROFILE_DATA")
  
  echo "Create profile response: $CREATE_PROFILE_RESPONSE"
  
  if echo "$CREATE_PROFILE_RESPONSE" | grep -q "id\|success"; then
    echo -e "${GREEN}✅ UserProfile created successfully${NC}"
  else
    echo -e "${RED}❌ UserProfile creation failed${NC}"
    echo "Response: $CREATE_PROFILE_RESPONSE"
  fi
else
  echo -e "${BLUE}ℹ️  Existing profile found, updating...${NC}"
  
  # Update existing profile
  UPDATE_PROFILE_DATA='{
    "title": "Dr.",
    "professional": "Senior Software Engineer",
    "occupation": "Tech Lead"
  }'
  
  UPDATE_PROFILE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/user-profiles/${USER_ID}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_PROFILE_DATA")
  
  echo "Update profile response: $UPDATE_PROFILE_RESPONSE"
  
  if echo "$UPDATE_PROFILE_RESPONSE" | grep -q "id\|success"; then
    echo -e "${GREEN}✅ UserProfile updated successfully${NC}"
  else
    echo -e "${RED}❌ UserProfile update failed${NC}"
    echo "Response: $UPDATE_PROFILE_RESPONSE"
  fi
fi

# Step 4: Test NodeProfile Creation
echo -e "\n${YELLOW}📝 Step 4: Testing NodeProfile Creation${NC}"

# First check if node profile exists
echo "Checking existing node profile..."
EXISTING_NODE_PROFILE=$(curl -s -X GET "${BASE_URL}/nodeprofile/node/${NODE_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$EXISTING_NODE_PROFILE" | grep -q "not found"; then
  echo -e "${BLUE}ℹ️  No existing node profile found, creating new one...${NC}"
  
  # Create node profile with required fields from the model
  NODE_PROFILE_DATA='{
    "tenantId": "ttigjNNzCQ",
    "church": "'$NODE_ID'",
    "dateOfEstablishment": "2020-01-01T00:00:00.000Z",
    "propertyStatus": "Owned",
    "estimatedValue": "50000000",
    "buildingType": "Auditorium",
    "status": "Active"
  }'
  
  echo "Creating node profile with data: $NODE_PROFILE_DATA"
  
  CREATE_NODE_PROFILE_RESPONSE=$(curl -s -X POST "${BASE_URL}/nodeprofile/upsert" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$NODE_PROFILE_DATA")
  
  echo "Create node profile response: $CREATE_NODE_PROFILE_RESPONSE"
  
  if echo "$CREATE_NODE_PROFILE_RESPONSE" | grep -q "id\|success"; then
    echo -e "${GREEN}✅ NodeProfile created successfully${NC}"
  else
    echo -e "${RED}❌ NodeProfile creation failed${NC}"
    echo "Response: $CREATE_NODE_PROFILE_RESPONSE"
  fi
else
  echo -e "${BLUE}ℹ️  Existing node profile found, updating...${NC}"
  
  # Update existing node profile
  UPDATE_NODE_PROFILE_DATA='{
    "tenantId": "ttigjNNzCQ",
    "church": "'$NODE_ID'",
    "propertyStatus": "Owned",
    "buildingType": "Modern Auditorium",
    "status": "Active"
  }'
  
  UPDATE_NODE_PROFILE_RESPONSE=$(curl -s -X POST "${BASE_URL}/nodeprofile/upsert" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_NODE_PROFILE_DATA")
  
  echo "Update node profile response: $UPDATE_NODE_PROFILE_RESPONSE"
  
  if echo "$UPDATE_NODE_PROFILE_RESPONSE" | grep -q "id\|success"; then
    echo -e "${GREEN}✅ NodeProfile updated successfully${NC}"
  else
    echo -e "${RED}❌ NodeProfile update failed${NC}"
    echo "Response: $UPDATE_NODE_PROFILE_RESPONSE"
  fi
fi

# Step 5: Verify created profiles
echo -e "\n${YELLOW}📝 Step 5: Verifying Created Profiles${NC}"

# Verify UserProfile
echo "Verifying UserProfile..."
VERIFY_USER_PROFILE=$(curl -s -X GET "${BASE_URL}/user-profiles/${USER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$VERIFY_USER_PROFILE" | grep -q "id\|title"; then
  echo -e "${GREEN}✅ UserProfile verified successfully${NC}"
  echo "Profile data: $VERIFY_USER_PROFILE"
else
  echo -e "${RED}❌ UserProfile verification failed${NC}"
  echo "Response: $VERIFY_USER_PROFILE"
fi

# Verify NodeProfile
echo "Verifying NodeProfile..."
VERIFY_NODE_PROFILE=$(curl -s -X GET "${BASE_URL}/nodeprofile/node/${NODE_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$VERIFY_NODE_PROFILE" | grep -q "id\|church"; then
  echo -e "${GREEN}✅ NodeProfile verified successfully${NC}"
  echo "Profile data: $VERIFY_NODE_PROFILE"
else
  echo -e "${RED}❌ NodeProfile verification failed${NC}"
  echo "Response: $VERIFY_NODE_PROFILE"
fi

echo -e "\n${BLUE}🎉 Profile Creation Test Complete!${NC}"
echo -e "${BLUE}================================${NC}"
