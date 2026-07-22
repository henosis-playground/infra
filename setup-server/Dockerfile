FROM node:22-alpine
WORKDIR /app
COPY server.js .
RUN mkdir -p /app/secrets /app/data/webhooks
CMD ["node", "server.js"]
