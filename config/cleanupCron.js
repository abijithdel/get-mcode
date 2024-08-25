// const cron = require('node-cron');
// const Store = require('../helper/store'); // Adjust the path to your Store model

// // Define the cron job to run daily at midnight
// cron.schedule('0 0 * * *', async () => {
//   console.log('Cron job triggered');
//   try {
//     // Get the current date and time
//     const now = new Date();

//     // Find and delete documents where expiryDate is less than the current date
//     const result = await Store.deleteMany({ expiryDate: { $lt: now } });

//     console.log(`${result.deletedCount} expired documents deleted`);
//   } catch (err) {
//     console.error("Error during scheduled cleanup:", err);
//   }
// });
