#!/bin/bash
# ============================================================
#  REDO-DEPLOY  —  Ctrl+Y for your deployments
#  Restores files to the "newer" version after an undo,
#  and runs the full deploy pipeline.
# ============================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REDO_FILE="$SCRIPT_DIR/.redo_point"

cd "$PROJECT_ROOT"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║            REDO DEPLOY  (Ctrl+Y)             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Check redo point exists ───────────────────────────────
if [ ! -f "$REDO_FILE" ]; then
    echo "  ❌ Nothing to redo."
    echo "     Run  scripts/undo-deploy.sh  first."
    echo ""
    exit 1
fi

REDO_COMMIT=$(cat "$REDO_FILE")
REDO_MSG=$(git log -1 --pretty="%s" "$REDO_COMMIT" 2>/dev/null) || {
    echo "  ❌ Redo commit not found in history: $REDO_COMMIT"
    exit 1
}

CURRENT=$(git rev-parse HEAD)
CURRENT_MSG=$(git log -1 --pretty="%s" HEAD)

echo "  Current : $(echo $CURRENT | cut -c1-7)  →  $CURRENT_MSG"
echo "  Restoring to:"
echo "  Newer   : $(echo $REDO_COMMIT | cut -c1-7)  →  $REDO_MSG"
echo ""

# ── Restore files to redo commit ──────────────────────────
git checkout "$REDO_COMMIT" -- .

# ── Clear redo point ──────────────────────────────────────
rm "$REDO_FILE"
echo "  ✔ Files restored to newer version"
echo ""

# ── Deploy ────────────────────────────────────────────────
bash "$SCRIPT_DIR/../deploy-all.sh" "redo: restored to → $REDO_MSG"

echo ""
echo "✅ REDO complete! App is back on the NEWER version."
echo "   Run  scripts/undo-deploy.sh  to go back again."
echo ""
