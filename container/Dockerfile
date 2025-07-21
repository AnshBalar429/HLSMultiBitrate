FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
RUN npm install typescript

COPY tsconfig.json ./
COPY src ./src
RUN npm run build


ENTRYPOINT ["npm", "run", "start"]
