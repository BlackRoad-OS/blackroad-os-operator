// Check connection status
chrome.runtime.sendMessage({ type: 'getStatus' }, (response) => {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');

  if (response?.connected) {
    dot.classList.add('connected');
    text.textContent = 'Connected to MCP server';
  } else {
    dot.classList.add('disconnected');
    text.textContent = 'MCP server not running';
  }
});
