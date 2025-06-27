#!/bin/bash

set -e

BUMP_TYPE=${1:-patch}
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major|prerelease)$ ]]; then
  echo "Invalid version bump type: $BUMP_TYPE"
  echo "Valid types: patch, minor, major, prerelease"
  exit 1
fi

# === Config ===
GHCR_USER="georgesg"
REPO_NAME="koinsight"
PACKAGE_DIRS=("apps/server" "apps/web" "packages/common")
IMAGE_NAME="ghcr.io/$GHCR_USER/$REPO_NAME"

# === Bump version using changesets or npm version ===
VERSION=$(npm version "$BUMP_TYPE" --no-git-tag-version)

# === Apply version to each package.json ===
for DIR in "${PACKAGE_DIRS[@]}"; do
  jq --arg v "$VERSION" '.version = $v' "$DIR/package.json" > "$DIR/package.tmp.json" && mv "$DIR/package.tmp.json" "$DIR/package.json"
done

# === Commit version bump ===
git add .
git commit -m "chore: release $VERSION"

# === Tag and push ===
git tag "$VERSION"
git push origin master
git push origin "$VERSION"

# === Build Docker image ===
docker buildx create --use --name koinsight-builder || docker buildx use koinsight-builder
docker buildx inspect --bootstrap

# === Build multi-arch image and push it
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "$IMAGE_NAME:$VERSION" \
  -t "$IMAGE_NAME:latest" \
  --push \
  .


echo "✅ Released version $VERSION"
