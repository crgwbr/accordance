#!/usr/bin/env bash

set -e

# Validate tag name
TAG_NAME="$1"
if [ -z "$TAG_NAME" ]; then
    echo "Tag name is missing"
    exit 1
fi

# Remove the "r" prefix from the tag name
PREFIX="v"
VERSION="${TAG_NAME#"$PREFIX"}"

# Check git status
git fetch --all
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "master" ]; then
    echo "This script must be run only when the master branch is checked out, but the current branch is ${CURRENT_BRANCH}. Abort!"
    exit 1
fi

NUM_BEHIND=$(git log ..origin/master | wc -l | awk '{print $1}')
if [ "$NUM_BEHIND" == "0" ]; then
    echo ""
else
    echo "Your branch is NOT up to date with origin/master. Abort! Please fetch and rebase first."
    exit 1
fi

# Set version in packages/thelab-ui-js/package.json
PKG_FILE="package.json"
PKG_BK_FILE="${PKG_FILE}.bk"
jq --arg VERSION "$VERSION" '.version=$VERSION' "$PKG_FILE" > "$PKG_BK_FILE"
mv "$PKG_BK_FILE" "$PKG_FILE"
npm i
git add "$PKG_FILE" "package-lock.json"

# Build
npm run lint
npm run build

# Commit
git commit -m "release: ${TAG_NAME}"
git tag -a "$TAG_NAME" -m "New Release: $TAG_NAME"

# Push branch and tags. CI will see the new tag and run a job to publish the packages.
git push origin master
git push origin "$TAG_NAME"

# Publish to NPM
npm publish
