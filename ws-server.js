import fs from "fs";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

console.log("WS running at ws://localhost:8080");

// broadcast helper
function broadcast(msg) {
  wss.clients.forEach((client) => {
    client.send(msg);
  });
}

// pantau perubahan file antrean
fs.watch("./data/queue.json", () => {
  console.log("queue.json changed, broadcasting...");
  broadcast("UPDATED");
});
