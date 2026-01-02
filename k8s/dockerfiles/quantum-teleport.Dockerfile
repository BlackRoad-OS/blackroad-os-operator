FROM python:3.11-alpine

WORKDIR /app

RUN pip install --no-cache-dir flask==3.0.0

RUN echo "from flask import Flask, jsonify \n\
import random \n\
from datetime import datetime \n\
\n\
app = Flask(__name__) \n\
\n\
@app.route('/health') \n\
def health(): \n\
    return jsonify({'status': 'healthy', 'service': 'quantum-teleport'}) \n\
\n\
@app.route('/teleport', methods=['POST']) \n\
def teleport(): \n\
    success_rate = random.uniform(0.85, 0.99) \n\
    return jsonify({ \n\
        'status': 'success' if success_rate > 0.9 else 'partial', \n\
        'success_rate': success_rate, \n\
        'timestamp': datetime.now().isoformat() \n\
    }) \n\
\n\
if __name__ == '__main__': \n\
    app.run(host='0.0.0.0', port=9091) \n\
" > server.py

EXPOSE 9091

CMD ["python", "server.py"]
