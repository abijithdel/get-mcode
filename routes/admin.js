var express = require("express");
var router = express.Router();
var Price = require('../helper/price')
var Store = require('../helper/store')
var User = require('../helper/userDB')
const userlogin = (req, res, nest) => {
  if (req.session.login) {
    nest();
  } else {
    res.redirect("/login");
  }
};
function checkRole(role, nest, back) {
  if (role === "admin") {
    var admin = true
    nest(admin);
  } else {
    back();
  }
}

/* GET users listing. */
router.get("/", userlogin, function (req, res, next) {
  checkRole(
    req.session.userSession.role,
    (admin) => {
      res.render('admin/admin',{admin})
    },
    () => {
      res.redirect("/");
    }
  );
});

router.get("/update-price", userlogin, function (req, res, next) {
  checkRole(
    req.session.userSession.role,
    (admin) => {
      res.render('admin/updatePrice',{admin})
    },
    () => {
      res.redirect("/");
    }
  );
});

router.post('/update-price', async (req, res) => {
  try {
    var { price, btnName } = req.body;  // Use btnName to match the schema

    const count = await Price.countDocuments({});
    if (count <= 0) {
      var newPrice = new Price({ price, btnName });  // Use btnName here
      await newPrice.save();
      res.redirect('/admin')
    } else {
      var existingPrice = await Price.findOne();
      await Price.findByIdAndUpdate(existingPrice._id, { price, btnName }, { new: true });  // Update using btnName
      res.redirect('/admin')
    }
    
  } catch (err) {
    console.log(err);
    res.send('Server error');
  }
});

router.get("/all-order", userlogin, async function (req, res, next) {
  checkRole(
    req.session.userSession.role,
    async (admin) => {  
      try {
        let userEmails = [];
        const orders = await Store.find();  // Get all orders

        // Use for...of to iterate through the orders array
        for (let order of orders) {
          const user = await User.findById(order.userID);  // Find user by userID
          if (user) {  
            userEmails.push(user.email);  
          }
        }
        res.render('admin/order-log', { admin, orders, userEmails });  // Pass the data to the view
      } catch (error) {
        next(error);  // Pass any errors to the error handler
      }
    },
    () => {
      res.redirect("/");
    }
  );
});



module.exports = router;
