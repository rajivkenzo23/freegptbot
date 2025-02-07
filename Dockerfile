FROM mcr.microsoft.com/devcontainers/javascript-node:20

RUN npm install -g pm2

CMD ["pm2-runtime", "start", "index.js", "--name", "whatsapp-bot"]
