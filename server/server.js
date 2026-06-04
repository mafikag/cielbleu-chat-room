
require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");

const Message = require("./models/Message");

const app = express();

function normalizeBasePath(basePath) {
  if(!basePath || basePath === "/"){
    return "";
  }

  return `/${basePath.replace(/^\/+|\/+$/g, "")}`;
}

function normalizeOrigin(origin) {
  return origin.replace(/\/+$/, "");
}

const appBasePath = normalizeBasePath(process.env.APP_BASE_PATH || "/client");
const socketPath = `${appBasePath || ""}/socket.io`;
const clientDir = process.env.CLIENT_DIR
  ? path.resolve(__dirname, process.env.CLIENT_DIR)
  : path.resolve(__dirname, "..", "client");

const allowedOrigins = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(",").map((origin) => normalizeOrigin(origin.trim()))
  : "*";

const corsOptions = {
  origin: allowedOrigins === "*"
    ? "*"
    : (origin, callback) => {
      if(!origin || allowedOrigins.includes(normalizeOrigin(origin))){
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    }
};

app.use(cors(corsOptions));

function healthCheck(req, res) {
  res.json({
    status: "ok",
    appBasePath: appBasePath || "/",
    socketPath,
    timestamp: new Date().toISOString()
  });
}

app.get("/health", healthCheck);

if(appBasePath){
  app.get(`${appBasePath}/health`, healthCheck);
  app.use(appBasePath, express.static(clientDir));
  app.get(appBasePath, (req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
  app.get("/", (req, res) => {
    res.redirect(appBasePath);
  });
} else {
  app.use(express.static(clientDir));
  app.get("/", (req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

const server = http.createServer(app);

const io = new Server(server, {
  path: socketPath,
  cors: corsOptions
});

let onlineUsers = {};

io.on("connection", (socket) => {

  socket.on("joinRoom", async ({ username, room }) => {
    try {
      if(!username || !room){
        return;
      }

      socket.join(room);

      onlineUsers[socket.id] = {
        username,
        room,
        online: true
      };

      const usersInRoom = Object.values(onlineUsers)
        .filter(user => user.room === room);

      io.to(room).emit("onlineUsers", usersInRoom);

      const messages = await Message.findByRoom(room, 100);

      socket.emit("loadMessages", messages);

      io.to(room).emit("systemMessage", {
        username: "System",
        message: `${username} joined the room`
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      socket.emit("systemMessage", {
        username: "System",
        message: "Unable to load room messages"
      });
    }
  });

  socket.on("chatMessage", async (data) => {
    try {
      if(!data?.username || !data?.room || !data?.message){
        return;
      }

      const newMessage = new Message(data);

      await newMessage.save();

      io.to(data.room).emit("message", {
        username: data.username,
        message: data.message
      });
    } catch (error) {
      console.error("Failed to save message:", error);
      socket.emit("systemMessage", {
        username: "System",
        message: "Unable to send message"
      });
    }
  });

  socket.on("disconnect", () => {

    const user = onlineUsers[socket.id];

    if(user){

      user.online = false;

      io.to(user.room).emit("offlineUser", user);

      delete onlineUsers[socket.id];

      const usersInRoom = Object.values(onlineUsers)
        .filter(u => u.room === user.room);

      io.to(user.room).emit("onlineUsers", usersInRoom);
    }
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Ciel bleu Chat Running on port ${PORT}`);
  console.log(`App base path: ${appBasePath || "/"}`);
  console.log(`Socket.IO path: ${socketPath}`);
});
