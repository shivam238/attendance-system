#!/bin/bash
# ============================================================
#  UNDO-DEPLOY  —  Ctrl+Z for your deployments
#  Uses a version stack — can go back MULTIPLE times correctly.
#  Run multiple times to keep going further back.
# ============================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

REDO_STACK="$SCRIPT_DIR/.redo_stack"
CURRENT_VER_FILE="$SCRIPT_DIR/.current_version"

cd "$PROJECT_ROOT"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║            UNDO DEPLOY  (Ctrl+Z)             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Get the current LOGICAL version (not git HEAD, which grows with each deploy)
if [ -f "$CURRENT_VER_FILE" ]; then
    CURRENT=$(cat "$CURRENT_VER_FILE")
    # Validate it still exists
    git rev-parse --verify "$CURRENT" > /dev/null 2>&1 || CURRENT=$(git rev-parse HEAD)
else
    CURRENT=$(git rev-parse HEAD)
fi

CURRENT_MSG=$(git log -1 --pretty="%s" "$CURRENT" 2>/dev/null || echo "unknown")

# ── Find the parent of the current logical version
PARENT=$(git rev-parse --verify "${CURRENT}~1" 2>/dev/null) || {
    echo "  ❌ Already at the oldest version. Nothing to undo."
    echo ""
    exit 1
}

PARENT_MSG=$(git log -1 --pretty="%s" "$PARENT" 2>/dev/null || echo "unknown")

echo "  FROM : $(echo $CURRENT | cut -c1-7)  →  $CURRENT_MSG"
echo "  TO   : $(echo $PARENT  | cut -c1-7)  →  $PARENT_MSG"
echo ""

# ── Push current version to redo stack
echo "$CURRENT" >> "$REDO_STACK"
echo "  ✔ Pushed to redo stack  ($(echo $CURRENT | cut -c1-7))"

# ── Update the current version tracker
echo "$PARENT" > "$CURRENT_VER_FILE"
echo "  ✔ Version pointer moved back"
echo ""

# ── Restore project files to parent state
git checkout "$PARENT" -- .
echo "  ✔ Files restored to previous version"
echo ""

# ── Deploy
bash "$PROJECT_ROOT/deploy-all.sh" "undo: reverted to → $PARENT_MSG"

echo ""
echo "✅ UNDO complete!"
echo "   Run again to go back another version."
echo "   Run  scripts/redo-deploy.sh  to go forward."
echo ""
