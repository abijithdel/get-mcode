var express = require("express");
var router = express.Router();
var Store = require("../helper/store");
const upload = require("../config/multer");
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

router.post('/sp/:id/new-plan', upload.single('img'), async (req, res) => {
  try {
    const storeId = req.params.id; // Retrieve store ID from route parameter

    // Retrieve form data
    const planName = req.body.name;
    const planImg = req.file ? req.file.filename : ''; // Handle uploaded image file
    const items = [];

    // Process and collect items
    let itemIndex = 1;
    while (req.body[`item${itemIndex}_name`]) {
      items.push({
        name: req.body[`item${itemIndex}_name`],
        quantity: req.body[`item${itemIndex}_quantity`],
      });
      itemIndex++;
    }

    // Find the store by ID and add the new plan
    const store = await Store.findById(storeId);
    store.plans.push({
      name: planName,
      planImg: planImg,
      items: items,
    });

    await store.save(); // Save the updated store
    res.redirect(`/store/sp/${storeId}`); // Redirect to the store page
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error'); // Handle errors
  }
});

router.get('/sp/:id/all-plans',userlogin, async (req,res)=>{
  try{
    const userid = req.session.userSession._id;
    const id = req.params.id
    const store = await Store.findById(id)
    if (userid == store.userID){
      res.render('store/all-plans',{plans:store.plans, store, user: req.session.userSession})
    }else{
      res.redirect('/')
    }
  }catch(err){
    console.log(err)
    res.send('Server error')
  }
})

module.exports = router;
