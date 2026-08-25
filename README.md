# RapidCare 🚑

RapidCare is a modern healthcare and emergency dispatch platform designed to provide instant access to medical services. From emergency ambulance requests to scheduled doctor consultations and medicine delivery, RapidCare is built for speed, safety, and a premium user experience.

## ✨ Features
*   **Emergency SOS**: One-tap ambulance dispatch with real-time tracking and estimated arrival times.
*   **Medic Home**: Professional nurse dispatch for at-home medical support.
*   **Doctor Consultations**: In-app chat and video calls with physicians, along with clinical appointment booking.
*   **Pharmacy & Medicine Finder**: Search for medicines, upload prescriptions, and get express delivery from verified local pharmacies.
*   **Health Checker**: Intelligent symptom analysis to guide you towards the right medical attention.
*   **Smart Tracking & Alerts**: Persistent, real-time tracking banners across all screens for your active dispatches with a unified Navigation Header system.
*   **Premium Design**: Full support for both **Dark Mode** and **Light Mode** with a sleek, high-performance UI and consistent side gutters.
*   **IoT SOS Integration**: Fully synchronized with ESP32 hardware for physical emergency triggers, featuring non-blocking firmware and custom melodic feedback.

## 🛠️ Technology Stack
*   **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
*   **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
*   **Styling**: Dynamic, theme-aware Vanilla CSS-in-JS
*   **Icons**: [Ionicons](https://ionic.io/ionicons)
*   **Local Storage**: [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
*   **State Management**: React Context API for global dispatch and authentication tracking.
*   **IoT Backend**: Standalone ESP32 WebServer (AP Mode) for direct, serverless hardware-to-app communication. No laptop or cloud tunnel required.

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16+)
*   [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Deeptanil/RapidCare.git
    cd RapidCare
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npx expo start
    ```

### Running the App
*   **Android/iOS**: Scan the QR code using the Expo Go app.
*   **Web**: Press `w` in the terminal to start the web version.

## 📟 IoT Standalone Setup (Primary)

The ESP32 now acts as its own server and Wi-Fi hotspot, allowing the system to work in the field without a laptop or internet.

1. **SSID**: `RapidCare_SOS`
2. **Password**: `rapidcare123`
3. **Local IP**: `192.168.4.1`

### Steps to Use:
1. **Flash Hardware**: Upload the code in `esp32_emergency/` to your ESP32.
2. **Connect Phone**: Join the **"RapidCare_SOS"** Wi-Fi network on your phone.
3. **Run App**: Open the RapidCare app. It will automatically detect the button at the static local IP.
4. **Trigger**: Press the physical button. The app will immediately jump to the SOS dispatch selection (or auto-trigger an ambulance depending on your settings).

### Hardware Feedback Logic:
- **Double-Beep**: Confirms successful button press.
- **Yellow Blink**: Waiting for app acknowledgment (30-second window).
- **Continuous Beep**: Prompting the user to re-press if the app fails to respond after 30s.
- **Green LED**: Emergency confirmed and dispatch is active.

## 📦 Building for Production

To generate a standalone Android APK:

1.  **Configure EAS**: Ensure `eas.json` is set up with the `preview` profile.
2.  **Verify Assets**: Ensure `assets/map.png` is bundled for offline map support.
3.  **Run Build**:
    ```bash
    npx eas build -p android --profile preview
    ```
4.  **Install**: Use the provided QR code or URL to download and install the final `.apk`.

> [!IMPORTANT]
> The standalone build is pre-configured to look for the hardware at `192.168.4.1`. Ensure your phone is connected to the button's hotspot before use.

## 🤝 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*RapidCare - Your Local Emergency Dispatch Partner.*
