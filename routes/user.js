const express = require("express");
const router = express.Router();
const User = require('../helper/userDB')
var bcrypt = require('bcrypt');

const userlogin=(req,res,nest)=>{
  if(req.session.login){
    nest()
  }else{
    res.redirect('/login')
  }
}

router.get("/", (req, res) => {
  res.render("index",{user:req.session.userSession});
});

router.get("/login", (req, res) => {
  if (req.session.login) {
    res.redirect('/')
  } else {
    res.render("main/login");
  }
});

router.get("/signup" ,async (req, res) => {
  if (req.session.login) {
    res.redirect('/')
  } else {
    res.render("main/signup");
  }
  
});

router.post('/signup', async (req, res) => {
  try {
    const { fname, lname, email, pass, cpass } = req.body;

    // Check if email already exists
    const emailValid = await User.findOne({ email });
    if (emailValid) {
      return res.render('main/signup', { emailError: "email already exists" });
    }

    if (pass !== cpass) {
      return res.status(400).render('main/signup', { passError: 'Passwords do not match.' });
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
    res.status(201).redirect('/');
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/login', async (req, res) => {
  const { email, pass } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).render('main/login', { error: 'User not found. Please sign up.' });
    }

    const passMatch = await bcrypt.compare(pass, user.pass);
    if (passMatch) {
      req.session.login = true;
      req.session.userSession = user;
      res.redirect('/');
    } else {
      res.status(401).render('main/login', { error: 'Incorrect password.' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/');
  });
});

module.exports = router;
