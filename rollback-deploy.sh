#!/bin/bash
# AttenMo Interactive Rollback & Deploy Utility
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if git repository
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository.${NC}"
    exit 1
fi

echo -e "${BLUE}Fetching latest commits from Git log...${NC}"
echo ""

# Read last 15 commits with format hash|relative-date|subject
IFS=$'\n'
lines=($(git log -n 15 --pretty=format:"%h|%cr|%s"))

if [ ${#lines[@]} -eq 0 ]; then
    echo -e "${YELLOW}No commits found.${NC}"
    exit 1
fi

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}        AttenMo ROLLBACK & DEPLOY SELECTOR        ${NC}"
echo -e "${BLUE}===================================================${NC}"
echo "Select a commit to revert workspace files to:"
echo ""

for i in "${!lines[@]}"; do
    IFS='|' read -r hash time msg <<< "${lines[$i]}"
    printf "  [%2d] ${CYAN}%s${NC} (%s) - %s\n" "$((i+1))" "$hash" "$time" "$msg"
done

echo ""
read -rp "Enter choice (1-15, or 'q' to quit): " choice

if [[ "$choice" == "q" || -z "$choice" ]]; then
    echo "Aborted."
    exit 0
fi

if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#lines[@]}" ]; then
    echo -e "${YELLOW}Invalid option selection.${NC}"
    exit 1
fi

selected_index=$((choice-1))
IFS='|' read -r selected_hash selected_time selected_msg <<< "${lines[$selected_index]}"

echo ""
echo -e "Selected commit: ${GREEN}$selected_hash${NC} ($selected_time)"
echo -e "Commit message:  $selected_msg"
echo ""
read -rp "Revert ALL local files to this state? (y/n): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
fi

echo -e "\n${BLUE}Reverting files...${NC}"
# Reverts the files in working tree to that commit without detaching HEAD
git checkout "$selected_hash" -- .
echo -e "${GREEN}✔ Workspace files successfully restored to commit $selected_hash.${NC}\n"

read -rp "Do you want to deploy this restored state now? (y/n): " deploy_confirm

if [[ "$deploy_confirm" == "y" || "$deploy_confirm" == "Y" ]]; then
    DEFAULT_MSG="chore: rollback to $selected_hash ($selected_msg)"
    echo ""
    read -rp "Enter commit message (Enter = '$DEFAULT_MSG'): " custom_msg
    FINAL_MSG="${custom_msg:-$DEFAULT_MSG}"
    
    echo -e "\n${BLUE}Initiating deployment...${NC}"
    bash deploy-all.sh "$FINAL_MSG"
else
    echo ""
    echo -e "${YELLOW}Rollback completed local-only.${NC}"
    echo "To undo this rollback and discard changes, run:"
    echo -e "  ${CYAN}git checkout main -- .${NC}"
    echo -e "  ${CYAN}git reset --hard origin/main${NC}"
fi
