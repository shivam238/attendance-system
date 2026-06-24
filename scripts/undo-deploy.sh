#!/bin/bash
# ============================================================
#  UNDO-DEPLOY  —  Ctrl+Z for your deployments
#  Reverts all project files to the previous git commit
#  and runs the full deploy pipeline.
# ============================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REDO_FILE="$SCRIPT_DIR/.redo_point"

cd "$PROJECT_ROOT"

# ── Check there is a previous commit ──────────────────────
PARENT=$(git rev-parse --verify HEAD~1 2>/dev/null) || {
    echo "❌ No previous commit to revert to."
    exit 1
}

CURRENT=$(git rev-parse HEAD)
CURRENT_MSG=$(git log -1 --pretty="%s" HEAD)
PARENT_MSG=$(git log -1 --pretty="%s" $PARENT)

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║            UNDO DEPLOY  (Ctrl+Z)             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Current : $(echo $CURRENT | cut -c1-7)  →  $CURRENT_MSG"
echo "  Reverting to:"
echo "  Previous: $(echo $PARENT | cut -c1-7)  →  $PARENT_MSG"
echo ""

# ── Save current commit for redo ──────────────────────────
echo "$CURRENT" > "$REDO_FILE"
echo "  ✔ Saved redo point ($(echo $CURRENT | cut -c1-7))"
echo ""

# ── Restore files to previous commit (branch stays intact) 
git checkout "$PARENT" -- .
echo "  ✔ Files restored to previous version"
echo ""

# ── Deploy ────────────────────────────────────────────────
bash "$SCRIPT_DIR/../deploy-all.sh" "undo: reverted to → $PARENT_MSG"

echo ""
echo "✅ UNDO complete! App is now on the PREVIOUS version."
echo "   Run  scripts/redo-deploy.sh  to go forward again."
echo ""
