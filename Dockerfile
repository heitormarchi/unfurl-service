FROM node:20-alpine

# Dependências nativas necessárias para compilar módulos do unfurl.js
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json .

RUN npm install --omit=dev

COPY server.js .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
