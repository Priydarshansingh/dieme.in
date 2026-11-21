#!/usr/bin/env bash
# Dieme Ecosystem Version & GitHub Release Automation Script
# Usage: ./scripts/release.sh [patch|minor|major|none] ["Optional custom notes"]

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORKSPACE="$(dirname "$DIR")"

BUMP_TYPE="${1:-patch}"
NOTES="${2:-}"

echo "=========================================================="
echo "🚀 Dieme Release Engine: Running $BUMP_TYPE version bump"
echo "=========================================================="

cd "$WORKSPACE"

if [ -n "$NOTES" ]; then
    python3 "$WORKSPACE/scripts/release.py" --bump "$BUMP_TYPE" --notes "$NOTES"
else
    python3 "$WORKSPACE/scripts/release.py" --bump "$BUMP_TYPE"
fi
