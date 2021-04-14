/**
 * 1v1音频
 * 
 * 1. 搭建信令系统
 *  用户状态
 * 2. turn服务器搭建
 *  推流拉流
 * 
 */
let express = require('express');
let app = express()
app.use(express.static('public'));

const http = require("http").createServer(app);
http.listen(7777, function () {
    console.log('Example app listening on port 7777!');
})
const USERCOUNT = 3; // 房间最大人数
const io = require('socket.io')(http);

io.use((socket, next) => {
    const userName = socket.handshake.auth.userName;
    if (!userName) {
      return next(new Error("invalid username"));
    }
    socket.userName = userName;
    next();
});

function getUserList(sockets){
    const users = [];
    for (let [id, socket] of sockets) {
        users.push({
            userId: id,
            userName: socket.userName,
        });
    }
    return users;
}
/**
 * 
 * 维护房间的状态
 * 客户端命令： 
 *  1. join 用户加入房间
 *  2. leave 用户离开房间
 *  3. message 
 * 
 * 服务端命令
 *  1. joined 用户加入
 *  2. leaved 用户已离开
 * 
 */
io.sockets.on('connection', (socket) => {
    console.log('connection:',socket.userName,socket.id)
    let users = getUserList(io.sockets.sockets);
    io.emit("user-list", users);

    socket.on('join', (roomName)=>{
        console.log('join:',roomName,socket.userName)
        let room = io.sockets.adapter.rooms.get(roomName)
        if(room && room.size >= USERCOUNT){
            socket.emit('full', roomName, socket.id);
        }else{
            socket.join(roomName);
            socket.emit('joined', roomName, socket.id);
        }
	});

    socket.on('leave', (roomName)=>{
        console.log('leave:',roomName,socket.userName)
        socket.leave(roomName);
        socket.to(roomName).emit('bye', roomName, socket.id);
        socket.emit('leaved', roomName, socket.id);
	});

    socket.on('create-offer',(data)=>{
        socket.emit("created-offer", data, socket.id);
    })

    socket.on('create-answer',(data)=>{
        socket.emit("created-answer", data, socket.id);
    })

    
})