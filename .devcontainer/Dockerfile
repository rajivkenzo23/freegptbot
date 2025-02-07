# Use official DevContainer image for Node.js 20
FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Set the working directory inside the container
WORKDIR /workspaces/freegptbot

# Install PM2 globally for process management
RUN npm install -g pm2

# Copy package.json and package-lock.json first (optimize layer caching)
COPY package.json package-lock.json ./

# Install dependencies before copying the rest of the files
RUN npm install

# Copy the remaining project files
COPY . .

# Expose the default port (optional, useful for debugging)
EXPOSE 3000

# Default command to run the bot using PM2
CMD ["pm2-runtime", "index.js"]
