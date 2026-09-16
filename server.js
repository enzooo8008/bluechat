import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "messages.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

function loadMessages() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(messages.slice(-500), null, 2));
}

app.use(express.static(__dirname));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));

io.on("connection", (socket) => {
  socket.emit("chat history", loadMessages());

  socket.on("join", (name) => {
    const safeName = String(name || "Guest").trim().slice(0, 30) || "Guest";
    socket.data.name = safeName;
    socket.broadcast.emit("user joined", safeName);
  });

  socket.on("chat message", (text) => {
    const messageText = String(text || "").trim().slice(0, 1000);
    if (!messageText) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender: socket.data.name || "Guest",
      text: messageText,
      time: new Date().toISOString()
    };

    const messages = loadMessages();
    messages.push(message);
    saveMessages(messages);
    io.emit("chat message", message);
  });

  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", {
      name: socket.data.name || "Someone",
      isTyping: Boolean(isTyping)
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Blue Chat running at http://localhost:${PORT}`);
});
