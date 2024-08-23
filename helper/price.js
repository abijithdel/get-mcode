const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const priceSchema = new Schema({
  price: { type: Number, required: true },
  btnName: { type: String, required: true },
});

module.exports = mongoose.model('Price', priceSchema);
