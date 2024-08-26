const path = require('path');
const multer = require('multer');

// Configure multer for different storage destinations
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save to 'public/plan-img' if the fieldname is 'img'
    if (file.fieldname === 'img') {
      cb(null, path.join(__dirname, '../public/plan-img'));
    } 
    // Save to 'public/sp-store-bg-img' for background images
    else if (file.fieldname === 'bgimg') {
      cb(null, path.join(__dirname, '../public/sp-store-bg-img'));
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
