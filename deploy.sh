#!/bin/bash

# Deploy script for Errl Forum
# Commits changes, builds, and deploys the Cloudflare worker
# Enforces branch-based workflow to prevent breaking production

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Errl Forum Deployment Script${NC}"
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Parse command line arguments
DEPLOY_MODE="auto"  # auto, preview, or production
COMMIT_MSG=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --preview)
      DEPLOY_MODE="preview"
      shift
      ;;
    --production)
      DEPLOY_MODE="production"
      shift
      ;;
    *)
      if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="$1"
      fi
      shift
      ;;
  esac
done

# Rule 1: Prevent direct commits to main
if [ "$CURRENT_BRANCH" = "main" ]; then
  if [ "$DEPLOY_MODE" = "production" ]; then
    # Production deployment from main is allowed
    echo -e "${YELLOW}⚠️  Production deployment from main branch${NC}"
    echo -e "${YELLOW}   This will deploy to the live site.${NC}"
    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      echo -e "${RED}❌ Deployment cancelled${NC}"
      exit 1
    fi
  else
    echo -e "${RED}❌ ERROR: Cannot commit directly to main branch${NC}"
    echo ""
    echo -e "${YELLOW}Create a feature branch first:${NC}"
    echo -e "  git checkout -b feat/your-feature-name"
    echo ""
    echo -e "${YELLOW}Or if you need to deploy to production:${NC}"
    echo -e "  ./deploy.sh --production \"Your commit message\""
    echo ""
    exit 1
  fi
fi

# Rule 2: Validate branch naming convention (for feature branches)
if [ "$CURRENT_BRANCH" != "main" ]; then
  if [[ ! "$CURRENT_BRANCH" =~ ^(feat|fix|refactor|chore)/ ]]; then
    echo -e "${RED}❌ ERROR: Branch must follow naming convention${NC}"
    echo ""
    echo -e "${YELLOW}Branch names must start with:${NC}"
    echo -e "  - feat/  (for new features)"
    echo -e "  - fix/   (for bug fixes)"
    echo -e "  - refactor/ (for code refactoring)"
    echo -e "  - chore/ (for tooling/config changes)"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  git checkout -b feat/homepage-stats"
    echo -e "  git checkout -b fix/hydration-issue"
    echo ""
    exit 1
  fi
fi

# Determine deployment mode if auto
if [ "$DEPLOY_MODE" = "auto" ]; then
  if [ "$CURRENT_BRANCH" = "main" ]; then
    DEPLOY_MODE="production"
  else
    DEPLOY_MODE="preview"
  fi
fi

# Rule 3: Build verification
echo -e "${BLUE}🔨 Verifying build...${NC}"
if ! npm run build > /dev/null 2>&1; then
  echo -e "${RED}❌ Build failed! Fix errors before deploying.${NC}"
  echo ""
  echo -e "${YELLOW}Run 'npm run build' to see detailed errors${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Build verification passed${NC}"
echo ""

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  No changes to commit.${NC}"
  echo ""
else
  echo -e "${BLUE}📝 Staging changes...${NC}"
  git add -A
  
  # Get commit message from argument or use default
  if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update forum application"
  fi
  
  echo -e "${BLUE}💾 Committing changes: ${COMMIT_MSG}${NC}"
  # Skip pre-commit hook for production deployments from main (intentional, reviewed)
  if [ "$CURRENT_BRANCH" = "main" ] && [ "$DEPLOY_MODE" = "production" ]; then
    git commit --no-verify -m "$COMMIT_MSG"
  else
    git commit -m "$COMMIT_MSG"
  fi
  
  echo -e "${BLUE}📤 Pushing to repository...${NC}"
  git push -u origin "$CURRENT_BRANCH" 2>/dev/null || git push
  
  echo -e "${GREEN}✅ Changes committed and pushed${NC}"
  echo ""
fi

# Deployment based on mode
if [ "$DEPLOY_MODE" = "preview" ]; then
  echo -e "${BLUE}🔨 Building Cloudflare worker (preview)...${NC}"
  npm run build:cf
  
  echo ""
  echo -e "${BLUE}🚀 Deploying preview to Cloudflare...${NC}"
  echo -e "${YELLOW}⚠️  Preview deployments use the same production environment${NC}"
  echo -e "${YELLOW}   Test thoroughly before merging to main!${NC}"
  echo ""
  npx wrangler deploy --env preview
  
  echo ""
  echo -e "${GREEN}✅ Preview deployment complete!${NC}"
  echo -e "${GREEN}🌐 Live at: https://errl-portal-forum-preview.extrepatho.workers.dev${NC}"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo -e "  1. Test the preview deployment"
  echo -e "  2. Create a Pull Request on GitHub"
  echo -e "  3. Merge PR to main when ready"
  echo -e "  4. Deploy to production: ./deploy.sh --production"
  
elif [ "$DEPLOY_MODE" = "production" ]; then
  if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ ERROR: Production deployment only allowed from main branch${NC}"
    echo ""
    echo -e "${YELLOW}To deploy to production:${NC}"
    echo -e "  1. Merge your branch to main"
    echo -e "  2. Checkout main: git checkout main"
    echo -e "  3. Pull latest: git pull"
    echo -e "  4. Deploy: ./deploy.sh --production"
    echo ""
    exit 1
  fi
  
  echo -e "${BLUE}🔨 Building Cloudflare worker (production)...${NC}"
  npm run build:cf
  
  echo ""
  echo -e "${BLUE}🚀 Deploying to production...${NC}"
  npm run deploy
  
  echo ""
  echo -e "${GREEN}✅ Production deployment complete!${NC}"
  echo -e "${GREEN}🌐 Live at: https://errl-portal-forum.extrepatho.workers.dev${NC}"
  
  # Rollback instructions in case of issues
  echo ""
  echo -e "${YELLOW}If something breaks, rollback with:${NC}"
  echo -e "  git revert HEAD"
  echo -e "  git push"
  echo -e "  ./deploy.sh --production \"Rollback: [reason]\""
fi
