FROM node:20-alpine

# Install OpenSSL and Chromium for Puppeteer
RUN apk add --no-cache openssl chromium

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
