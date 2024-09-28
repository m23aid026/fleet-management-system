FROM node:16-alpine
WORKDIR /fms-app
COPY producer-cloud.js /fms-app
COPY package*.json /fms-app
COPY fleet-data/ /fms-app/fleet-data/
COPY .env.cloud /fms-app/
RUN npm install
#docker-compose --env-file .env.cloud up --build

CMD ["node", "producer-cloud.js"]
