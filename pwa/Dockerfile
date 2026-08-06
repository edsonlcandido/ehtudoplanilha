# Base image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

EXPOSE 4173

# Preview vite servindo da pasta pwa com --host para aceitar conexões externas
CMD [ "npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173" ]
