FROM node:16-alpine
WORKDIR /fms-app
COPY consumer-cloud.js /fms-app
COPY .env.cloud /fms-app/
COPY package*.json /fms-app

RUN npm install
EXPOSE 3002
CMD ["node", "consumer-cloud.js"]

#docker-compose --env-file ../.env.cloud up --build