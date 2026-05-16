FROM node:20-alpine

WORKDIR /app

COPY app/package.json .
RUN npm install --production

COPY app/index.js .

CMD ["node", "index.js"]