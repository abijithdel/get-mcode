var express = require("express");
var router = express.Router();
var Store = require("../helper/store");
const upload = require('../config/multer');

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

router.post('/sp/:id/edit', upload.single('bgimg'), async (req, res) => {
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

    console.log(updateData);
    
    // Update the store document
    const updatedStore = await Store.findByIdAndUpdate(storeId, updateData, { new: true });

    // Check if the store exists
    if (!updatedStore) {
      return res.status(404).send('Store not found.');
    }

    // Redirect to the updated store page or another desired page
    res.redirect(`/store/sp/${storeId}`);
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).send('An error occurred while updating the store.');
  }
});


module.exports = router;
