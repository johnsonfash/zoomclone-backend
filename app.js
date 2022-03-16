const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, { serveClient: false, origins: '*', cors: { origin: '*' } });
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, { debug: true });

app.use('/peerjs', peerServer);

io.on('connection', (socket) => {
  socket.on("join-room", (roomId, peerID, userID, userName) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", peerID, userID, userName);
    socket.on('message', (obj) => {
      io.to(roomId).emit('newMessage', obj)
    });
    socket.on('typing', (data) => {
      socket.broadcast.emit('newTyper', data);
    })
    socket.on('hangup', (data) => {
      io.to(roomId).emit('hangUp', data)
    })
  })
})

let port = process.env.PORT || 5000;

app.get('/test', (req, res) => {
  res.send('TEST PORT: ' + port);
})

server.listen(port, () => console.log('server started at port: ' + port));