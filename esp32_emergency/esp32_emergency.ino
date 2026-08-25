/**
 * RapidCare ESP32 Emergency Button
 *
 * Hardware Setup:
 * - ESP32 DevKit V1 (30-pin)
 * - Button: GPIO 18 <-> GND
 * - LED:    GPIO 23 <-> 330 ohm resistor <-> GND
 *
 * Dependencies:
 * - Arduino IDE
 * - ESP32 Board Support
 */

#include <ESP32Servo.h>
#include <WebServer.h>
#include <WiFi.h>
#include <esp_system.h>

// ── CONFIG ──
const char *apSSID = "RapidCare_SOS";
const char *apPass = "rapidcare123";
const String deviceId = "RC-IOT-2024-001";

WebServer server(80);

// Pins
const int buttonPin = 18;
const int yellowLedPin = 23; // <--- Connect Yellow LED here
const int greenLedPin = 22;  // <--- Connect Green LED here
const int buzzerPin = 12;    // <--- Connect Buzzer (+) here
const int servoPin = 13;     // <--- Connect Servo Control here

// State Management (Internal)
unsigned long lastTriggerTimestamp = 0;
bool isAcknowledged = false;
String lastEventId = "";
String lastEventTimeStr = "";

enum State { ST_IDLE, ST_WAITING, ST_SUCCESS, ST_FAILURE };
State currentState = ST_IDLE;

unsigned long stateStartTime = 0;
unsigned long lastBlinkTime = 0;
bool ledState = false;

const unsigned long WAITING_TIMEOUT = 30000; // 30 seconds
const unsigned long ERROR_DURATION = 30000;  // 30 seconds

unsigned long buttonDownTime = 0; // Tracks how long button is held
bool buttonWasPressed = false;    // Tracks previous state for long press
bool pendingAcknowledgment =
    false; // Tracks if we are still waiting for app-side success

// Power Bank Keep-Alive
Servo keepAliveServo;
unsigned long lastServoMove = 0;
const int servoInterval = 2500; // Move every 2.5 seconds
int servoPos = 90;
bool isServoSweeping = false;
int sweepSubState = 0; // 0: 90->30, 1: 30->150, 2: 150->90
unsigned long lastServoStepMs = 0;
const int SERVO_STEP_DELAY = 15; // Slowed down from 5ms to reduce current draw
unsigned long lastStatusBlinkMs = 0; // Timer for periodic status blinks
bool lastStationConnected = false;   // Tracks previous connection state

void setup() {
  Serial.begin(115200);
  delay(1000); // Startup settle time

  Serial.println("\n--- RapidCare IOT Boot ---");
  esp_reset_reason_t reason = esp_reset_reason();
  Serial.print("Reset Reason: ");
  switch (reason) {
  case ESP_RST_POWERON:
    Serial.println("Normal Power-On");
    break;
  case ESP_RST_SW:
    Serial.println("Software Reset");
    break;
  case ESP_RST_PANIC:
    Serial.println("System Panic");
    break;
  case ESP_RST_INT_WDT:
    Serial.println("Interrupt Watchdog");
    break;
  case ESP_RST_TASK_WDT:
    Serial.println("Task Watchdog");
    break;
  case ESP_RST_WDT:
    Serial.println("Other Watchdog");
    break;
  case ESP_RST_BROWNOUT:
    Serial.println("⚠️ BROWNOUT (Power Instability)");
    break;
  case ESP_RST_DEEPSLEEP:
    Serial.println("Deep Sleep Wake");
    break;
  default:
    Serial.println("Unknown");
    break;
  }

  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(yellowLedPin, OUTPUT);
  pinMode(greenLedPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);

  // Initialize Servo
  keepAliveServo.attach(servoPin);
  keepAliveServo.write(servoPos);

  digitalWrite(yellowLedPin, LOW);
  digitalWrite(greenLedPin, LOW);
  digitalWrite(buzzerPin, LOW);

  // Setup Access Point (Hotspot)
  Serial.print("Starting Hotspot: ");
  Serial.println(apSSID);

  // Explicitly set IP to ensure reliability
  IPAddress local_IP(192, 168, 4, 1);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  WiFi.softAPConfig(local_IP, gateway, subnet);
  WiFi.softAP(apSSID, apPass);

  IPAddress myIP = WiFi.softAPIP();
  Serial.print("AP IP Address: ");
  Serial.println(myIP);

  // Add CORS headers to all responses
  server.enableCORS(); // modern ESP32 WebServer feature

  // Setup WebServer Routes
  server.on("/emergency", handleGetEmergency);
  server.on("/iot/acknowledge", HTTP_POST, handleAcknowledge);
  server.on("/iot/heartbeat", HTTP_POST, handleHeartbeat);
  server.on("/ping", []() {
    server.send(200, "application/json", "{\"status\":\"online\"}");
  });

  server.begin();
  Serial.println("🚀 Web Server Started!");

  // Startup blink - confirms working
  blinkLed(greenLedPin, 1, 1000, 0); // Solid green for 1s on start
}

