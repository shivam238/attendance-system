#!/bin/bash
# ============================================================
#  REDO-DEPLOY  —  Ctrl+Y for your deployments
#  Pops from the redo stack — can redo MULTIPLE times.
#  Run multiple times to keep going forward.
# ============================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

REDO_STACK="$SCRIPT_DIR/.redo_stack"
CURRENT_VER_FILE="$SCRIPT_DIR/.current_version"

cd "$PROJECT_ROOT"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║            REDO DEPLOY  (Ctrl+Y)             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Check redo stack has entries
if [ ! -s "$REDO_STACK" ]; then
    echo "  ❌ Nothing to redo."
    echo "     Run  scripts/undo-deploy.sh  first."
    echo ""
    exit 1
fi

# ── Pop the top entry from redo stack (last line)
REDO_COMMIT=$(tail -1 "$REDO_STACK")

# Validate the commit exists
git rev-parse --verify "$REDO_COMMIT" > /dev/null 2>&1 || {
    echo "  ❌ Redo commit not found: $REDO_COMMIT"
    sed -i '$ d' "$REDO_STACK"
    exit 1
}

REDO_MSG=$(git log -1 --pretty="%s" "$REDO_COMMIT" 2>/dev/null || echo "unknown")

# ── Current state
if [ -f "$CURRENT_VER_FILE" ]; then
    CURRENT=$(cat "$CURRENT_VER_FILE")
else
    CURRENT=$(git rev-parse HEAD)
fi
CURRENT_MSG=$(git log -1 --pretty="%s" "$CURRENT" 2>/dev/null || echo "unknown")

echo "  FROM : $(echo $CURRENT     | cut -c1-7)  →  $CURRENT_MSG"
echo "  TO   : $(echo $REDO_COMMIT | cut -c1-7)  →  $REDO_MSG"
echo ""

# ── Remove the popped entry from redo stack
sed -i '$ d' "$REDO_STACK"

# ── Update current version tracker
echo "$REDO_COMMIT" > "$CURRENT_VER_FILE"
echo "  ✔ Version pointer moved forward"

# ── Restore files to redo commit
git checkout "$REDO_COMMIT" -- .
echo "  ✔ Files restored to newer version"
echo ""

# ── Deploy
bash "$PROJECT_ROOT/deploy-all.sh" "redo: restored to → $REDO_MSG"

echo ""
echo "✅ REDO complete!"

# Check if more redos available
REMAINING=$(wc -l < "$REDO_STACK" 2>/dev/null || echo 0)
if [ "$REMAINING" -gt 0 ]; then
    echo "   Run again to go forward another version."
else
    echo "   (No more redo history available)"
fi
echo "   Run  scripts/undo-deploy.sh  to go back."
echo ""
