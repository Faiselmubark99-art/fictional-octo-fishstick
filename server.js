const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const activeUsers = new Map();

io.on('connection', (socket) => {
    console.log('مستخدم متصل:', socket.id);

    socket.on('register-user', (username) => {
        activeUsers.set(username, socket.id);
        console.log(`تم تسجيل اليوزر: ${username}`);
    });

    socket.on('call-user', (data) => {
        const targetSocketId = activeUsers.get(data.targetUser);
        if (targetSocketId) {
            io.to(targetSocketId).emit('incoming-call', {
                from: data.fromUser,
                signal: data.signal
            });
        } else {
            socket.emit('call-failed', { message: 'المستخدم غير متصل حالياً أو غير موجود' });
        }
    });

    socket.on('accept-call', (data) => {
        const targetSocketId = activeUsers.get(data.toUser);
        if (targetSocketId) {
            io.to(targetSocketId).emit('call-accepted', data.signal);
        }
    });

    socket.on('reject-call', (data) => {
        const targetSocketId = activeUsers.get(data.toUser);
        if (targetSocketId) {
            io.to(targetSocketId).emit('call-rejected');
        }
    });

    socket.on('disconnect', () => {
        for (let [username, id] of activeUsers.entries()) {
            if (id === socket.id) {
                activeUsers.delete(username);
                console.log(`تم إزالة المستخدم: ${username}`);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`السيرفر يعمل على البورت ${PORT}`);
});
