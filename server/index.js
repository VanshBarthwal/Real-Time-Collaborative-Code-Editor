const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rooms = {};
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
}); 


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);

  
    socket.roomId = roomId;
    socket.userName = userName;

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push({ id: socket.id, name: userName });

  
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

    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(
        (user) => user.id !== socket.id
      );
      
      io.to(roomId).emit('user-list', rooms[roomId]);
    }

    console.log(`${userName} disconnected`);
  });
});

server.listen(5000, () => {
  console.log('Server running on port 5000');
});