const express = require("express");  //Import dos modulos necessarios-Express pra criar servidor
const path = require("path"); // Importa o modulo Path para manipulação de caminhos de arquivo
const http = require("http"); // Importa o modulo HTTP para criar o servidor HTTP
const socketIo = require("socket.io"); //Import do modulo socket.io para comunicação tempo real

const app = express();                
const server = http.createServer(app); //Criação do servidor http utilizando Express
const io = socketIo(server);           //inicializa o socket.io utilizando o servidor http criado

let threads = {}; // Objeto para armazenar mensagens por nas threads

app.use(express.static(path.join(__dirname, "public"))); //Configura express pra servir o html e css

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html")); //Define a rota principal e envia o arquivo index.html
});

// Função para lidar com RPC
const handleRPC = (socket, methodName, params, callback) => { //Verifica se o metodo e multiplicar e se os parametros sao validos
    if (methodName === "multiply") {
        const { a, b } = params;
        const result = a * b;
        callback(null, result); // Enviar resultado de volta para o cliente
    } else {
        callback("Método não encontrado", null);
    }
};

io.on("connection", (socket) => {
    console.log(`Socket conectado: ${socket.id}`); //A cada conexão ele mostra o socked id da pessoa

    // Lógica para Threads
    socket.on("joinThread", (threadId) => {
        socket.join(threadId); // A pessoa entra na  thread especifica
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
    socket.on("rpcCall", (params, callback) => { //O servidor ouve o evento de RPC e chama a função handleRPC para extrair os parametros e retornar o result
        const { method, args } = params;
        handleRPC(socket, method, args, callback);
    });

    
});

server.listen(8080, () => {
    console.log("Servidor escutando na porta 8080"); //Inicializa o servidor na porta 8080
});
