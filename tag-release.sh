#!/bin/bash

set -e

BUMP_TYPE=${1:-patch}
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major|prerelease)$ ]]; then
  echo "Invalid version bump type: $BUMP_TYPE"
  echo "Valid types: patch, minor, major, prerelease"
  exit 1
fi

# === Config ===
PACKAGE_DIRS=("apps/server" "apps/web" "packages/common")

# === Bump version using npm ===
VERSION=$(npm version "$BUMP_TYPE" --no-git-tag-version)

# === Apply version to each package.json ===
for DIR in "${PACKAGE_DIRS[@]}"; do
  jq --arg v "$VERSION" '.version = $v' "$DIR/package.json" > "$DIR/package.tmp.json" && mv "$DIR/package.tmp.json" "$DIR/package.json"
done

# === Commit version bump ===
git add .
git commit -m "chore: release $VERSION"

# === Tag and push ===
# Pushing the tag triggers .github/workflows/release.yaml, which builds and
# publishes the multi-arch image to ghcr.io/ko-insight/koinsight.
git tag "$VERSION"
git push origin master
git push origin "$VERSION"

echo "✅ Tagged $VERSION and pushed."
echo "🚀 GitHub Actions is now building and publishing ghcr.io/ko-insight/koinsight:$VERSION"
echo "   Track it: https://github.com/Ko-Insight/KoInsight/actions"
