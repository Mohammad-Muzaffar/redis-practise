import express from "express";
import { createClient } from "redis";

const app = express();
app.use(express.json());

const client = createClient();
client.on("error", (err) => console.error("Redis Client Error: ", err));

app.post("/api/submit", async (req, res) => {
  const { problemId, userId, code, language } = req.body;
  try {
    // Idealy you shuld stor this thing in db first but we are just learning redis.
    await client.lPush(
      "submisions",
      JSON.stringify({ problemId, userId, code, language })
    );
    res.status(200).send("Submission recieved and stored in redis queue.")
  } catch (error) {
    console.error("Redis error:", error);
    res.status(500).send("Failed to store submission.");
  }
});

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to Redis.");

    app.listen(3000, () => {
      console.log("Server is running at port: 3000");
    });
  } catch (error) {
    console.error("Failed to connect to Redis.", error);
  }
}

startServer();
