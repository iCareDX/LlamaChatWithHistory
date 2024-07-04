import io from "socket.io-client";
import { Chat } from "./chatWanco.js";
import { saveHistory } from './saveHistory.js';

const HOST = process.env.DORA_ENGINE_HOST || "localhost";
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
  clearTimeout(timeout);
  timeout = 0;

  try {
    if (history.length > 0) {
      await saveHistory(history);
    }
  } catch (error) {
    console.error("Error saving history:", error);
  } finally {
    messages.length = 0;
    history.length = 0;
    if (typeof callback === 'function') callback();
  }
};

const handleAsk = (payload, callback) => {
  console.log("ask", payload);
  clearTimeout(timeout);
  timeout = 0;

  messages.length = 0;
  chat.removeAllListeners();

  history.push({ role: "user", text: payload.text });

  const context = history.map((entry, index) => 
    entry.role === "user"
      ? index === 0 ? `${entry.text} [/INST]` : `</s><s>[INST] ${entry.text} [/INST]`
      : ` ${entry.text} `
  ).join("")+'\n';

  chat.on("end", () => {
    messages.push({ text: endmark });
    console.log("Chat ended");
  });

  chat.on("close", () => {
    messages.push({ text: endmark });
    console.log("Chat closed");
  });

  chat.on("data", (payload) => {
    messages.push(payload);
    history.push({ role: "bot", text: payload.text });
    console.log("Received bot message:", payload.text);
  });

  chat.ask(context);

  state = "playing"; // Change state to playing
  if (typeof callback === 'function') callback();
};

const handleGet = (payload, callback) => {
  console.log("handleGet called");
  callback = typeof callback === 'function' ? callback : () => {};

  const waitForMessage = () => {
    if (messages.length > 0) {
      const payload = messages.shift();
      console.log(">", payload);
      callback(payload);
      
      if (payload.text === endmark) {
        state = "idle";
        console.log("Endmark received, state set to idle");
      }
      return;
    }

    if (state === "playing") {
      timeout = setTimeout(waitForMessage, 100);
    } else {
      console.log("State changed to idle, stopping wait");
      callback({ text: "error" });
    }
  };

  if (state !== "playing" && messages.length === 0) {
    console.log("State is not playing and no messages");
    callback({ text: "error" });
  } else {
    waitForMessage();
  }
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
