FROM node:20-alpine

WORKDIR /app

# Create package.json
RUN echo '{ \
  "name": "mqtt-edge-client", \
  "version": "1.0.0", \
  "main": "index.js", \
  "dependencies": { \
    "mqtt": "^5.3.4" \
  } \
}' > package.json

# Install dependencies
RUN npm install

# Create MQTT edge client
RUN echo "const mqtt = require('mqtt'); \n\
const os = require('os'); \n\
\n\
const MQTT_BROKER = process.env.MQTT_BROKER || 'mosquitto-mqtt.blackroad-mqtt.svc.cluster.local'; \n\
const MQTT_PORT = process.env.MQTT_PORT || '1883'; \n\
const EDGE_DEVICES = (process.env.EDGE_DEVICES || 'alice,aria,octavia,lucidia').split(','); \n\
\n\
console.log(\`🚀 MQTT Edge Client starting...\`); \n\
console.log(\`📡 Connecting to \${MQTT_BROKER}:\${MQTT_PORT}\`); \n\
console.log(\`🔌 Edge devices: \${EDGE_DEVICES.join(', ')}\`); \n\
\n\
const client = mqtt.connect(\`mqtt://\${MQTT_BROKER}:\${MQTT_PORT}\`); \n\
\n\
client.on('connect', () => { \n\
  console.log(\`✅ Connected to MQTT broker\`); \n\
  \n\
  EDGE_DEVICES.forEach(device => { \n\
    client.subscribe(\`blackroad/\${device}/#\`, (err) => { \n\
      if (!err) console.log(\`📥 Subscribed to blackroad/\${device}/#\`); \n\
    }); \n\
  }); \n\
  \n\
  client.subscribe('blackroad/sqtt/#'); \n\
  \n\
  setInterval(() => { \n\
    const status = { \n\
      timestamp: new Date().toISOString(), \n\
      hostname: os.hostname(), \n\
      uptime: os.uptime(), \n\
      memory: { total: os.totalmem(), free: os.freemem() } \n\
    }; \n\
    client.publish('blackroad/edge-client/status', JSON.stringify(status)); \n\
  }, 30000); \n\
}); \n\
\n\
client.on('message', (topic, message) => { \n\
  console.log(\`📨 [\${topic}] \${message.toString().substring(0, 100)}\`); \n\
}); \n\
\n\
client.on('error', (err) => { \n\
  console.error(\`❌ MQTT Error: \${err.message}\`); \n\
}); \n\
" > index.js

EXPOSE 9090

CMD ["node", "index.js"]
