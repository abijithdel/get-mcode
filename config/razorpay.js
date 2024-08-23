// razorpay.js
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
    key_id: 'YOUR_KEY_ID',  // Replace with your Razorpay key_id
    key_secret: 'YOUR_KEY_SECRET'  // Replace with your Razorpay key_secret
});

// Route to create an order
app.post('/create-order', async (req, res) => {
    const { amount, currency, receipt } = req.body;
    
    const options = {
        amount: amount || 50000,  // amount in the smallest currency unit (default: ₹500)
        currency: currency || 'INR',  // default currency is INR
        receipt: receipt || 'order_rcptid_11'
    };
    
    try {
        const order = await razorpay.orders.create(options);
        res.json(order);  // Send the order details to the frontend
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send('Error creating order');
    }
});

// Route to verify payment signature
app.post('/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const hmac = crypto.createHmac('sha256', razorpay.key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
        res.send('Payment verified successfully');
    } else {
        res.status(400).send('Payment verification failed');
    }
});

// Starting the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
