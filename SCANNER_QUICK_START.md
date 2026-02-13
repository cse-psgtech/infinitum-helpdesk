# QR Scanner - Quick Start Guide

## ✅ Setup Complete!

The QR scanner functionality has been successfully integrated into your Infinitum Helpdesk portal.

## 🚀 How to Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The server will start on `http://localhost:4000` with Socket.IO enabled.

2. **Access the Provide Kit page:**
   - Navigate to: `http://localhost:4000/provide-kit`
   - Login if required

## 📱 Using the QR Scanner

### Step 1: Enable Scanner Mode (Laptop)
1. On the provide-kit page, click the **"Enable Scanner"** button (green button in top right)
2. A QR code will appear on the screen
3. Status will show "⏳ Waiting for mobile..."

### Step 2: Connect Mobile Scanner
1. Open your mobile device camera
2. Scan the QR code displayed on the laptop
3. This opens the scanner page on your mobile browser
4. Allow camera permissions when prompted
5. Laptop will show "✓ Mobile Connected"

### Step 3: Scan Participant IDs
1. Point mobile camera at participant's QR code
2. The scanned ID (e.g., INF1234) automatically appears on laptop
3. User details are fetched and displayed
4. Distribute the kit
5. Click **"Clear & Ready for Next Scan"** button

### Step 4: Next Participant
- After clearing, mobile camera automatically resumes
- Scan next participant's QR code
- Repeat process

## 🎯 Key Features

✅ **Real-time sync** between laptop and mobile via Socket.IO  
✅ **Auto-populate** 4-digit ID when scanned  
✅ **Connection indicator** shows scanner status  
✅ **One-click clear** resets for next participant  
✅ **Fallback to manual entry** - can still type IDs manually  
✅ **Session persistence** - survives page refreshes  

## 🔧 Testing Without Mobile

You can test the socket connection by:

1. Enable scanner mode on laptop
2. Copy the scanner URL from QR code
3. Open the URL in a new browser tab (simulates mobile)
4. Use the scanner interface to test

## 📊 Network Requirements

- **Local Development**: Laptop and mobile must be on same WiFi network
- **Access via IP**: Mobile accesses laptop using local IP (e.g., `192.168.1.100:4000`)
- **Ports**: Default port 4000 (configurable via `PORT` environment variable)

## 🔗 API Endpoints

- **Socket.IO**: `ws://localhost:4000/socket.io` (WebSocket)
- **Create Session**: `POST /api/desk/session` (Creates QR code session)
- **Socket Info**: `GET /api/socket` (Returns socket info)

## 📝 QR Code Format Support

The scanner accepts participant QR codes in these formats:

**JSON Format:**
```json
{
  "type": "PARTICIPANT",
  "uniqueId": "INF1234"
}
```

**Plain Text Format:**
```
INF1234
```

Both formats extract the 4-digit number (e.g., "1234") and auto-fill the input.

## 🐛 Troubleshooting

### Mobile can't connect
- Check both devices are on same WiFi
- Ensure firewall isn't blocking port 4000
- Try disabling and re-enabling scanner mode

### Camera not working
- Grant camera permissions in browser settings
- Try using Chrome or Safari (best compatibility)
- Ensure no other app is using the camera

### Scanner not receiving scans
- Check "Scanner Connected" indicator is showing
- Verify socket connection in browser console
- Try refreshing both laptop and mobile pages

## 📚 Full Documentation

For detailed technical documentation, see [QR_SCANNER_SETUP.md](QR_SCANNER_SETUP.md)

## 💡 Tips

- Keep laptop screen bright enough for mobile to scan QR code
- Position mobile camera 6-12 inches from QR codes
- Ensure good lighting for best scan results
- Scanner pauses automatically after each scan
- Connection persists even if you switch browser tabs

## 🎉 You're Ready!

Start the server and begin distributing kits with the QR scanner!

```bash
npm run dev
```

Navigate to: `http://localhost:4000/provide-kit`

---

**Need Help?** Check the console logs in both laptop and mobile browsers for debugging information.