void loop() {
  unsigned long now = millis();
  bool buttonDown = (digitalRead(buttonPin) == LOW);
  bool buttonWasDown = buttonWasPressed; // Prev state
  bool buttonJustPressed = (buttonDown && !buttonWasDown);

  // ── LONG PRESS RESET (3s) ──
  if (buttonDown) {
    if (buttonJustPressed) {
      buttonDownTime = now;
    } else if (now - buttonDownTime > 3000) {
      if (currentState != ST_IDLE) {
        Serial.println("♻️ Manual Reset (Long Press)");
        buzz(1, 400); // Reset tone
        pendingAcknowledgment = false;
        transitionTo(ST_IDLE);
        buttonWasPressed =
            true; // Mark as pressed to prevent re-triggering on release
        return;
      }
    }
  }

  // ── STATE MACHINE ──
  switch (currentState) {
  case ST_IDLE:
    digitalWrite(yellowLedPin, LOW);
    digitalWrite(greenLedPin, LOW);
    if (buttonJustPressed) {
      if (now - lastTriggerTimestamp > 2000) { // debounce
        lastTriggerTimestamp = now;
        lastEventId = String(now);
        lastEventTimeStr = String(now); // Simplified for local
        isAcknowledged = false;
        pendingAcknowledgment = true;

        Serial.println("🚨 SOS Triggered!");
        buzz(2, 80); // Clear double-beep for confirmation
        transitionTo(ST_WAITING);
      }
    }
    break;

  case ST_WAITING:
    digitalWrite(yellowLedPin, HIGH);
    if (now - stateStartTime > WAITING_TIMEOUT) {
      Serial.println("⏰ Timeout: No response from App.");
      transitionTo(ST_FAILURE);
    }
    // Success check is handled in WebServer handler
    break;
    // ... rest of cases (failure etc) stay standard

  case ST_FAILURE:
    // Error Ack: Any button press during error state stops it
    if (buttonJustPressed) {
      Serial.println("🆗 Error Acknowledged by User.");
      blinkLed(greenLedPin, 1, 400, 0); // Single Green flash
      transitionTo(ST_IDLE);
      buttonWasPressed = true;
      return;
    }
    if (now - lastBlinkTime > 150) {
      lastBlinkTime = now;
      ledState = !ledState;
      digitalWrite(yellowLedPin, ledState ? HIGH : LOW);
      digitalWrite(buzzerPin,
                   ledState ? HIGH : LOW); // Active beeping during failure
    }
    if (now - stateStartTime > ERROR_DURATION) {
      transitionTo(ST_IDLE);
    }
    break;
  }

  // Handle client requests
  server.handleClient();

  // ── POWER BANK KEEP-ALIVE (Non-Blocking) ──
  updateServoNonBlocking(now);

  // ── CONNECTIVITY LED SIGNALING ──
  handleConnectivityLeds();

  buttonWasPressed = buttonDown;
}

void handleConnectivityLeds() {
  // Only show connectivity status when the system is not in an active emergency
  // sequence
  if (currentState != ST_IDLE)
    return;

  static unsigned long lastStationCheck = 0;
  static bool stableConnection = false;
  unsigned long now = millis();

  // Hysteresis: Check connection stability every 500ms
  if (now - lastStationCheck > 500) {
    int stationCount = WiFi.softAPgetStationNum();
    bool currentConnected = (stationCount > 0);
    lastStationCheck = now;

    if (currentConnected != stableConnection) {
      stableConnection = currentConnected;
      if (stableConnection) {
        Serial.println("📱 Device connected to Hotspot");
        blinkLed(greenLedPin, 2, 80, 100);
      } else {
        Serial.println("📴 Device disconnected from Hotspot");
        blinkLed(yellowLedPin, 2, 80, 100);
      }
      lastStatusBlinkMs = now;
      return;
    }
  }

  // ── PERIODIC HEARTBEAT ──
  // 15s if disconnected, 45s if connected (reduce power draw/LED noise)
  unsigned long interval = stableConnection ? 45000 : 15000;
  if (now - lastStatusBlinkMs > interval) {
    lastStatusBlinkMs = now;
    if (stableConnection) {
      digitalWrite(greenLedPin, HIGH);
      delay(150); // Increased for visibility
      digitalWrite(greenLedPin, LOW);
    } else {
      // Clear yellow pulse
      digitalWrite(yellowLedPin, HIGH);
      delay(150);
      digitalWrite(yellowLedPin, LOW);
    }
  }
}

