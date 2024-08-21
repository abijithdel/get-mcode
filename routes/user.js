const express = require("express");
const router = express.Router();


// Discord authentication route
router.get("/", (req, res) => {
  res.render("index");
});

router.get("/login", (req, res) => {
  res.render("main/login");
});

router.get("/signup", (req, res) => {
  res.render("main/signup");
});


module.exports = router;
