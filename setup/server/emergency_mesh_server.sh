#!/bin/bash

echo -e "\n[+] Checking required utilities (Pre-flight check)..."
# List of dependencies needed for the server
DEPS=("iw" "batctl" "docker") 

for cmd in "${DEPS[@]}"; do
    if ! command -v $cmd &> /dev/null; then
        echo "[!] Utility '$cmd' not found!"
        if ping -q -c 1 -W 1 8.8.8.8 >/dev/null; then
            echo "[+] Internet is available. Automatically installing $cmd..."
            PKG_NAME=$cmd
            if [ "$cmd" == "docker" ]; then PKG_NAME="docker.io"; fi
            
            sudo apt-get update -qq
            sudo apt-get install -y $PKG_NAME -qq
        else
            echo "❌ CRITICAL ERROR: No internet connection to install '$cmd'."
            echo "Please connect the device to the internet before the first deployment in the field."
            exit 1
        fi
    fi
done
echo "[+] All dependencies are present. Continuing..."

WIFI_IF="wlp2s0"
MESH_SSID="diploma_mesh"

echo "=== Emergency Mesh Initialization (SERVER NODE / OBFUSCATED L2) ==="

# 1. Prompt for the secret key (password)
read -s -p "🔑 Enter secret key for Mesh: " MESH_PASS
echo -e "\n[+] Processing key and generating parameters..."

# 2. Generate MD5 hash from the password
HASH=$(echo -n "$MESH_PASS" | md5sum | awk '{print $1}')

# 3. Determine frequency based on the password (channels 1-13)
DEC_VAL=$((16#${HASH:0:2}))
CHANNEL=$(( (DEC_VAL % 13) + 1 ))
MESH_FREQ=$(( 2407 + (CHANNEL * 5) ))

# 4. Determine a unique BSSID
BSSID="02:${HASH:2:2}:${HASH:4:2}:${HASH:6:2}:${HASH:8:2}:${HASH:10:2}"

echo "[+] Calculated channel: $CHANNEL ($MESH_FREQ MHz)"
echo "[+] Calculated cell BSSID: $BSSID"
echo "[+] Configuring radio..."

# 5. Standard cleanup
sudo systemctl stop NetworkManager
sudo killall wpa_supplicant 2>/dev/null
sleep 1

# 6. Bring up reliable Ad-Hoc
sudo ip link set dev $WIFI_IF down
sudo iw dev $WIFI_IF set type ibss
sudo ip link set dev $WIFI_IF up
sudo iw dev $WIFI_IF ibss join "$MESH_SSID" $MESH_FREQ $BSSID
sleep 2

# 7. Activating B.A.T.M.A.N.
echo "[+] Activating B.A.T.M.A.N..."
sudo modprobe batman-adv
sudo batctl if add $WIFI_IF
sudo ip link set up dev bat0

# 8. IP Generation
MAC_HEX=$(cat /sys/class/net/$WIFI_IF/address | awk -F: '{print $6}')
IP_LAST_OCTET=$((16#$MAC_HEX))
if [ "$IP_LAST_OCTET" -eq 0 ] || [ "$IP_LAST_OCTET" -eq 255 ]; then
    IP_LAST_OCTET=$((RANDOM % 253 + 1))
fi

MY_IP="10.0.0.$IP_LAST_OCTET"
sudo ip addr flush dev bat0
sudo ip addr add $MY_IP/24 dev bat0

echo -e "\n✅ TRANSPORT NETWORK READY"
echo "🌐 SSID: $MESH_SSID"
echo "🆔 Your Mesh IP: $MY_IP"
echo "-------------------------------------------"

# 9. AUTOMATIC SERVER START
echo -e "\n[+] Initializing Docker container (Mesh Portal)..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
TAR_FILE="$SCRIPT_DIR/mesh-server.tar"

echo "[+] Initializing Docker container (Mesh Portal)..."

if [ -f "$TAR_FILE" ]; then
    echo "[*] Loading image from $TAR_FILE..."
    docker load -i "$TAR_FILE"
else
    echo "[!] ERROR: Archive $TAR_FILE not found!"
    exit 1
fi

sudo docker rm -f mesh-node 2>/dev/null
sudo docker run -d \
    --name mesh-node \
    --restart unless-stopped \
    -p 3000:3000 \
    -e JWT_SECRET="$MESH_PASS" \
    mesh-terminal > /dev/null

echo -e "\n🚀 MESH PORTAL SUCCESSFULLY STARTED!"
echo "📢 Tell other network participants to open in their browser:"
echo "👉 http://$MY_IP:3000"
echo "==========================================="