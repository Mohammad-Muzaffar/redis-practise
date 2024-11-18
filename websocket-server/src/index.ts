import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "redis";

const app = express();
app.use(express.json());

const redisClient = createClient();
redisClient.on("error", (err) => console.error("Redis Client Error:", err));

const httpServer = app.listen(3001, () => {
  console.log("WebSocket server listening at port: 3001");
});

// Create a WebSocket server
const wss = new WebSocketServer({ server: httpServer });

// Map to store WebSocket connections and their user IDs
const userConnections = new Map<string, WebSocket>();

// Connect Redis client once
(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis.");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
    process.exit(1); // Exit if Redis connection fails
  }
})();

// WebSocket connection handler
wss.on("connection", (socket: WebSocket) => {
  console.log("New WebSocket connection established.");

  socket.on("message", async (message) => {
    try {
      const userId = message.toString(); // User sends their userId as a message
      userConnections.set(userId, socket); // Store the socket in the map

      const channel = `problem_done_${userId}`; // Dynamic channel based on userId
      await redisClient.subscribe(channel, (message) => {
        if (socket.readyState === WebSocket.OPEN) {
            console.log(message)
          socket.send(message); // Send the message directly to the WebSocket client
        }
      });
      console.log(`Subscribed to channel: ${channel}`);
    } catch (error) {
      console.error("Error processing message:", error);
      socket.send("An error occurred while processing your message.");
    }
  });

  socket.on("close", () => {
    console.log("WebSocket connection closed.");

    // Clean up connections and subscriptions
    for (const [userId, s] of userConnections) {
      if (s === socket) {
        userConnections.delete(userId);
        console.log(`Removed connection for user: ${userId}`);
        break;
      }
    }
  });
});
