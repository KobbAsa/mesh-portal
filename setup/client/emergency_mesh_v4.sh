#!/bin/bash
WIFI_IF="wlp2s0"
MESH_SSID="diploma_mesh"

echo "=== Emergency Mesh Initialization (Obfuscated L2) ==="

# 1. Prompt for the secret key (password)
read -s -p "🔑 Enter secret key for Mesh: " MESH_PASS
echo -e "\n[+] Processing key..."

# 2. Generate MD5 hash from the password
HASH=$(echo -n "$MESH_PASS" | md5sum | awk '{print $1}')

# 3. Determine frequency based on the password (channels 1-13 -> 2412-2472 MHz)
DEC_VAL=$((16#${HASH:0:2}))
CHANNEL=$(( (DEC_VAL % 13) + 1 ))
MESH_FREQ=$(( 2407 + (CHANNEL * 5) ))

# 4. Determine a unique BSSID (network MAC address)
BSSID="02:${HASH:2:2}:${HASH:4:2}:${HASH:6:2}:${HASH:8:2}:${HASH:10:2}"

echo "[+] Calculated channel: $CHANNEL ($MESH_FREQ MHz)"
echo "[+] Calculated cell BSSID: $BSSID"
echo "[+] Configuring radio..."

# 5. Standard cleanup
sudo systemctl stop NetworkManager
sudo killall wpa_supplicant 2>/dev/null
sleep 1

# 6. Bring up reliable Ad-Hoc with our secret parameters
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
