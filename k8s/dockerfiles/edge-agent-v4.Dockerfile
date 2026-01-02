FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Copy files
COPY package.json .
RUN npm install

COPY agent.js .

EXPOSE 8080 9090

CMD ["node", "agent.js"]
