FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi==0.109.0 \
    uvicorn==0.27.0 \
    numpy==1.26.3 \
    paho-mqtt==1.6.1

RUN echo "from fastapi import FastAPI \n\
import numpy as np \n\
import os \n\
from datetime import datetime \n\
\n\
app = FastAPI(title='Quantum Entanglement Node') \n\
\n\
ENTANGLEMENT_PAIR = os.getenv('ENTANGLEMENT_PAIR', 'unknown') \n\
\n\
entangled_state = np.random.rand(2, 2) + 1j * np.random.rand(2, 2) \n\
entangled_state /= np.linalg.norm(entangled_state) \n\
\n\
@app.get('/health') \n\
def health(): \n\
    return {'status': 'healthy', 'pair': ENTANGLEMENT_PAIR} \n\
\n\
@app.get('/entanglement/status') \n\
def status(): \n\
    fidelity = float(np.abs(np.trace(entangled_state @ entangled_state.conj().T))) \n\
    return { \n\
        'pair': ENTANGLEMENT_PAIR, \n\
        'fidelity': min(fidelity, 1.0), \n\
        'timestamp': datetime.now().isoformat() \n\
    } \n\
\n\
if __name__ == '__main__': \n\
    import uvicorn \n\
    uvicorn.run(app, host='0.0.0.0', port=9090) \n\
" > main.py

EXPOSE 9090

CMD ["python", "main.py"]