void updateServoNonBlocking(unsigned long now) {
  if (!isServoSweeping) {
    if (now - lastServoMove > servoInterval) {
      isServoSweeping = true;
      lastServoMove = now;
      sweepSubState = 0;
      lastServoStepMs = now;
    }
    return;
  }

  if (now - lastServoStepMs >= SERVO_STEP_DELAY) {
    lastServoStepMs = now;

    // Healthy pattern: 90 -> 85 -> 100 -> 90
    // Moderate range provides visible feedback without overloading the power
    // supply
    if (sweepSubState == 0) { // 90 -> 85
      servoPos--;
      if (servoPos <= 85)
        sweepSubState = 1;
    } else if (sweepSubState == 1) { // 85 -> 100
      servoPos++;
      if (servoPos >= 100)
        sweepSubState = 2;
    } else if (sweepSubState == 2) { // 100 -> 90
      servoPos--;
      if (servoPos <= 90) {
        servoPos = 90;
        isServoSweeping = false;
      }
    }
    keepAliveServo.write(servoPos);
  }
}

void transitionTo(State newState) {
  currentState = newState;
  stateStartTime = millis();
  lastBlinkTime = millis();
  ledState = false;

  if (newState == ST_IDLE) {
    digitalWrite(yellowLedPin, LOW);
    digitalWrite(greenLedPin, LOW);
    digitalWrite(buzzerPin, LOW);
    Serial.println("🏠 System Idle.");
  } else if (newState == ST_SUCCESS) {
    digitalWrite(yellowLedPin, LOW);
    digitalWrite(greenLedPin, HIGH);
    // Custom Success Chime: Melodic sequence
    int melody[] = {440, 523, 659, 880};
    for (int freq : melody) {
      tone(buzzerPin, freq, 150);
      delay(200);
    }
    noTone(buzzerPin);
    delay(1000);
    transitionTo(ST_IDLE);
  } else if (newState == ST_FAILURE) {
    digitalWrite(yellowLedPin, HIGH);
    digitalWrite(greenLedPin, LOW);
    Serial.println("❌ Critical Failure: 3-tone Error Buzz.");
    buzz(3, 500); // 3 long distinct error buzzes
  }
}

// ── WEB SERVER HANDLERS ──

void handleGetEmergency() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{";
  json += "\"isDeviceOnline\":true,";
  json += "\"event\":{";
  if (lastEventId != "") {
    json += "\"id\":\"" + lastEventId + "\",";
    json += "\"device_id\":\"" + deviceId + "\",";
    json += "\"timestamp\":\"" + lastEventTimeStr + "\",";
    json += "\"acknowledged\":" + String(isAcknowledged ? "true" : "false");
  } else {
    json += "\"id\":null";
  }
  json += "}}";
  server.send(200, "application/json", json);
}

void handleAcknowledge() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  Serial.println("🎉 Acknowledgment received from App!");
  isAcknowledged = true;
  if (currentState == ST_WAITING) {
    transitionTo(ST_SUCCESS);
  }
  server.send(200, "application/json", "{\"success\":true}");
}

void handleHeartbeat() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"status\":\"ok\"}");
}

void blinkLed(int pin, int times, int onMs, int offMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(onMs);
    digitalWrite(pin, LOW);
    if (offMs > 0)
      delay(offMs);
  }
}

void buzz(int times, int durationMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(buzzerPin, HIGH);
    delay(durationMs);
    digitalWrite(buzzerPin, LOW);
    if (i < times - 1)
      delay(durationMs);
  }
}

void handleTriggerFailure(int code) {
  Serial.print("❌ Trigger Failure: ");
  Serial.println(code);
  transitionTo(ST_FAILURE);
}
