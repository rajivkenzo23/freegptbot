FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install PM2 globally for process management
RUN npm install -g pm2

# Ensure Node.js is installed and symlinked
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    ln -s /usr/bin/nodejs /usr/bin/node

# Default working directory in the container
WORKDIR /workspaces/freegptbot
