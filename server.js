import app from "./src/app.js";
import Database from "./src/api/v1/database/init.postgredb.js";
import redisClient from "./src/api/v1/database/init.redis.js";
import reservationExpirySubscriber from "./src/api/v1/services/reservationExpiry.subscriber.js";
import PostgreSQLMonitor from "./src/monitor/postgreDB.monitor.js";
import config from "./src/api/v1/configs/config.sequelize.js";

const PORT = config.app.port || 3030;

async function startServer() {
  let server;
  const isTest = config.nodeEnv === "test";
  const db = Database.getInstance();

  // Expose Redis globally for checkout reservation flow.
  globalThis.redisClient = redisClient;

  try {
    if (!isTest) {
      console.log("Connecting to PostgreSQL...");
      await db.connect("ecommerce");
      const sequelize = db.getSequelize();

      await sequelize.authenticate();
      console.log("PostgreSQL connected");
      await reservationExpirySubscriber.start();

      const pgMonitor = PostgreSQLMonitor.getInstance(sequelize);
      // pgMonitor.startMonitoring();

      const gracefulShutdown = async (signal) => {
        console.log(`\n${signal} received. Graceful shutdown...`);

        try {
          server?.close(async () => {
            console.log("Express server closed");

            // pgMonitor.stopMonitoring();
            await reservationExpirySubscriber.stop();
            if (redisClient.isOpen) {
              await redisClient.quit();
            }
            await db.disconnect();

            process.exit(0);
          });
        } catch (err) {
          console.error("Shutdown error:", err);
          process.exit(1);
        }
      };

      process.on("SIGINT", gracefulShutdown);
      process.on("SIGTERM", gracefulShutdown);
    }

    server = app.listen(PORT, () => {
      console.log(`WSV eCommerce running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
