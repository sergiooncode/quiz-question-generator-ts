#!/bin/bash
# Wrapper script to run chrome-devtools-mcp with Node.js v24

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node.js v24 for this command only
cd "$SCRIPT_DIR" && nvm exec 24 npx -y chrome-devtools-mcp@latest
