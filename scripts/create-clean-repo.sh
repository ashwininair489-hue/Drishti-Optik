#!/usr/bin/env bash
#
# Publish Drishti-Optik to a brand-new GitHub repository.
#
# Why this script exists
# ----------------------
# GitHub generates a repository's contributor list from commit author metadata,
# not from any file in the project. This project has no CONTRIBUTORS/AUTHORS
# file, so an unwanted contributor entry can only come from the git history.
#
# This script copies the current project into a fresh directory, starts a brand
# new git history there with a single commit, and pushes that. The new
# repository therefore contains every file in the project but none of the old
# commit authorship.
#
# Your existing local repository and its `.git` directory are never modified.
#
# Usage
# -----
#   scripts/create-clean-repo.sh <new-repo-name> [--public|--private]
#
# Example
# -------
#   scripts/create-clean-repo.sh Drishti-Optik --public
#
# Requirements
# ------------
#   * git
#   * tar
#   * GitHub CLI (https://cli.github.com) installed and authenticated:
#       gh auth login
#
# Run this on your own machine or in a normal clone. Do not run it inside a
# managed sandbox whose version control is handled by the platform.

set -euo pipefail

REPO_NAME="${1:-}"
VISIBILITY="${2:---private}"

if [[ -z "$REPO_NAME" ]]; then
  echo "Usage: $0 <new-repo-name> [--public|--private]" >&2
  exit 1
fi

if [[ "$VISIBILITY" != "--public" && "$VISIBILITY" != "--private" ]]; then
  echo "Second argument must be --public or --private (got '$VISIBILITY')." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI ('gh') is required. Install it from https://cli.github.com and run 'gh auth login'." >&2
  exit 1
fi

# Always operate from the project root, regardless of where this is invoked.
cd "$(dirname "$0")/.."

DEST="$(mktemp -d)/$REPO_NAME"
mkdir -p "$DEST"

echo "Copying project files to $DEST ..."
# Copy the working tree while skipping local-only and generated artefacts.
tar -cf - \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./dist' \
  --exclude='./isolate' \
  --exclude='./coverage' \
  --exclude='./.env' \
  --exclude='./.env.*' \
  --exclude='./src/convex/_generated' \
  . | tar -xf - -C "$DEST"

cd "$DEST"

echo "Starting a fresh git history ..."
git init -b main >/dev/null
git add -A
git commit -q -m "Drishti-Optik: AI-based virtual camera tracking for mobile FSOC coarse alignment"

echo "Creating GitHub repository '$REPO_NAME' ($VISIBILITY) and pushing ..."
gh repo create "$REPO_NAME" "$VISIBILITY" --source=. --remote=origin --push

echo
echo "Done. Contributors in the new repository:"
git log --format='  %an <%ae>' | sort -u
echo
echo "Verify under: Repository -> Insights -> Contributors"
echo "Local scratch copy: $DEST"
