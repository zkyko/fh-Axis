# Creating GitHub Release v1.0.0

## Step-by-Step Instructions

### Step 1: Create and Push Git Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Step 2: Create GitHub Release via Web Interface

1. **Go to GitHub Repository**:
   - Navigate to: https://github.com/zkyko/fh-Axis
   - Click on "Releases" (in the right sidebar, or go to: https://github.com/zkyko/fh-Axis/releases)
   - Click "Draft a new release" button

2. **Fill in Release Details**:
   - **Choose a tag**: Select `v1.0.0` (or type it in if it doesn't exist yet)
   - **Release title**: `Axis v1.0.0`
   - **Description**: Copy and paste the content from `RELEASE_NOTES_v1.0.0.md`
   
3. **Attach the Installer**:
   - Scroll down to the "Attach binaries by dropping them here or selecting them" section
   - Click to browse files OR drag and drop
   - Select: `release/Axis Setup 1.0.0.exe`
   - Wait for upload to complete (the file is 84MB, so it may take a moment)

4. **Publish**:
   - Review everything looks correct
   - Click "Publish release" button

### Alternative: Using GitHub CLI (if installed)

```bash
# Create tag
git tag v1.0.0
git push origin v1.0.0

# Create release with installer attached
gh release create v1.0.0 \
  --title "Axis v1.0.0" \
  --notes-file RELEASE_NOTES_v1.0.0.md \
  "release/Axis Setup 1.0.0.exe"
```

## What Gets Uploaded

- **`Axis Setup 1.0.0.exe`** (84MB) - The Windows installer that users will download and run

This is the standard practice for GitHub Releases - just the installer executable file.

