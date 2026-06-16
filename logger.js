// Simple logger utility
const logger = {
  info: (msg, data) => {
    if (typeof msg === "object") {
      console.log("[INFO]", JSON.stringify(msg), data);
    } else {
      console.log("[INFO]", msg, data || "");
    }
  },
  warn: (msg, data) => {
    if (typeof msg === "object") {
      console.warn("[WARN]", JSON.stringify(msg), data);
    } else {
      console.warn("[WARN]", msg, data || "");
    }
  },
  error: (msg, data) => {
    if (typeof msg === "object") {
      console.error("[ERROR]", JSON.stringify(msg), data);
    } else {
      console.error("[ERROR]", msg, data || "");
    }
  },
};

module.exports = logger;
