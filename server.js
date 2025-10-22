//  only declare the port number and initialize the system server.
import app from "./src/app.js"
import { sequelize } from './src/database/init.postgredb.js'; // adjust the path


const PORT = process.env.DEV_APP_PORT || 3030
console.log('MASTER_KEY:', process.env.MASTER_KEY);
const server = app.listen(PORT, () => {
    console.log(`WSV eCommerce start with ${PORT}`)
})

// process.on('SIGINT', ()=> {
//     // notify when server close.
//     server.close( ()=> console.log(`Exit server Express`))
//     // notify.send(ping)
// })

process.on('SIGINT', async () => {
  try {
    console.log('\n🔻 Closing server and database connection...');

    // 1. Close Express server
    server.close(async () => {
      console.log('🛑 Express server closed.');

      // 2. Close Sequelize connection
      await sequelize.close();
      console.log('✅ PostgreSQL connection closed successfully.');

      // 3. Exit process cleanly
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Error closing database:', err);
    process.exit(1);
  }
});