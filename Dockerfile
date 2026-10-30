FROM node:24-alpine

WORKDIR /app
COPY . /app

RUN npm ci
RUN npm run build
ENTRYPOINT ["node", "/app/lib/main.js"]