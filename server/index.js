const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// This object tracks all rooms and their users
// Like a dictionary in Python
// { 'room123': [ {id: 'abc', name: 'John'}, {id: 'xyz', name: 'Jane'} ] }
const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userName }) => {
    // Join the Socket.io room
    socket.join(roomId);

    // Remember which room this socket is in
    // We need this when they disconnect
    socket.roomId = roomId;
    socket.userName = userName;

    // Add user to our rooms tracking object
    if (!rooms[roomId]) {
      rooms[roomId] = []; // create room if it doesn't exist
    }
    rooms[roomId].push({ id: socket.id, name: userName });

    // Send updated user list to EVERYONE in the room
    io.to(roomId).emit('user-list', rooms[roomId]);

    console.log(`${userName} joined room ${roomId}`);
  });

  socket.on('code-change', ({ roomId, code }) => {
    socket.to(roomId).emit('code-update', code);
  });

  socket.on('language-change', ({ roomId, language }) => {
    socket.to(roomId).emit('language-update', language);
  });

  socket.on('disconnect', () => {
    const { roomId, userName } = socket;

    // Remove user from the room when they disconnect
    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(
        (user) => user.id !== socket.id
      );
      // Tell everyone remaining in the room
      io.to(roomId).emit('user-list', rooms[roomId]);
    }

    console.log(`${userName} disconnected`);
  });
});

server.listen(5000, () => {
  console.log('Server running on port 5000');
});