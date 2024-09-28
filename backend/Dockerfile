FROM node:16-alpine
WORKDIR /backend
COPY consumer-cloud.js /backend
COPY server.js /backend
COPY package*.json /backend

RUN npm install

RUN node server.js
RUN node consumer-cloud.js

#docker-compose --env-file ../.env.cloud up --build