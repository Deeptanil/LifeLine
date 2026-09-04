// Lifeline Backend Server
// Run: node server.js

const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

// Allow requests from Expo Go on local network
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Cache-Control",
  );
  next();
});

// ── Health check ──
app.get("/ping", (req, res) => {
  res.json({ status: "online", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Lifeline Server running on port ${PORT}`);
});
