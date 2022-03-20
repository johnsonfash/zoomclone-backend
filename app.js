const express = require('express');
const app = express();
const cors = require('cors');
const fileUpload = require('express-fileupload');
const server = require('http').Server(app);
// const io = require('socket.io')(server, { serveClient: false, origins: '*', cors: { origin: '*' } });
const io = require('socket.io')(server, { origins: '*', cors: { origin: '*' } });
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, { debug: true });


app.use(cors())
app.use(fileUpload());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https')
      res.redirect(`https://${req.header('host')}${req.url}`)
    else
      next()
  })
}



// file upload
// let files = req.files
// if (!req.files || Object.keys(req.files).length === 0) {
//   return res.status(400).send('No files were uploaded.');
// }
// uploadPath = __dirname + '/somewhere/on/your/server/' + files[0].name; multiple select
// uploadPath = __dirname + '/somewhere/on/your/server/' + files.input1.name; multiple input
// uploadPath = __dirname + '/somewhere/on/your/server/' + files.input2.name;
// files.forEach((file) => file.mv(path, (err) => console.log(err)))



app.use('/peerjs', peerServer);

io.on('connection', (socket) => {
  socket.on("join-room", (roomId, peerID, userID, userName, userImage) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('userConnected', { peerID, userID, userName, userImage });
    socket.on('message', (obj) => {
      io.to(roomId).emit('newMessage', obj)
    });
    socket.on('typing', (data) => {
      socket.broadcast.to(roomId).emit('newTyper', data);
    })
    socket.on('mute-audio', (id, value) => {
      socket.to(roomId).emit('muted-audio', id, value)
    })
    socket.on('mute-video', (id, value) => {
      socket.to(roomId).emit('muted-video', id, value)
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