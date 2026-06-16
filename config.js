const path = require("path");

module.exports = {
  IMGBB_API_KEY: process.env.IMGBB_API_KEY,
  IMGBB_UPLOAD_URL: "https://api.imgbb.com/1/upload",
  IMAGES_DIR: path.join(__dirname, "images"),
};
