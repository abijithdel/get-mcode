var express = require("express");
var router = express.Router();

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

module.exports = router;
