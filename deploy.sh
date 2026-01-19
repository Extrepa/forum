#!/bin/bash

# Deploy script for Errl Forum
# Commits changes, builds, and deploys the Cloudflare worker

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Errl Forum Deployment Script${NC}"
echo ""

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  No changes to commit.${NC}"
  echo ""
else
  echo -e "${BLUE}📝 Staging changes...${NC}"
  git add -A
  
  # Get commit message from argument or use default
  if [ -z "$1" ]; then
    COMMIT_MSG="Update forum application"
  else
    COMMIT_MSG="$1"
  fi
  
  echo -e "${BLUE}💾 Committing changes: ${COMMIT_MSG}${NC}"
  git commit -m "$COMMIT_MSG"
  
  echo -e "${BLUE}📤 Pushing to repository...${NC}"
  git push
  
  echo -e "${GREEN}✅ Changes committed and pushed${NC}"
  echo ""
fi

echo -e "${BLUE}🔨 Building Cloudflare worker...${NC}"
npm run build:cf

echo ""
echo -e "${BLUE}🚀 Deploying to Cloudflare...${NC}"
npm run deploy

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Live at: https://errl-portal-forum.extrepatho.workers.dev${NC}"
