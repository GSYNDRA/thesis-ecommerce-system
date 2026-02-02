'use strict';

import os from 'os';
import process from 'process';

const _SECONDS = 5000;

// Count open database connections
const countConnect = async (sequelize) => {
  try {
    const poolInfo = sequelize.connectionManager.pool;
    const activeConnections = poolInfo?.size || 0;
    const availableConnections = poolInfo?.available || 0;

    console.log(`Active connections: ${activeConnections}`);
    console.log(`Available connections: ${availableConnections}`);
  } catch (error) {
    console.error('Error while counting connections:', error.message);
  }
};

// Monitor connection overload
const checkOverload = (sequelize) => {
  setInterval(async () => {
    try {
      const poolInfo = sequelize.connectionManager.pool;
      const activeConnections = poolInfo?.size || 0;
      const numCores = os.cpus().length;
      const memoryUsage = process.memoryUsage().rss;
      const maxConnections = numCores * 5;

      console.log(`Active connections: ${activeConnections}`);
      console.log(`Memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)} MB`);

      if (activeConnections > maxConnections) {
        console.warn('Connection overload detected!');
      }
    } catch (err) {
      console.error('Error checking overload:', err.message);
    }
  }, _SECONDS);
};

export { countConnect, checkOverload };
