#!/bin/bash

# Change to the MCP server directory
cd "$(dirname "$0")"

# Load NVM if not already available
if ! command -v nvm &> /dev/null; then
    # NVM is not loaded, try to load it
    if [ -n "$NVM_DIR" ] && [ -f "$NVM_DIR/nvm.sh" ]; then
        # Use NVM_DIR if set
        source "$NVM_DIR/nvm.sh"
    elif [ -f ~/.nvm/nvm.sh ]; then
        # Try standard location
        source ~/.nvm/nvm.sh
    else
        echo "Error: NVM not found. Please ensure NVM is installed and sourced." >&2
        echo "Try: source ~/.nvm/nvm.sh or set NVM_DIR environment variable" >&2
        exit 1
    fi

    # Verify NVM is now available
    if ! command -v nvm &> /dev/null; then
        echo "Error: Failed to load NVM" >&2
        exit 1
    fi
fi

# Use the version specified in .nvmrc
if [ -f .nvmrc ]; then
    nvm use
else
    echo "Warning: .nvmrc file not found, using current Node version" >&2
fi

# Verify Node version
NODE_VERSION=$(node --version)
echo "Starting MCP server with Node $NODE_VERSION" >&2

# Check if we have the minimum required version
if ! node -e "process.exit(process.version.match(/^v(\d+)/)[1] >= 20 ? 0 : 1)"; then
    echo "Error: Node.js 20+ required, found $NODE_VERSION" >&2
    exit 1
fi

# Start the MCP server
exec node dist/index.js "$@"
