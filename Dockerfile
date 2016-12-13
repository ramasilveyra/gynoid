FROM node:5.12.0

# Create app directory
RUN mkdir -p /usr/src/gynoid
WORKDIR /usr/src/gynoid

# Install app dependencies
COPY package.json /usr/src/gynoid/
RUN npm install

# Bundle app source
COPY . /usr/src/gynoid/

CMD [ "npm", "start" ]
