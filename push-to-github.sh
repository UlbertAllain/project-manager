#!/bin/bash
# ============================================
# Nexty Labs - Push to GitHub Script
# ============================================

REPO_URL="https://github.com/UlbertAllain/project-manager.git"
BRANCH="main"

echo "🚀 Nexty Labs - GitHub Push Script"
echo "===================================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

echo ""
echo "📦 This will push Nexty Labs to:"
echo "   $REPO_URL"
echo "   Branch: $BRANCH"
echo ""

# Ask for confirmation
read -p "Continue? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

# Setup git
git config user.name "UlbertAllain"
git config user.email "ulbertallain@users.noreply.github.com"

# Initialize if needed
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git initialized"
fi

# Add all files
echo "📁 Adding files..."
cat > .gitignore << 'GITIGNORE'
# dependencies
node_modules
/.pnp
.pnp.*

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem
dev.log

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# database
*.db
*.db-journal

# skills (not needed in repo)
skills/
GITIGNORE

git add -A

# Commit
echo "💾 Committing..."
git commit -m "🚀 Nexty Labs v2.0 - Complete Project Tracker

- Full rebuild from Firebase to Prisma + API Routes
- Dark/Light theme with Next.js 16 + TypeScript
- React Query with optimistic updates
- AI-powered features: Chat Assistant, Smart Insights, Cover Generation
- Command Palette (⌘K), Keyboard Shortcuts, Notifications
- Kanban board with drag & drop
- CSV Export & Import, Project duplication
- Real-time WebSocket collaboration
- Advanced analytics: Revenue trends, Health scores, Monthly comparison
- Skeleton loading, Offline detection
- Settings with profile, appearance, preferences

Demo: admin@nextylabs.com / demo123" || echo "Nothing new to commit"

# Add remote
if git remote get-url origin &> /dev/null; then
    git remote set-url origin "$REPO_URL"
else
    git remote add origin "$REPO_URL"
fi
echo "✅ Remote set to $REPO_URL"

# Push
echo "🔄 Pushing to GitHub..."
echo ""
echo "⚠️  You will be prompted for your GitHub credentials."
echo "   Username: your GitHub username"
echo "   Password: use a Personal Access Token (NOT your GitHub password)"
echo "   Create token at: https://github.com/settings/tokens"
echo ""

git branch -M "$BRANCH"
git push -u origin "$BRANCH" --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Visit: https://github.com/UlbertAllain/project-manager"
else
    echo ""
    echo "❌ Push failed. Make sure you have the correct access rights."
    echo "   1. Create a PAT at: https://github.com/settings/tokens"
    echo "   2. Use your username as username"
    echo "   3. Use the PAT as password"
fi
