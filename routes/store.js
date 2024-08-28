var express = require("express");
var router = express.Router();
var Store = require("../helper/store");
const upload = require("../config/multer");
const crypto = require("crypto");
const Order = require("../helper/order");
const userlogin = (req, res, nest) => {
  if (req.session.login) {
    nest();
  } else {
    res.redirect("/login");
  }
};

router.get("/sp/:id", async (req, res) => {
  try {
    const storeId = req.params.id;
    const store = await Store.findById(storeId);
    res.render("store/store", {
      user: req.session.userSession,
      store,
      storeStatus: true,
      plans: store.plans,
    });
  } catch (err) {
    console.log(err);
    res.send("Server error");
  }
});

router.get("/sp/:id/edit", userlogin, async (req, res) => {
  try {
    var userid = req.session.userSession._id;
    const storeId = req.params.id;
    const store = await Store.findById(storeId);
    if (userid == store.userID) {
      res.render("store/edit-store", { user: req.session.userSession, store });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
    res.send("Server error");
  }
});

router.post("/sp/:id/edit", upload.single("bgimg"), async (req, res) => {
  try {
    const storeId = req.params.id;
    const { name, discrimination, serverip, port } = req.body;

    // Prepare the update data
    const updateData = {
      name,
      discrimination,
      serverip,
      port,
    };

    // Only update the bgimg field if a new file is uploaded
    if (req.file) {
      updateData.bgimg = req.file.filename;
    }

    // Update the store document
    const updatedStore = await Store.findByIdAndUpdate(storeId, updateData, {
      new: true,
    });

    // Check if the store exists
    if (!updatedStore) {
      return res.status(404).send("Store not found.");
    }

    // Redirect to the updated store page or another desired page
    res.redirect(`/store/sp/${storeId}`);
  } catch (error) {
    console.error("Error updating store:", error);
    res.status(500).send("An error occurred while updating the store.");
  }
});

router.get("/sp/:id/razorpay-keys", userlogin, async (req, res) => {
  var userid = req.session.userSession._id;
  const storeId = req.params.id;
  const store = await Store.findById(storeId);
  if (userid == store.userID) {
    res.render("store/razorpay-key", { user: req.session.userSession, store });
  } else {
    res.redirect("/");
  }
});

router.post("/sp/:id/razorpay-keys", async (req, res) => {
  try {
    const storeid = req.params.id;
    const keys = {
      key_id: req.body.keyid,
      key_secret: req.body.keysecret,
    };
    console.log(keys);
    const store = await Store.findByIdAndUpdate(storeid, keys, { new: true });
    if (!store) {
      res.send("Server error");
    }
    res.send("successfully add razorpay keys");
  } catch (err) {
    console.log(err);
    res.send("Server Error");
  }
});

router.get("/sp/:id/new-plan", userlogin, async (req, res) => {
  try {
    const userid = req.session.userSession._id;
    const store = await Store.findById(req.params.id);
    if (userid == store.userID) {
      res.render("store/create-plans", { store }); // Pass items to the Handlebars template
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching items");
  }
});

router.post("/sp/:id/new-plan", upload.single("img"), async (req, res) => {
  try {
    const storeId = req.params.id; // Retrieve store ID from route parameter

    // Retrieve form data
    const planName = req.body.name;
    const planImg = req.file ? req.file.filename : ""; // Handle uploaded image file
    const price = parseFloat(req.body.price); // Retrieve price from the form and convert to number
    const items = [];

    // Process and collect items
    let itemIndex = 1;
    while (req.body[`item${itemIndex}_name`]) {
      items.push({
        name: req.body[`item${itemIndex}_name`],
        quantity: parseInt(req.body[`item${itemIndex}_quantity`]), // Ensure quantity is an integer
      });
      itemIndex++;
    }

    // Find the store by ID and add the new plan
    const store = await Store.findById(storeId);
    store.plans.push({
      name: planName,
      planImg: planImg,
      price: price, // Add price to the new plan
      items: items,
    });

    await store.save(); // Save the updated store
    res.redirect(`/store/sp/${storeId}`); // Redirect to the store page
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error"); // Handle errors
  }
});

router.get("/sp/:id/all-plans", userlogin, async (req, res) => {
  try {
    const userid = req.session.userSession._id;
    const id = req.params.id;
    const store = await Store.findById(id);
    if (userid == store.userID) {
      res.render("store/all-plans", {
        plans: store.plans,
        store,
        user: req.session.userSession,
      });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
    res.send("Server error");
  }
});

router.get("/sp/:id/delete", userlogin, async (req, res) => {
  try {
    const store = await Store.findOne({ "plans._id": req.params.id });
    const userid = req.session.userSession._id;

    if (!store) {
      return res.status(404).send("Plan not found");
    }

    if (userid == store.userID) {
      await Store.updateOne(
        { _id: store._id },
        { $pull: { plans: { _id: req.params.id } } }
      );

      console.log("Plan deleted successfully");
      res.send("Delete item"); // You can redirect to a success page or wherever you need
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
    res.send("Server error");
  }
});

router.get("/sp/:id/order", userlogin, async (req, res) => {
  try {
    const planId = req.params.id; // Retrieve the plan ID from the route parameter

    // Find the store containing the specified plan ID
    const store = await Store.findOne({ "plans._id": planId });

    // If no store is found, return a 404 error
    if (!store) {
      return res.status(404).send("Plan not found");
    }

    // Retrieve the specific plan by its ID from the store's plans array
    const plan = store.plans.id(planId);

    // Initialize Razorpay instance with the store's key_id and key_secret
    const Razorpay = require("razorpay");
    const instance = new Razorpay({
      key_id: store.key_id, // Use the store's key_id
      key_secret: store.key_secret, // Use the store's key_secret
    });

    // Create a new Razorpay order for the plan
    const order = await instance.orders.create({
      amount: plan.price * 100, // Razorpay requires amount in paisa (1 INR = 100 paisa)
      currency: "INR",
      receipt: `order_rcptid_${Math.floor(Math.random() * 10000)}`, // Unique receipt ID
    });

    // Render the confirmation page and pass the necessary details
    res.render("store/confirmation", {
      store,
      plan,
      user: req.session.userSession,
      order, // Pass the generated Razorpay order
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/sp/store-plan/confirmation", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      userID,
      planid,
    } = req.body;

    // Find the store containing the plan
    const store = await Store.findOne({ "plans._id": planid });

    if (!store) {
      return res.status(404).send({ message: "Store or plan not found" });
    }

    // Use the store's key_secret for signature verification
    const crypto = require("crypto");
    const razorpaySecret = store.key_secret;

    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("Invalid signature:", {
        generatedSignature,
        razorpay_signature,
      });
      return res.status(400).send({ message: "Invalid signature" });
    }

    // Find the plan by ID
    const plan = store.plans.find((p) => p._id.toString() === planid);

    if (!plan) {
      return res.status(404).send({ message: "Plan not found" });
    }

    // Process each item in the plan's items array
    const purchaseDate = new Date();
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (const item of plan.items) {
      let code = "";

      // Generate a random 10-character code
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
      }
      console.log(userID);
      
      // Create a new order for each item
      const newOrder = new Order({
        name: item.name,
        quantity: item.quantity,
        code: code,
        date: purchaseDate,
        userId: userID
      });

      // Save the new order to the database
      await newOrder.save();
    }

    res.send({ message: "Payment successful and orders processed" });
  } catch (err) {
    console.error("Error in /sp/store-plan/confirmation route:", err);
    res.status(500).send({ message: "Server error" });
  }
});


module.exports = router;
