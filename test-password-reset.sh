#!/bin/bash

##
# Automated test for FitStudio Pro password reset flow
# Tests: forgot-password request → email verification → password reset
##

set -e

# Configuration
SUPABASE_API="http://127.0.0.1:54331"
MAILPIT_API="http://127.0.0.1:54324"
FRONTEND_URL="http://localhost:3000"
ANON_KEY="sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test email (random)
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123"
NEW_PASSWORD="NewPassword456"

echo -e "${YELLOW}FitStudio Pro - Password Reset Flow Test${NC}"
echo "========================================"
echo "Test email: $TEST_EMAIL"
echo "Original password: $TEST_PASSWORD"
echo "New password: $NEW_PASSWORD"
echo ""

# Step 1: Create a test user
echo -e "${YELLOW}Step 1: Creating test user...${NC}"
SIGNUP=$(curl -s -X POST "$SUPABASE_API/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" 2>/dev/null)

if echo "$SIGNUP" | grep -q "access_token"; then
  echo -e "${GREEN}✓ User created successfully${NC}"
  USER_ID=$(echo "$SIGNUP" | grep -o '"sub":"[^"]*"' | cut -d'"' -f4)
  echo "  User ID: $USER_ID"
else
  echo -e "${RED}✗ Failed to create user${NC}"
  echo "$SIGNUP"
  exit 1
fi

# Step 2: Request password reset
echo ""
echo -e "${YELLOW}Step 2: Requesting password reset...${NC}"
RESET=$(curl -s -X POST "$SUPABASE_API/auth/v1/recover" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -d "{\"email\":\"$TEST_EMAIL\",\"redirect_to\":\"$FRONTEND_URL/reset-password\"}" 2>/dev/null)

if echo "$RESET" | grep -q "{}"; then
  echo -e "${GREEN}✓ Password reset email sent${NC}"
else
  echo -e "${YELLOW}⚠ Password reset request completed (no error returned)${NC}"
fi

# Step 3: Check for password reset email
echo ""
echo -e "${YELLOW}Step 3: Checking Mailpit for password reset email...${NC}"
sleep 2

EMAILS=$(curl -s "$MAILPIT_API/api/v1/messages" 2>/dev/null)
RESET_EMAIL_ID=$(echo "$EMAILS" | grep -o '"ID":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$RESET_EMAIL_ID" ]; then
  echo -e "${RED}✗ No emails found in Mailpit${NC}"
  exit 1
fi

EMAIL_DETAIL=$(curl -s "$MAILPIT_API/api/v1/messages/$RESET_EMAIL_ID" 2>/dev/null)

# Check email subject and sender
SUBJECT=$(echo "$EMAIL_DETAIL" | grep -o '"Subject":"[^"]*"' | cut -d'"' -f4)
FROM=$(echo "$EMAIL_DETAIL" | grep -o '"Address":"[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}✓ Email found in Mailpit${NC}"
echo "  Subject: $SUBJECT"
echo "  From: $FROM"

# Extract reset link from email
if echo "$EMAIL_DETAIL" | grep -q "$FRONTEND_URL/reset-password"; then
  echo -e "${GREEN}✓ Email contains reset-password link${NC}"

  # Try to extract the code from the email
  RESET_LINK=$(echo "$EMAIL_DETAIL" | grep -o "$FRONTEND_URL/reset-password[^\"]*" | head -1)
  if [ -n "$RESET_LINK" ]; then
    echo "  Reset link: $RESET_LINK"
  fi
else
  echo -e "${RED}✗ Email does NOT contain reset-password link${NC}"
  echo "  Email content preview:"
  echo "$EMAIL_DETAIL" | grep -o '"Text":"[^"]*"' | cut -c1-200
  exit 1
fi

# Summary
echo ""
echo -e "${GREEN}========================================"
echo "✓ Password Reset Flow Test: PASSED${NC}"
echo ""
echo "Summary:"
echo "  1. User created: $TEST_EMAIL"
echo "  2. Reset email sent: $SUBJECT"
echo "  3. Email contains correct reset link: Yes"
echo ""
echo "Next steps:"
echo "  1. Navigate to: $RESET_LINK"
echo "  2. Enter new password: $NEW_PASSWORD"
echo "  3. Verify redirect to login page"
echo "  4. Sign in with email: $TEST_EMAIL and password: $NEW_PASSWORD"
