const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://zuum.herokuapp.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next()
})
const server = require('http').Server(app);
const io = require('socket.io')(server, { serveClient: false, origins: 'https://zuum.herokuapp.com', cors: { origin: 'https://zuum.herokuapp.com' } });
//const io = require('socket.io')(server, { origins: '*', cors: { origin: '*' } });
// const io = require('socket.io')(server);
// const io = require('socket.io')(server, { cors: { origin: 'https://zuum.herokuapp.com', methods: ['GET', 'PUT', 'POST'] } });
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
  socket.on("join-room", ({ roomId, peerID, userID, userName }) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('userConnected', { peerID, userID, userName });
    socket.on('message', (obj) => {
      socket.to(roomId).emit('newMessage', obj)
    });
    socket.on('typing', (data) => {
      socket.to(roomId).broadcast.emit('newTyper', data);
    })
    // edited
    socket.on('hangup', ({ userID, peerID }) => {
      // edited
      socket.to(roomId).emit('hangUp', { userID, peerID })
    })
  })
})

let port = process.env.PORT || 5000;

app.get('/test', (req, res) => {
  res.send(`TEST PORT: ${port} and ENV: ${process.env.NODE_ENV}`);
})

server.listen(port, () => console.log('server started at port: ' + port));