const express = require("express");
const router = express.Router();
const User = require("../helper/userDB");
var bcrypt = require("bcrypt");
var Price = require("../helper/price");
var Razorpay = require("razorpay");
const crypto = require("crypto");
const Store = require("../helper/store");

var instance = new Razorpay({
  key_id: "rzp_test_IWrl9K2JnNrzFm",
  key_secret: "BzyM7N0PxqV7HuIphsczNN53",
});

router.get("/", (req, res) => {
  res.render("index", { user: req.session.userSession });
});

router.get("/login", (req, res) => {
  if (req.session.login) {
    res.redirect("/");
  } else {
    res.render("main/login");
  }
});

router.get("/signup", async (req, res) => {
  if (req.session.login) {
    res.redirect("/");
  } else {
    res.render("main/signup");
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { fname, lname, email, pass, cpass } = req.body;

    // Check if email already exists
    const emailValid = await User.findOne({ email });
    if (emailValid) {
      return res.render("main/signup", { emailError: "email already exists" });
    }

    if (pass !== cpass) {
      return res
        .status(400)
        .render("main/signup", { passError: "Passwords do not match." });
    }

    // Hash the password
    const hashedPass = await bcrypt.hash(pass, 10);

    // Create new user using NewUser
    const newUser = new User({
      fname,
      lname,
      email,
      pass: hashedPass,
    });

    req.session.login = true;
    req.session.userSession = newUser;

    await newUser.save();
    res.status(201).redirect("/");
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/login", async (req, res) => {
  const { email, pass } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .render("main/login", { error: "User not found. Please sign up." });
    }

    const passMatch = await bcrypt.compare(pass, user.pass);
    if (passMatch) {
      req.session.login = true;
      req.session.userSession = user;
      res.redirect("/");
    } else {
      res.status(401).render("main/login", { error: "Incorrect password." });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.redirect("/");
  });
});

router.get("/documentation", (req, res) => {
  res.render("main/documentation", { user: req.session.userSession });
});

router.get("/createstore", async (req, res) => {
  if (req.session.login) {
    try {
      var newPrice = await Price.find();
      res.render("main/createstore", { user: req.session.userSession, newPrice });
    } catch (err) {
      console.log(err);
      res.send("Server error");
    }
  } else {
    res.render("main/signup");
  }

});

router.get("/payment-form", (req, res) => {
  if (req.session.login) {
    res.render("main/payment-form", { user: req.session.userSession });
  } else {
    res.redirect("/login");
  }
});

router.post("/payment-form", async (req, res) => {
  try {
    let { name, duration } = req.body;
    let id = req.session.userSession._id
    var dbprice = await Price.find();
    if (!dbprice || dbprice.length === 0) {
      return res.status(404).send("Price not found");
    }
    const orderPrice = dbprice[0].price;

    const order = await instance.orders.create({
      amount: orderPrice * 100,
      currency: "INR",
      receipt: `order_rcptid_${Math.floor(Math.random() * 10000)}`, // Unique receipt ID
    });
    res.render('main/confirmation',{order, name, duration, id, user: req.session.userSession})
  } catch (err) {
    console.log(err);
    res.send("Server error");
  }
});

router.post('/payment/success', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, name, duration, userID } = req.body;

    // Verify the payment signature
    const crypto = require('crypto');
    const razorpaySecret = "BzyM7N0PxqV7HuIphsczNN53"; // Ensure you're using env variables
    const generatedSignature = crypto.createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Invalid signature:', { generatedSignature, razorpay_signature });
      return res.status(400).send({ message: 'Invalid signature' });
    }

    // Calculate dates
    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate.getTime() + duration * 24 * 60 * 60 * 1000);

    // Create new order
    const order = new Store({
      name,
      userID: userID,
      purchaseDate: purchaseDate,
      expiryDate: expiryDate,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    // Save order
    await order.save();
    res.send({ message: 'Payment successful and order processed' });

  } catch (err) {
    console.error('Error in /payment/success route:', err);
    res.status(500).send({ message: 'Server error' });
  }
});



module.exports = router;
