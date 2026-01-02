FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Create package.json
COPY <<EOF package.json
{
  "name": "edge-agent",
  "version": "1.0.0",
  "main": "agent.js",
  "dependencies": {
    "mqtt": "^5.3.4",
    "express": "^4.18.2"
  }
}
EOF

RUN npm install

# Create edge agent script
COPY <<'EOF' agent.js
const mqtt = require('mqtt');
const express = require('express');
const os = require('os');

const app = express();
const PORT = 8080;

const DEVICE_NAME = process.env.NODE_NAME || os.hostname();
const DEVICE_IP = process.env.NODE_IP || '127.0.0.1';
const MQTT_BROKER = process.env.MQTT_BROKER || 'mosquitto-mqtt.blackroad-mqtt.svc.cluster.local:1883';

console.log(`🤖 BlackRoad Edge Agent starting...`);
console.log(`📛 Device: ${DEVICE_NAME} (${DEVICE_IP})`);
console.log(`📡 MQTT: ${MQTT_BROKER}`);

const client = mqtt.connect(`mqtt://${MQTT_BROKER}`);

client.on('connect', () => {
  console.log(`✅ Connected to MQTT broker`);
  client.subscribe(`blackroad/${DEVICE_NAME}/#`);
  client.subscribe('blackroad/edge/#');

  setInterval(() => {
    const status = {
      device: DEVICE_NAME,
      ip: DEVICE_IP,
      timestamp: new Date().toISOString(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      memory: { total: os.totalmem(), free: os.freemem(), used: os.totalmem() - os.freemem() },
      cpus: os.cpus().length
    };
    client.publish(`blackroad/${DEVICE_NAME}/status`, JSON.stringify(status));
  }, 30000);
});

client.on('message', (topic, message) => {
  console.log(`📨 [${topic}]: ${message.toString().substring(0, 100)}`);
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', device: DEVICE_NAME });
});

app.get('/metrics', (req, res) => {
  res.json({
    device: DEVICE_NAME,
    uptime: os.uptime(),
    memory: { total: os.totalmem(), free: os.freemem() },
    loadavg: os.loadavg()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Edge agent HTTP server on port ${PORT}`);
});
EOF

EXPOSE 8080 9090

CMD ["node", "agent.js"]
