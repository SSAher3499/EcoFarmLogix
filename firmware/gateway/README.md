# EcoFarmLogix Gateway Firmware

This is the Python application that runs on Raspberry Pi at each farm.

## Features

- 📊 Read sensors (Temperature, Humidity, Soil Moisture, etc.)
- 📤 Send sensor data to cloud via MQTT
- 📥 Receive commands from cloud
- ⚡ Control actuators (Fans, Pumps, Valves, etc.)
- 💾 Offline data buffering (coming soon)
- 🖥️ Local display support (coming soon)

## Hardware Requirements

- Raspberry Pi 4 (4GB recommended)
- DHT22 sensor (Temperature & Humidity)
- Capacitive soil moisture sensor
- 8-channel relay module
- SIM7600 4G module (for internet)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/EcoFarmLogix.git
cd EcoFarmLogix/firmware/gateway
```

### 2. Create virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure
Edit `config/config.json` with your settings:
- MQTT broker address
- Sensor pins
- Actuator pins

### 5. Run
```bash
python start.py
```

## Auto-start on Boot

Create systemd service:
```bash
sudo nano /etc/systemd/system/ecofarm-gateway.service
```

Add:
```ini
[Unit]
Description=EcoFarmLogix Gateway
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/EcoFarmLogix/firmware/gateway
ExecStart=/home/pi/EcoFarmLogix/firmware/gateway/venv/bin/python start.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ecofarm-gateway
sudo systemctl start ecofarm-gateway
```

## Testing on Windows

The gateway can run in simulation mode on Windows for testing:
```bash
cd firmware/gateway
pip install -r requirements.txt
python start.py
```

Simulated sensor values will be generated.

## Configuration

See `config/config.json` for all options.

## Logs

Logs are stored in `logs/gateway.log`