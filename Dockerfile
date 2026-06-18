FROM ghcr.io/puppeteer/puppeteer:latest

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Switch to root to install dependencies and configure permissions
USER root
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the app
COPY . .

# Ensure the app has permission to create and write to the SQLite database
RUN chown -R pptruser:pptruser /usr/src/app

# Switch back to the unprivileged user
USER pptruser

EXPOSE 3000
CMD [ "npm", "start" ]
