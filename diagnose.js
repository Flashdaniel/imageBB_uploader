require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");

const { IMGBB_API_KEY, IMGBB_UPLOAD_URL, IMAGES_DIR } = require("./config");

async function diagnose() {
  console.log("=== Diagnostic Report ===\n");

  // 1. Check API key
  console.log("1. API Configuration:");
  console.log("   - API Key:", IMGBB_API_KEY ? "✓ Set" : "✗ Missing");
  console.log("   - Upload URL:", IMGBB_UPLOAD_URL);
  console.log("   - Images Dir:", IMAGES_DIR);

  // 2. Check files
  console.log("\n2. Files in images directory:");
  try {
    const files = await fs.readdir(IMAGES_DIR);
    console.log("   - Total files:", files.length);

    const pngFiles = files.filter((f) => f.endsWith(".png"));
    console.log("   - PNG files:", pngFiles.length);

    for (const file of pngFiles) {
      const filePath = path.join(IMAGES_DIR, file);
      const stats = await fs.stat(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`     • ${file} (${sizeMB}MB)`);
    }
  } catch (err) {
    console.error("   Error reading directory:", err.message);
  }

  // 3. Test API connection with small image
  console.log("\n3. Testing API connection:");
  try {
    // Small 1x1 transparent PNG
    const tinyPng =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    console.log("   Sending test request...");
    const response = await axios.post(IMGBB_UPLOAD_URL, null, {
      timeout: 10000,
      params: {
        key: IMGBB_API_KEY,
        image: tinyPng,
      },
    });
    console.log("   ✓ API connection successful!");
    console.log(
      "   - Response: ",
      response.data.success ? "Success" : "Failed",
    );
  } catch (error) {
    console.error("   ✗ API connection failed!");
    console.error("   - Error:", error.message);
    if (error.response) {
      console.error("   - Status:", error.response.status);
      console.error("   - Data:", JSON.stringify(error.response.data));
    }
  }

  console.log("\n=== End Diagnostic ===");
}

diagnose();
