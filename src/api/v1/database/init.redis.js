import { createClient } from "redis";

const redisClient = createClient({
  url: "redis://localhost:6379",
});

// Connect Redis client
redisClient.connect().catch(console.error);

// Handle Redis errors
redisClient.on("error", (err) => console.log("Redis Client Error", err));

export default redisClient;
