import io from "socket.io-client";
import { Chat } from "./chat.js";
import { saveHistory } from './saveHistory.js';

const HOST = process.env.DORA_ENGINE_HOST || "192.168.11.37";
const PORT = process.env.DORA_ENGINE_PORT || "3090";

const socket = io.connect(`ws://${HOST}:${PORT}/chat`, {
  reconnection: true,
  reconnectionDelay: 1000,
  rejectUnauthorized: false
});

const chat = new Chat({ scriptpath: "./scripts/elyza-chat.sh" });
const endmark = "[end]";
const messages = [];
let state = "idle";
let timeout = 0;
const history = [];

const resetConversation = async (callback) => {
  console.log("reset");
  if (timeout) clearTimeout(timeout);
  timeout = 0;

  try {
    if (history.length > 0) {
      await saveHistory(history);
    }
  } catch (error) {
    console.error("Error saving history:", error);
  }
  
  messages.length = 0;
  history.length = 0;
  if (typeof callback === 'function') callback();
};

const handleAsk = (payload, callback) => {
  console.log("ask", payload);
  if (timeout) clearTimeout(timeout);
  timeout = 0;

  messages.length = 0;
  chat.removeAllListeners();

  history.push({ role: "user", text: payload.text });

  const context = history.map((entry, index) => {
    if (entry.role === "user") {
      return index === 0 ? `${entry.text} [/INST]` : `</s><s>[INST] ${entry.text} [/INST]`;
    } else {
      return ` ${entry.text} </s><s>[INST]`;
    }
  }).join("");

  chat.on("end", () => messages.push({ text: endmark }));
  chat.on("close", () => messages.push({ text: endmark }));
  chat.on("data", (payload) => {
    messages.push(payload);
    history.push({ role: "bot", text: payload.text });
  });

  chat.ask(context);

  state = "playing";
  if (typeof callback === 'function') callback();
};

const handleGet = (payload, callback) => {
  console.log("handleGet called");
  callback = typeof callback === 'function' ? callback : () => {};

  if (state !== "playing") {
    callback({ text: "error" });
    return;
  }
  
  const wait = () => {
    if (messages.length > 0) {
      const payload = messages.shift();
      console.log(">", payload);
      callback(payload);
      return;
    }
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (state === "playing") {
        wait();
      }
    }, 100);
  };
  wait();
};

socket.on("connect", () => {
  console.log("Connected");
  socket.emit("notify", { role: "chatServer" });
});

socket.on("reset", resetConversation);

socket.on("ask", handleAsk);

socket.on("get", handleGet);

socket.on('disconnect', () => {
  console.log("Disconnected");
});
