const socket = io();

const modal = document.getElementById("nameModal");
const nameInput = document.getElementById("nameInput");
const enterBtn = document.getElementById("enterBtn");
const messages = document.getElementById("messages");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");
const typing = document.getElementById("typing");

let myName = localStorage.getItem("blueChatName") || "";
let typingTimer;

function enterChat() {
  const name = nameInput.value.trim().slice(0, 30);
  if (!name) return;
  myName = name;
  localStorage.setItem("blueChatName", myName);
  modal.classList.add("hidden");
  socket.emit("join", myName);
  input.focus();
}

if (myName) {
  modal.classList.add("hidden");
  socket.emit("join", myName);
}

enterBtn.addEventListener("click", enterChat);
nameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") enterChat();
});

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function addMessage(message) {
  const el = document.createElement("div");
  el.className = `message ${message.sender === myName ? "mine" : ""}`;

  const sender = document.createElement("div");
  sender.className = "sender";
  sender.textContent = message.sender;

  const text = document.createElement("div");
  text.className = "text";
  text.textContent = message.text;

  const time = document.createElement("div");
  time.className = "time";
  time.textContent = formatTime(message.time);

  el.append(sender, text, time);
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

socket.on("chat history", history => {
  messages.innerHTML = "";
  history.forEach(addMessage);
});

socket.on("chat message", addMessage);

socket.on("user joined", name => {
  typing.textContent = `${name} joined the chat`;
  setTimeout(() => {
    if (typing.textContent.includes("joined")) typing.textContent = "";
  }, 2500);
});

socket.on("typing", data => {
  typing.textContent = data.isTyping ? `${data.name} is typing…` : "";
});

input.addEventListener("input", () => {
  socket.emit("typing", true);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => socket.emit("typing", false), 900);
});

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.emit("chat message", text);
  input.value = "";
  socket.emit("typing", false);
  clearTimeout(typingTimer);
  input.focus();
});