import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { UserManager } from './managers/UserManger';

// Create an instance of Express
const app = express();

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Create a new instance of Socket.IO server with the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Create an instance of UserManager
const userManager = new UserManager();

// Set up a connection event for Socket.IO
io.on('connection', (socket: Socket) => {
  console.log('a user connected');
  userManager.addUser("randomName", socket);

  socket.on('disconnect', () => {
    console.log('user disconnected');
    userManager.removeUser(socket.id);
  });
});

// Set the Express app to listen on port 3000
server.listen(process.env.PORT || 4000, () => {
  console.log(`listening on *:${process.env.PORT || 4000}`);
});
