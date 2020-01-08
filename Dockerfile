FROM node:12-alpine

WORKDIR /app
COPY . /app

RUN npm install
RUN npm run build
ENTRYPOINT ["node", "/app/lib/main.js"]