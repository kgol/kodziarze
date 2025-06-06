const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

// Add this after app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store connected players: { socketId: { x, y, z, name, ...avatar, score } }
let players = {};
let nameToSocket = {}; // { name: socketId }
let chatMessages = [];

io.on('connection', (socket) => {
  // When a new player joins
  socket.on('join', (data) => {
    console.log('Player joined:', data); // DEBUG
    players[socket.id] = { ...data, id: socket.id, score: players[socket.id]?.score || 0 };
    nameToSocket[data.name] = socket.id;
    io.emit('players', Object.values(players));
    console.log('players[socket.id] after join:', players[socket.id]);
  });

  // When a player moves
  socket.on('move', (pos) => {
    if (players[socket.id]) {
      players[socket.id] = { ...players[socket.id], ...pos };
      io.emit('players', Object.values(players));
    }
  });

  // When a player disconnects
  socket.on('disconnect', () => {
    if (players[socket.id]) {
      delete nameToSocket[players[socket.id].name];
      delete players[socket.id];
      io.emit('players', Object.values(players));
    }
  });

  // Send recent chat messages to new connection
  socket.emit('chat_history', chatMessages);

  // Handle chat messages
  socket.on('chat_message', (msg) => {
    if (typeof msg === 'object' && msg.name && msg.text) {
      const message = { name: msg.name, text: msg.text };
      chatMessages.push(message);
      if (chatMessages.length > 30) chatMessages.shift();
      io.emit('chat_message', message);
    }
  });

  // --- PvP Challenge Logic ---

  // Challenge request (only one handler, with debug log)
  socket.on('challenge_request', ({ to }) => {
    const challenger = players[socket.id];
    const targetSocket = nameToSocket[to];
    console.log('Received challenge_request:', { from: challenger?.name, to, targetSocket });
    if (challenger && targetSocket) {
      io.to(targetSocket).emit('challenge_request', { from: challenger.name });
    }
  });

  // Challenge response
  socket.on('challenge_response', ({ from, accepted }) => {
    const responder = players[socket.id];
    const fromSocket = nameToSocket[from];
    if (responder && fromSocket) {
      io.to(fromSocket).emit('challenge_response', { from: responder.name, accepted });
    }
  });

  // Challenger selects question
  socket.on('challenge_question', ({ to, question }) => {
    const challenger = players[socket.id];
    const targetSocket = nameToSocket[to];
    if (challenger && targetSocket) {
      io.to(targetSocket).emit('challenge_question', { from: challenger.name, question });
    }
  });

  // Challenged submits answer
  socket.on('challenge_answer', ({ to, correct }) => {
    const responder = players[socket.id];
    const targetSocket = nameToSocket[to];
    if (responder && targetSocket) {
      // Scoring logic
      if (correct) {
        players[socket.id].score += 2;
        io.to(targetSocket).emit('challenge_result', { correct: true, from: responder.name });
        io.to(socket.id).emit('challenge_result', { correct: true, from: responder.name });
      } else {
        players[socket.id].score -= 1;
        players[targetSocket].score += 1;
        io.to(targetSocket).emit('challenge_result', { correct: false, from: responder.name });
        io.to(socket.id).emit('challenge_result', { correct: false, from: responder.name });
      }
      io.emit('players', Object.values(players));
    }
  });
});

app.get('/', (req, res) => {
  res.send('Kodziarze multiplayer server running');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});