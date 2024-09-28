FROM node:16-alpine
WORKDIR /kafka-producer
COPY producer-cloud.js /kafka-producer
COPY package*.json /kafka-producer
COPY fleet-data/ /kafka-producer/fleet-data/
RUN npm install
#docker-compose --env-file .env.cloud up --build

CMD ["node", "producer-cloud.js"]
