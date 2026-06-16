require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");
const logger = require("./logger");

const { IMGBB_API_KEY, IMGBB_UPLOAD_URL, IMAGES_DIR } = require("./config");

// Create axios instance with timeout
const axiosInstance = axios.create({
  timeout: 60000, // 60 second timeout
});

async function uploadImage(imagePath) {
  try {
    const stats = await fs.stat(imagePath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    if (fileSizeInMB > 32) {
      logger.warn(
        { fileSize: fileSizeInMB },
        `Skipping ${path.basename(imagePath)}: file exceeds 32MB limit`,
      );
      return null;
    }

    const imageData = await fs.readFile(imagePath, { encoding: "base64" });
    logger.info(
      `Uploading ${path.basename(imagePath)} (${fileSizeInMB.toFixed(2)}MB)...`,
    );

    const body = new URLSearchParams();
    body.append('image', imageData);

    const response = await axiosInstance.post(IMGBB_UPLOAD_URL, body, {
      params: {
        key: IMGBB_API_KEY,
      },
    });
    return response.data.data;
  } catch (error) {
    logger.error(
      {
        error,
        statusCode: error.response?.status,
        errorData: error.response?.data,
      },
      `Error uploading image ${imagePath}`,
    );
    return null;
  }
}

async function uploadAllImages() {
  try {
    const files = await fs.readdir(IMAGES_DIR);
    const pngFiles = files.filter((file) => file.endsWith(".png"));
    const uploadResults = [];

    logger.info({ fileCount: pngFiles.length }, "Found PNG files to upload");

    for (const file of pngFiles) {
      const filePath = path.join(IMAGES_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) continue;

        const alreadyUploaded = uploadResults.some(
          (result) => result.file === file,
        );
        if (alreadyUploaded) {
          logger.info(`Skipping ${file} as it has already been uploaded.`);
          continue;
        }

        const result = await uploadImage(filePath);
        if (result) {
          uploadResults.push({
            file: file,
            url: result.url,
            display_url: result.display_url,
            delete_url: result.delete_url,
          });
          logger.info({ url: result.url }, `✓ Uploaded ${file} successfully`);
        }
      } catch (err) {
        logger.warn({ error: err }, `Skipping ${file}: unable to stat file`);
      }
    }

    logger.info({ uploadCount: uploadResults.length }, "All uploads completed");
    if (uploadResults.length > 0) {
      console.log("\n=== Upload Summary ===");
      uploadResults.forEach((r) => {
        console.log(`${r.file}: ${r.url}`);
      });
    }
  } catch (error) {
    logger.error({ error }, "Error uploading images");
  }
}

uploadAllImages();
