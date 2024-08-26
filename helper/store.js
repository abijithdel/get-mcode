const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const storeSchema = new Schema({
  name: { type: String, required: true },
  discrimination: { type: String,default:'Store discrimination' },
  userID: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  orderId: { type: String, required: true },
  paymentId: { type: String, required: true },
  serverip: { type: String ,default:'serverip.com'},
  port: { type: Number, default:1234},
  bgimg: { type: String, default:'default-img.png'},
  key_id: { type: String, default:'key_id'},
  key_secret: { type: String, default:'key_secret'},
  plans: [
    {
      name:{ type: String},
      planImg:{ type: String},
      items:[
        {
          name:{ type: String},
          quantity:{ type:Number }
        }
      ]
    }
  ]
});

module.exports = mongoose.model('stors', storeSchema);