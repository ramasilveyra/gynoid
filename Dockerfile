FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/gynoid
WORKDIR /usr/src/gynoid

# Install app dependencies
COPY package.json /usr/src/gynoid/
RUN npm install

# Bundle app source
EXPOSE 80

CMD [ "npm", "start" ]
