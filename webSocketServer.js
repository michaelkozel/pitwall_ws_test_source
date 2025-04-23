// webSocketServer.js
const WebSocket = require('ws');
const axios = require('axios');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const port = 8080;

const wss = new WebSocket.Server({ noServer: true });

const connectionTokens = new Map();

class DataSource {
    getData() {
        throw new Error('Method not implemented.');
    }
}

const fs = require('fs');

class FileDataSource extends DataSource {
    constructor(filePath) {
        super();
        this.filePath = filePath;
        this.lines = [];
        this.loadData();
    }

    loadData() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            this.lines = data.split('\n').filter(line => line.trim() !== '');
        } catch (err) {
            console.error(err);
        }
    }

    getData() {
        return this.lines;
    }
}

const dataSource = new FileDataSource('data/quali.txt');

app.get('/negotiate', (req, res) => {
    const connectionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log("Generated Connection Token:", connectionToken);
    connectionTokens.set(connectionToken, { valid: true });
    res.json({ ConnectionToken: connectionToken });
});

server.on('upgrade', function upgrade(request, socket, head) {
    const { pathname } = new URL(request.url, `http://localhost:${port}`);

    if (pathname === '/signalr/connect') {
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

wss.on('connection', (ws, request) => {
    console.log('Client connected');

    const hub = encodeURIComponent(JSON.stringify([{ name: "Streaming" }]));
    const connectionToken = request.url.split("connectionToken=")[1].split('&')[0];
    console.log("Extracted Connection Token:", connectionToken);

    if (!connectionTokens.has(connectionToken) || !connectionTokens.get(connectionToken).valid) {
        console.error("Invalid Connection Token");
        ws.close();
        return;
    }

    console.log("Valid Connection Token");
    connectionTokens.set(connectionToken, { valid: false });

    if (request.headers['user-agent'] !== 'BestHTTP' || request.headers['accept-encoding'] !== 'gzip,identity') {
        console.error("Invalid Headers");
        ws.close();
        return;
    }

    console.log("Valid Headers");

    ws.on('message', message => {
        console.log('Received message: %s', message);
        fs.appendFile('saved.txt', message + '\n', err => {
            if (err) {
                console.error('Error writing to file:', err);
            }
        });
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.M === "Subscribe" && parsedMessage.H === "Streaming") {
                console.log('Client subscribed to data stream');
                let lineIndex = 0;
                // Send data every 1 second
                setInterval(() => {
                    const lines = dataSource.getData();
                    if (lines && lines.length > 0) {
                        let linesToSend = [];
                        for (let i = 0; i < 3; i++) {
                            if (lineIndex < lines.length) {
                                linesToSend.push(lines[lineIndex]);
                                lineIndex++;
                            } else {
                                lineIndex = 0;
                                break;
                            }
                        }
                
                        if (linesToSend.length > 0) {
                            // Send each line individually
                            linesToSend.forEach(line => {
                   //             console.log("Raw data being sent:", line);
                                ws.send(line); // Send the line as is
                            });
                        }
                    }
                }, 1000);

            
                setInterval(() => {
                    ws.send(JSON.stringify({ M: "Heartbeat" }));
                }, 15000);
            }
        } catch (e) {
            console.error('Error parsing message: %s', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', error => {
        console.error('WebSocket error:', error);
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`WebSocket server started on port ${port}`);
});
