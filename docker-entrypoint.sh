#!/bin/sh

# Docker entrypoint script for environment variable injection
# This script replaces environment variables in the built files at runtime

set -e

# Default values
API_BASE_URL=${API_BASE_URL:-"https://api-dev.saby.ai"}
API_AUTH_ENDPOINT=${API_AUTH_ENDPOINT:-"/v1/auth/login"}
API_REFRESH_ENDPOINT=${API_REFRESH_ENDPOINT:-"/v1/auth/refresh-tokens"}
API_LOGOUT_ENDPOINT=${API_LOGOUT_ENDPOINT:-"/v1/auth/logout"}
API_USER_ENDPOINT=${API_USER_ENDPOINT:-"/v1/users"}
API_USER_PROFILE_ENDPOINT=${API_USER_PROFILE_ENDPOINT:-"/v1/user-profiles"}
API_NODE_ENDPOINT=${API_NODE_ENDPOINT:-"/v1/node"}
API_NODE_PROFILE_ENDPOINT=${API_NODE_PROFILE_ENDPOINT:-"/v1/nodeprofile"}
API_PROJECT_FORM_ENDPOINT=${API_PROJECT_FORM_ENDPOINT:-"/v1/projectForm"}
API_STORAGE_ENDPOINT=${API_STORAGE_ENDPOINT:-"/v1/storage"}
API_INMAIL_ENDPOINT=${API_INMAIL_ENDPOINT:-"/v1/inmail"}
REFRESH_TOKEN_KEY=${REFRESH_TOKEN_KEY:-"saby:refresh_token"}

echo "🚀 Starting Sodzo Web Client..."
echo "📡 API Base URL: $API_BASE_URL"
echo "🔧 Environment: $NODE_ENV"

# Create environment configuration file
cat > /usr/share/nginx/html/env-config.js << EOF
window._env_ = {
  VITE_API_BASE: "$API_BASE_URL",
  VITE_API_AUTH_ENDPOINT: "$API_AUTH_ENDPOINT",
  VITE_API_REFRESH_ENDPOINT: "$API_REFRESH_ENDPOINT",
  VITE_API_LOGOUT_ENDPOINT: "$API_LOGOUT_ENDPOINT",
  VITE_API_USER_ENDPOINT: "$API_USER_ENDPOINT",
  VITE_API_USER_PROFILE_ENDPOINT: "$API_USER_PROFILE_ENDPOINT",
  VITE_API_NODE_ENDPOINT: "$API_NODE_ENDPOINT",
  VITE_API_NODE_PROFILE_ENDPOINT: "$API_NODE_PROFILE_ENDPOINT",
  VITE_API_PROJECT_FORM_ENDPOINT: "$API_PROJECT_FORM_ENDPOINT",
  VITE_API_STORAGE_ENDPOINT: "$API_STORAGE_ENDPOINT",
  VITE_API_INMAIL_ENDPOINT: "$API_INMAIL_ENDPOINT",
  VITE_REFRESH_TOKEN_KEY: "$REFRESH_TOKEN_KEY"
};
EOF

echo "✅ Environment configuration created"

# Update nginx configuration with API base URL
sed -i "s|\${API_BASE_URL}|$API_BASE_URL|g" /etc/nginx/nginx.conf

echo "✅ Nginx configuration updated"

# Execute the main command
exec "$@"
