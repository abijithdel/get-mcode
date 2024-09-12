const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ordereSchema = new Schema({
  code: { type: String },
  date: { type: Date },
  userId: { type: String },
  items: [
    {
      name: { type: String },
      quantity: { type: Number },
    },
  ],
});

module.exports = mongoose.model("order", ordereSchema);
