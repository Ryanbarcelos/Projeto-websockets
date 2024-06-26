const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let threads = {}; // Objeto para armazenar mensagens por thread

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// Função para lidar com RPC
const handleRPC = (socket, methodName, params, callback) => {
    if (methodName === "multiply") {
        const { a, b } = params;
        const result = a * b;
        callback(null, result); // Enviar resultado de volta para o cliente
    } else {
        callback("Método não encontrado", null);
    }
};

io.on("connection", (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // Lógica para Threads
    socket.on("joinThread", (threadId) => {
        socket.join(threadId); // O cliente entra na sala (thread) específica
        if (!threads[threadId]) {
            threads[threadId] = []; // Inicializa a thread se ainda não existir
        }
        socket.emit("threadMessages", threads[threadId]); // Envia as mensagens atuais da thread para o cliente
    });

    socket.on("sendMessage", (data) => {
        const { threadId, message } = data;
        const messageObject = {
            author: message.author,
            message: message.message,
            timestamp: new Date().getTime()
        };
        threads[threadId].push(messageObject); // Adiciona a mensagem à thread específica
        io.to(threadId).emit("receivedMessage", messageObject); // Envia a mensagem para todos na thread
    });

    // RPC Handler
    socket.on("rpcCall", (params, callback) => {
        const { method, args } = params;
        handleRPC(socket, method, args, callback);
    });

    // Outras lógicas de socket, se necessário
});

server.listen(8080, () => {
    console.log("Servidor escutando na porta 8080");
});
