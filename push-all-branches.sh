#!/bin/bash
# Script to push all branches that are ahead of their remotes

set -e

echo "🔍 Checking branch status..."
git fetch --all

echo ""
echo "📤 Pushing branches that are ahead..."

# Push feat/auth-overhaul-and-post-controls
if git rev-list --left-right --count origin/feat/auth-overhaul-and-post-controls...feat/auth-overhaul-and-post-controls | grep -q "0.*[1-9]"; then
  echo "  → Pushing feat/auth-overhaul-and-post-controls..."
  git push origin feat/auth-overhaul-and-post-controls
else
  echo "  ✓ feat/auth-overhaul-and-post-controls is up to date"
fi

# Push fix/devlog-edit-improvements
if git rev-list --left-right --count origin/fix/devlog-edit-improvements...fix/devlog-edit-improvements | grep -q "0.*[1-9]"; then
  echo "  → Pushing fix/devlog-edit-improvements..."
  git push origin fix/devlog-edit-improvements
else
  echo "  ✓ fix/devlog-edit-improvements is up to date"
fi

# Push main (be careful - this is 41 commits ahead!)
if git rev-list --left-right --count origin/main...main | grep -q "0.*[1-9]"; then
  echo "  ⚠️  WARNING: main is ahead by $(git rev-list --left-right --count origin/main...main | cut -f2) commits"
  echo "  → Pushing main..."
  git push origin main
else
  echo "  ✓ main is up to date"
fi

echo ""
echo "✅ All branches pushed!"
echo ""
echo "📊 Current branch status:"
git branch -vv
