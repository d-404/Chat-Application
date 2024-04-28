const WebSocket = require('ws');

// Initialize WebSocket server
function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    // WebSocket event handlers
    wss.on('connection', (ws) => {
        console.log('Client connected');

        ws.on('message', (message) => {
            console.log('Received message:', message);
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    return wss;
}

module.exports = setupWebSocketServer;
