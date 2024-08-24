const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const storeSchema = new Schema({
  name: { type: String, required: true },
  userID: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  orderId: { type: String, required: true },
  paymentId: { type: String, required: true },
  serverip: { type: String ,default:'serverip.com'},
  port: { type: Number, default:1234},
});

module.exports = mongoose.model('stors', storeSchema);