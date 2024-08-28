const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ordereSchema = new Schema({
  name: { type: String },
  quantity: { type: Number },
  code: { type: String },
  date: { type: Date, },
  userId: { type: String, },
});

module.exports = mongoose.model("order", ordereSchema);
