FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Create package.json
RUN echo '{ \
  "name": "edge-agent", \
  "version": "1.0.0", \
  "main": "agent.js", \
  "dependencies": { \
    "mqtt": "^5.3.4", \
    "express": "^4.18.2" \
  } \
}' > package.json

RUN npm install

# Create edge agent
RUN echo "const mqtt = require('mqtt'); \n\
const express = require('express'); \n\
const os = require('os'); \n\
\n\
const app = express(); \n\
const PORT = 8080; \n\
\n\
const DEVICE_NAME = process.env.NODE_NAME || os.hostname(); \n\
const DEVICE_IP = process.env.NODE_IP || '127.0.0.1'; \n\
const MQTT_BROKER = process.env.MQTT_BROKER || 'mosquitto-mqtt.blackroad-mqtt.svc.cluster.local:1883'; \n\
\n\
console.log(\`🤖 BlackRoad Edge Agent starting...\`); \n\
console.log(\`📛 Device: \${DEVICE_NAME} (\${DEVICE_IP})\`); \n\
console.log(\`📡 MQTT: \${MQTT_BROKER}\`); \n\
\n\
const client = mqtt.connect(\`mqtt://\${MQTT_BROKER}\`); \n\
\n\
client.on('connect', () => { \n\
  console.log(\`✅ Connected to MQTT broker\`); \n\
  client.subscribe(\`blackroad/\${DEVICE_NAME}/#\`); \n\
  client.subscribe('blackroad/edge/#'); \n\
  \n\
  setInterval(() => { \n\
    const status = { \n\
      device: DEVICE_NAME, \n\
      ip: DEVICE_IP, \n\
      timestamp: new Date().toISOString(), \n\
      uptime: os.uptime(), \n\
      loadavg: os.loadavg(), \n\
      memory: { total: os.totalmem(), free: os.freemem(), used: os.totalmem() - os.freemem() }, \n\
      cpus: os.cpus().length \n\
    }; \n\
    client.publish(\`blackroad/\${DEVICE_NAME}/status\`, JSON.stringify(status)); \n\
  }, 30000); \n\
}); \n\
\n\
client.on('message', (topic, message) => { \n\
  console.log(\`📨 [\${topic}]: \${message.toString().substring(0, 100)}\`); \n\
}); \n\
\n\
app.get('/health', (req, res) => { \n\
  res.json({ status: 'healthy', device: DEVICE_NAME }); \n\
}); \n\
\n\
app.get('/metrics', (req, res) => { \n\
  res.json({ \n\
    device: DEVICE_NAME, \n\
    uptime: os.uptime(), \n\
    memory: { total: os.totalmem(), free: os.freemem() }, \n\
    loadavg: os.loadavg() \n\
  }); \n\
}); \n\
\n\
app.listen(PORT, () => { \n\
  console.log(\`🚀 Edge agent HTTP server on port \${PORT}\`); \n\
}); \n\
" > agent.js

EXPOSE 8080 9090

CMD ["node", "agent.js"]
