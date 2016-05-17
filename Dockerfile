FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/gynoid
WORKDIR /usr/src/gynoid

# Install app dependencies
COPY package.json /usr/src/gynoid/
RUN npm install

# Bundle app source
COPY . /usr/src/gynoid
ENV GYNOID_CONFIG_PATH=/usr/src/gynoid/gynoid.config.json

EXPOSE 80

CMD [ "npm", "start" ]
