# 🚀 ESP32 Emergency Button: Beginner's Guide

This guide will help you set up your ESP32 to work as a standalone emergency button for the RapidCare platform.

## 1. 🛠 Hardware Setup (Wiring)

Follow this simple wiring guide. You will need:
- **ESP32 DevKit V1** (30-pin version)
- **1x Push Button**
- **1x Yellow LED** (Waiting/Activity)
- **1x Green LED** (Confirmed)
- **1x Active Buzzer**
- **1x SG90 Servo** (Optional, for Power Bank Keep-Alive)
- **1x Resistor** (330Ω or 220Ω) per LED
- **Breadboard and Jumper Wires**

### 📋 Connection Table (Checklist)

| From (ESP32 Pin) | To (Component) | Notes |
| :--- | :--- | :--- |
| **GPIO 18** | Push Button (one side) | SOS Trigger |
| **GND** | Push Button (other side) | Common Ground |
| **GPIO 23** | 220Ω Resistor ➔ Yellow LED | Waiting/Alerting |
| **GPIO 22** | 220Ω Resistor ➔ Green LED | Dispatch Confirmed |
| **GPIO 12** | Buzzer (Positive +) | Beeps & Alarms |
| **GPIO 13** | Servo Signal (Orange) | Power Bank Pulse |
| **3V3 / 5V** | Servo Power (Red) | Power Supply |
| **GND** | Common Ground Rail | Ground Connector |

---

## 2. ⚡ Standalone Firmware Features

The current firmware (`esp32_emergency.ino`) is designed for **maximum reliability**:
- **Access Point Mode**: The device creates its own Wi-Fi (**RapidCare_SOS**). No home Wi-Fi or router needed.
- **Double-Beep Start**: Immediate audible confirmation when you press the button.
- **30s Acknowledgment Window**: The system waits 30 seconds for the app to acknowledge before timing out.
- **Continuous Prompt Alarm**: If it fails to reach the app, it beeps continuously to alert you.
- **Power Bank Keep-Alive**: Includes a non-blocking servo sweep (GPIO 13) to prevent common power banks from shutting down due to low current draw.

---

## 3. 📝 Uploading the Code

1.  **Open Arduino IDE**.
2.  Install the **ESP32 Board Support** via Boards Manager.
3.  Select Board: **DOIT ESP32 DEVKIT V1**.
4.  Open the file: `esp32_emergency/esp32_emergency.ino`.
5.  **Important**: No Wi-Fi editing is required! The device generates its own credentials.
6.  **Upload**: Click the **Upload** button.

---

## 4. 🔍 Testing & Feedback Logic

1.  **Power On**: You will see a green light blink twice during startup.
2.  **Connect**: On your phone, connect to the Wi-Fi network `RapidCare_SOS` (Password: `rapidcare123`).
3.  **Press Button**: 
    - You will hear a **double-beep**.
    - The **Yellow LED** will begin blinking steadily.
4.  **Confirm (Success)**: 
    - Once you select a service in the App, the **Green LED** will light up.
    - The buzzer will play a success melody.
5.  **Fail (Timeout)**: 
    - If no response comes in 30 seconds, the device plays **3 long buzzes**.
    - It then starts **beeping continuously** while flashing yellow.
    - **Press the button once** to silence the alarm and reset to Idle.

---

## 🛠 Standalone APK Usage

For the best experience, build a **Standalone APK** of the RapidCare app. This bundles the map assets directly inside the app, so you see the tracker even without internet access while connected to the hardware hotspot.
