const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "shelving_pics/"); // Specify the destination folder
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.storeId}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

module.exports = upload;
