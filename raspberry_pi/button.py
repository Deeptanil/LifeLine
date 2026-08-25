#!/usr/bin/env python3
"""
RapidCare IoT Emergency Button
Run on Raspberry Pi: python3 button.py

Wiring:
  Button: one leg → GPIO 18, other leg → GND
  LED:    long leg (+) → 330Ω resistor → GPIO 23, short leg → GND
"""

import requests
import time
import sys

try:
    import RPi.GPIO as GPIO
    SIMULATION = False
except ImportError:
    print("[INFO] RPi.GPIO not found — running in simulation mode (press Enter to trigger)")
    SIMULATION = True

# ── CONFIG ── Change SERVER_URL to your laptop/server IP
SERVER_URL = "https://permutational-signe-unmanipulatory.ngrok-free.dev/iot/trigger"
DEVICE_ID    = "RC-IOT-2024-001"
BUTTON_PIN   = 18
LED_PIN      = 23
DEBOUNCE_MS  = 2000   # prevent rapid-fire triggers

def send_alert():
    payload = {
        "device_id": DEVICE_ID,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    try:
        response = requests.post(SERVER_URL, json=payload, timeout=5)
        if response.status_code == 200:
            print(f"[{time.strftime('%H:%M:%S')}] ✅ Alert sent — server responded OK")
            return True
        else:
            print(f"[{time.strftime('%H:%M:%S')}] ⚠️  Server returned {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"[{time.strftime('%H:%M:%S')}] ❌ Could not reach server at {SERVER_URL}")
        return False
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] ❌ Error: {e}")
        return False

def blink_led(times=3, on_ms=150, off_ms=100):
    if SIMULATION:
        return
    for _ in range(times):
        GPIO.output(LED_PIN, GPIO.HIGH)
        time.sleep(on_ms / 1000)
        GPIO.output(LED_PIN, GPIO.LOW)
        time.sleep(off_ms / 1000)

def main():
    print("=" * 45)
    print("  RapidCare IoT Emergency Button")
    print(f"  Server: {SERVER_URL}")
    print(f"  Device: {DEVICE_ID}")
    print("=" * 45)

    if not SIMULATION:
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(LED_PIN, GPIO.OUT)
        GPIO.output(LED_PIN, GPIO.LOW)
        # Startup blink — confirms GPIO is working
        blink_led(times=2, on_ms=200, off_ms=100)
        print(f"[READY] Listening on GPIO {BUTTON_PIN}. Press the button to trigger.\n")

    try:
        last_trigger = 0

        if SIMULATION:
            print("[SIMULATION] Press Enter to simulate a button press. Ctrl+C to exit.\n")
            while True:
                input()
                now = time.time()
                if now - last_trigger < DEBOUNCE_MS / 1000:
                    print("[DEBOUNCE] Too soon — ignoring")
                    continue
                last_trigger = now
                print(f"[{time.strftime('%H:%M:%S')}] 🔴 Button pressed!")
                success = send_alert()
                if success:
                    print("  → App should show emergency modal now\n")
        else:
            while True:
                if GPIO.input(BUTTON_PIN) == GPIO.LOW:
                    now = time.time()
                    if now - last_trigger > DEBOUNCE_MS / 1000:
                        last_trigger = now
                        print(f"[{time.strftime('%H:%M:%S')}] 🔴 Button pressed!")
                        blink_led(times=1, on_ms=100, off_ms=0)
                        success = send_alert()
                        if success:
                            blink_led(times=3, on_ms=150, off_ms=100)
                        else:
                            blink_led(times=5, on_ms=50, off_ms=50)
                time.sleep(0.05)

    except KeyboardInterrupt:
        print("\n[EXIT] Shutting down...")
    finally:
        if not SIMULATION:
            GPIO.cleanup()

if __name__ == "__main__":
    main()
