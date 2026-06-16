require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");

const { IMGBB_API_KEY, IMGBB_UPLOAD_URL, IMAGES_DIR } = require("./config");

async function test() {
  try {
    console.log("Testing file reading...");
    const files = await fs.readdir(IMAGES_DIR);
    console.log("Files in images dir:", files);

    const pngFiles = files.filter((file) => file.endsWith(".png"));
    console.log("PNG files:", pngFiles);

    if (pngFiles.length === 0) {
      console.log("No PNG files found!");
      return;
    }

    const firstFile = pngFiles[0];
    const filePath = path.join(IMAGES_DIR, firstFile);
    console.log("Testing upload for:", filePath);

    const imageData = await fs.readFile(filePath, { encoding: "base64" });
    console.log("File read successfully, size:", imageData.length, "bytes");

    console.log("Uploading to ImgBB...");
    const body = new URLSearchParams();
    body.append('image', imageData);

    const response = await axios.post(IMGBB_UPLOAD_URL, body, {
      params: {
        key: IMGBB_API_KEY,
      },
    });

    console.log("Upload successful!");
    console.log("URL:", response.data.data.url);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

test();
