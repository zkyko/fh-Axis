#!/bin/bash
# Script to create GitHub Release for Axis v1.0.0

set -e

REPO="zkyko/fh-Axis"
VERSION="v1.0.0"
TAG="v1.0.0"
INSTALLER_FILE="release/Axis Setup 1.0.0.exe"
RELEASE_NOTES="RELEASE_NOTES_v1.0.0.md"

echo "🚀 Creating GitHub Release for Axis $VERSION"
echo ""

# Check if installer file exists
if [ ! -f "$INSTALLER_FILE" ]; then
    echo "❌ Error: Installer file not found: $INSTALLER_FILE"
    exit 1
fi

# Check if release notes exist
if [ ! -f "$RELEASE_NOTES" ]; then
    echo "❌ Error: Release notes not found: $RELEASE_NOTES"
    exit 1
fi

# Create git tag if it doesn't exist
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "✓ Tag $TAG already exists"
else
    echo "Creating git tag $TAG..."
    git tag "$TAG"
    echo "✓ Tag created"
fi

# Push tag to GitHub
echo "Pushing tag to GitHub..."
git push origin "$TAG"
echo "✓ Tag pushed"

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo ""
    echo "GitHub CLI found. Creating release..."
    
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo "✓ GitHub CLI authenticated"
        
        # Create release
        gh release create "$TAG" \
            --title "Axis $VERSION" \
            --notes-file "$RELEASE_NOTES" \
            "$INSTALLER_FILE"
        
        echo ""
        echo "✅ Release created successfully!"
        echo "🔗 View at: https://github.com/$REPO/releases/tag/$TAG"
    else
        echo "⚠️  GitHub CLI not authenticated"
        echo "Run: gh auth login"
        echo ""
        echo "Or create the release manually:"
        echo "1. Go to: https://github.com/$REPO/releases/new"
        echo "2. Select tag: $TAG"
        echo "3. Title: Axis $VERSION"
        echo "4. Description: Copy from $RELEASE_NOTES"
        echo "5. Attach: $INSTALLER_FILE"
    fi
else
    echo ""
    echo "⚠️  GitHub CLI (gh) not found"
    echo ""
    echo "Please create the release manually:"
    echo "1. Go to: https://github.com/$REPO/releases/new"
    echo "2. Select tag: $TAG"
    echo "3. Title: Axis $VERSION"
    echo "4. Description: Copy from $RELEASE_NOTES"
    echo "5. Attach: $INSTALLER_FILE"
    echo ""
    echo "Tag $TAG has been pushed to GitHub."
fi

