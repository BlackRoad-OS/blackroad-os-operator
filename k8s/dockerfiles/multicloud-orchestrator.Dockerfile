FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache curl jq git

# Create package.json
RUN echo '{ \
  "name": "multicloud-orchestrator", \
  "version": "1.0.0", \
  "main": "server.js", \
  "dependencies": { \
    "express": "^4.18.2", \
    "mqtt": "^5.3.4" \
  } \
}' > package.json

RUN npm install

# Create orchestrator server
RUN echo "const express = require('express'); \n\
const mqtt = require('mqtt'); \n\
const { exec } = require('child_process'); \n\
\n\
const app = express(); \n\
const PORT = process.env.PORT || 8080; \n\
\n\
app.use(express.json()); \n\
\n\
const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mosquitto-mqtt.blackroad-mqtt.svc.cluster.local:1883'); \n\
\n\
mqttClient.on('connect', () => { \n\
  console.log('✅ Connected to MQTT broker'); \n\
  mqttClient.subscribe('blackroad/cloud/#'); \n\
}); \n\
\n\
app.get('/health', (req, res) => { \n\
  res.json({ status: 'healthy', service: 'multicloud-orchestrator' }); \n\
}); \n\
\n\
app.get('/ready', (req, res) => { \n\
  res.json({ ready: true }); \n\
}); \n\
\n\
app.post('/sync/cloudflare', (req, res) => { \n\
  console.log('🔄 Cloudflare sync triggered'); \n\
  res.json({ status: 'syncing', platform: 'cloudflare' }); \n\
}); \n\
\n\
app.post('/sync/digitalocean', (req, res) => { \n\
  console.log('🔄 DigitalOcean sync triggered'); \n\
  res.json({ status: 'syncing', platform: 'digitalocean' }); \n\
}); \n\
\n\
app.post('/sync/github', (req, res) => { \n\
  console.log('🔄 GitHub sync triggered'); \n\
  res.json({ status: 'syncing', platform: 'github' }); \n\
}); \n\
\n\
app.listen(PORT, () => { \n\
  console.log(\`🚀 Multicloud Orchestrator listening on port \${PORT}\`); \n\
}); \n\
" > server.js

EXPOSE 8080 9090

CMD ["node", "server.js"]
