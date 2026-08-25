// RapidCare IoT Backend Server
// Run: node server.js
// Raspberry Pi sends POST to /iot/trigger
// App polls GET /emergency every 2.5 seconds

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

let lastEmergency = null;
let lastTriggerTimestamp = 0; 
let isAcknowledged = false; 
let lastSeenDevices = {}; // { device_id: timestamp }

// ── ESP32 Heartbeat ──
app.post("/iot/heartbeat", (req, res) => {
  const { device_id } = req.body;
  if (device_id) {
    lastSeenDevices[device_id] = Date.now();
    // Only log every few minutes to avoid spamming, or just once per device start
    console.log(`[${new Date().toLocaleTimeString()}] 💓 Heartbeat from ${device_id}`);
  }
  res.status(200).json({ status: "ok", acknowledged: isAcknowledged });
});

// ── Raspberry Pi hits this endpoint when button is pressed ──
app.post("/iot/trigger", (req, res) => {
  const now = Date.now();
  
  // Dedup logic: Ignore if triggered recently (within 60s) AND not acknowledged yet
  if (lastEmergency && (now - lastTriggerTimestamp < 60000) && !isAcknowledged) {
    console.log(`[${new Date().toLocaleTimeString()}] 🛡️ Trigger ignored (deduplicated)`);
    return res.status(200).json({ status: "ignored", reason: "duplicate", event: lastEmergency, acknowledged: isAcknowledged });
  }

  const device_id = req.body.device_id || "unknown";
  const event = {
    id: String(now), // unique ID so app detects new events
    device_id,
    timestamp: new Date().toISOString(),
    location: req.body.location || null,
  };

  lastEmergency = event;
  lastTriggerTimestamp = now;
  isAcknowledged = false; // Reset ack for new event
  lastSeenDevices[device_id] = now;
  
  console.log(
    `[${event.timestamp}] 🚨 Emergency triggered by device: ${event.device_id}`,
  );
  res.status(200).json({ status: "ok", event, acknowledged: isAcknowledged });
});

// ── App calls this when ambulance is dispatched ──
app.post("/iot/acknowledge", (req, res) => {
  isAcknowledged = true;
  console.log(`[${new Date().toLocaleTimeString()}] ✅ Emergency Acknowledged by App`);
  res.status(200).json({ status: "ok" });
});

// ── App polls this to check for new events ──
app.get("/emergency", (req, res) => {
  res.set("Cache-Control", "no-store");

  // Check which devices are online (seen in last 25 seconds)
  const now = Date.now();
  const devices = Object.keys(lastSeenDevices).map(id => ({
    id,
    online: (now - lastSeenDevices[id]) < 25000
  }));

  // Helper flag for the app: Is ANY device currently online?
  const isDeviceOnline = devices.some(d => d.online);

  res.json({ 
    event: lastEmergency,
    devices,
    isDeviceOnline
  });
});

// ── Health check ──
app.get("/ping", (req, res) => {
  res.json({ status: "online", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 RapidCare IoT Server running on port ${PORT}`);
  console.log(
    `   App polls:  GET  https://permutational-signe-unmanipulatory.ngrok-free.dev/emergency`,
  );
  console.log(
    `   Pi sends:   POST https://permutational-signe-unmanipulatory.ngrok-free.dev/iot/trigger\n`,
  );
});
