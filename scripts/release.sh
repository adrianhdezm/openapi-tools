#!/bin/bash
set -e

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed."
  exit 1
fi

# Read the current version from package.json
current_version=$(jq -r '.version' package.json)
if [ -z "$current_version" ]; then
  echo "Error: Unable to find version in package.json"
  exit 1
fi
echo "Current version: $current_version"

# Create a Git tag with the current version on the current commit
git tag "v$current_version"

# Split the current version into major, minor, and patch components
IFS='.' read -r major minor patch <<< "$current_version"

# Increment the patch version
new_patch=$((patch + 1))
new_version="${major}.${minor}.${new_patch}"
echo "New version: $new_version"

# Update package.json with the new version
jq --arg new_version "$new_version" '.version = $new_version' package.json > tmp.$$.json && mv tmp.$$.json package.json

# Stage and commit the version bump
git add package.json
git commit -m "Bump version to $new_version"

# Push the commit and the tag to the remote repository (assuming main branch)
git push origin main
git push origin "v$current_version"
