const express = require('express');
const app = express();
const server = require('http').Server(app);
// const io = require('socket.io')(server, { serveClient: false, origins: '*', cors: { origin: '*' } });
const io = require('socket.io')(server, { origins: '*', cors: { origin: '*' } });
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, { debug: true });


if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https')
      res.redirect(`https://${req.header('host')}${req.url}`)
    else
      next()
  })
}

app.use('/peerjs', peerServer);

io.on('connection', (socket) => {
  socket.on("join-room", (roomId, peerID, userID, userName) => {
    socket.join(roomId);
    io.to(roomId).emit("user-connected", peerID, userID, userName);
    socket.on('message', (obj) => {
      io.to(roomId).emit('newMessage', obj)
    });
    socket.on('typing', (data) => {
      socket.broadcast.emit('newTyper', data);
    })
    // edited
    socket.on('hangup', (userID, peerID) => {
      // edited
      io.to(roomId).emit('hangUp', userID, peerID)
    })
  })
})

let port = process.env.PORT || 5000;

app.get('/test', (req, res) => {
  res.send('TEST PORT: ' + port);
})

server.listen(port, () => console.log('server started at port: ' + port));