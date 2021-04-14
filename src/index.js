let express = require('express')
let app = express()
app.use(express.static('public'));

const http = require("http").createServer(app);
http.listen(7777, function () {
    console.log('Example app listening on port 7777!');
})

const io = require('socket.io')(http);

io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
      return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});

function getUserList(sockets){
    const users = [];
    for (let [id, socket] of sockets) {
        users.push({
            userId: id,
            userName: socket.username,
        });
    }
    return users;
}

io.on('connection', (socket) => {

    
    let users = getUserList(io.of('/').sockets);
    console.log('user connection',users)
    io.emit("users", users);

    socket.on('disconnect',()=>{
        let users = getUserList(io.of('/').sockets);
        console.log('user disconnect',users)
        io.emit("users", users);
    })

    socket.on('private message',(message)=>{
        console.log(message)
        socket.to(message.toId).emit("private message", {
            content: message.content,
            formId: socket.id,
        });
    })


    socket.on('chat message', (message) => { //收到message时，进行广播
        console.log(message)
        io.emit('chat message', message);
    });

    socket.on('message', (message) => { //收到message时，进行广播
        log('Got message:', message);
        // for a real app, would be room only (not broadcast)
        socket.broadcast.emit('message', message); //在真实的应用中，应该只在房间内广播
    });
    // convenience function to log server messages to the client
    function log() {
        const array = ['>>> Message from server: '];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }

    socket.on('message', (message) => { //收到message时，进行广播
        log('Got message:', message);
        // for a real app, would be room only (not broadcast)
        socket.broadcast.emit('message', message); //在真实的应用中，应该只在房间内广播
    });

    socket.on('create or join', (room) => { //收到 “create or join” 消息
        var clientsInRoom = io.of("/").adapter.rooms.get(room);
        console.log(clientsInRoom)
        var numClients = clientsInRoom ? clientsInRoom.size : 0; //房间里的人数

        if (numClients === 0) { //如果房间里没人
            socket.join(room);
            socket.emit('created', room); //发送 "created" 消息
        } else if (numClients === 1) { //如果房间里有一个人
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room); //发送 “joined”消息
        } else { // max two clients
            socket.emit('full', room); //发送 "full" 消息
        }
        socket.emit('emit(): client ' + socket.id +
            ' joined room ' + room);
        socket.broadcast.emit('broadcast(): client ' + socket.id +
            ' joined room ' + room);
    });

    socket.on("connect_error", (err) => {
        if (err.message === "invalid username") {
          this.usernameAlreadySelected = false;
        }
    });

});