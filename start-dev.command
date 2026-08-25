#!/bin/bash

# RapidCare Development Environment Starter
# Change directory to the script's location
cd "$(dirname "$0")"

echo "🚀 Starting RapidCare Development Environment..."

# Start Expo Mobile Dev Server
echo "Starting Expo Go..."
npx expo start

echo "✅ Expo has been successfully launched!"
