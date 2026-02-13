# QR Scanner Setup Documentation

## Overview

This implementation adds QR code scanning functionality to the Infinitum Helpdesk portal, allowing mobile devices to scan participant ID cards and automatically populate the ID on the laptop helpdesk interface via Socket.IO real-time connection.

## Architecture

### Components

1. **Socket.IO Server** (`lib/socket.ts`)
   - Manages real-time WebSocket connections between laptop (desk) and mobile (scanner)
   - Handles desk session validation and room management
   - Forwards scanned IDs from mobile to laptop

2. **Custom Next.js Server** (`server.js`)
   - Integrates Socket.IO with Next.js
   - Runs on port 4000 (configurable via PORT env variable)

3. **Scanner Context** (`contexts/ScannerContext.tsx`)
   - React context for managing scanner state across the app
   - Handles socket connection lifecycle
   - Manages scanned ID state

4. **Mobile Scanner Page** (`app/scanner/page.tsx`)
   - Mobile-optimized QR code scanner interface
   - Uses html5-qrcode for camera access
   - Connects to desk via unique session link

5. **Updated Provide Kit Page** (`app/provide-kit/page.tsx`)
   - Integrated scanner mode toggle
   - Displays QR code for mobile to scan
   - Auto-populates 4-digit ID when scanned

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed:
```bash
npm install socket.io socket.io-client react-hot-toast
```

### 2. Start the Server

The custom server is now configured in package.json. Start it with:

```bash
npm run dev
```

This will start the Next.js app with Socket.IO on port 4000.

### 3. Environment Variables

No additional environment variables needed for Socket.IO. The server automatically detects localhost and local network IPs.

For MongoDB URI (if needed for user data):
```env
MONGODB_URI=your_mongodb_connection_string
```

## How to Use

### Laptop (Helpdesk) Setup:

1. Navigate to the **Provide Kit** page (`/provide-kit`)
2. Click **"Enable Scanner"** button (green button in top-right)
3. A QR code will appear on screen
4. Keep this page open

### Mobile (Scanner) Setup:

1. Open your mobile device camera or QR code scanner app
2. Scan the QR code displayed on the laptop screen
3. This opens the scanner page on your mobile
4. Allow camera permissions when prompted
5. The scanner will automatically start

### Scanning Process:

1. Point mobile camera at participant's QR code (containing INF ID)
2. Mobile instantly sends the scanned ID to laptop via Socket.IO
3. Laptop automatically populates the 4-digit ID
4. User details are fetched and displayed
5. Process the kit distribution
6. Click **"Clear & Ready for Next Scan"** to reset for next participant

## QR Code Format

The scanner accepts two formats:

**Format 1: JSON Object**
```json
{
  "type": "PARTICIPANT",
  "uniqueId": "INF1234"
}
```

**Format 2: Plain Text**
```
INF1234
```

Both formats will extract the 4-digit portion (1234) and populate the input fields.

## Socket.IO Events

### Client → Server

| Event | Sender | Payload | Description |
|-------|--------|---------|-------------|
| `join-desk` | Laptop | `{deskId, signature}` | Laptop joins a desk session |
| `join-scanner` | Mobile | `{deskId, signature}` | Mobile joins the desk session |
| `scan-participant` | Mobile | `{uniqueId}` | Mobile sends scanned ID |
| `clear-scan` | Both | - | Clear current scan and reset |
| `resume-scanning` | Laptop | - | Tell mobile to resume scanning |

### Server → Client

| Event | Receiver | Payload | Description |
|-------|----------|---------|-------------|
| `desk-joined` | Laptop | `{deskId}` | Desk successfully joined |
| `scanner-joined` | Mobile | `{deskId}` | Scanner successfully joined |
| `scanner-connected` | Laptop | - | Mobile scanner connected |
| `scanner-disconnected` | Laptop | - | Mobile scanner disconnected |
| `desk-disconnected` | Mobile | - | Laptop disconnected |
| `scan-acknowledged` | Both | `{uniqueId}` | Scan received and processed |
| `clear-scan` | Both | - | Clear command from either side |
| `resume-scanning` | Mobile | - | Resume scanning command |
| `error` | Both | `{message}` | Error occurred |

## Security Features

1. **Session-based Authentication**: Each desk session has a unique ID and signature
2. **Session Expiration**: Sessions expire after 24 hours
3. **CORS Protection**: Only allows connections from approved origins
4. **Role-based Actions**: Only scanners can send scans, only desks can resume

## Troubleshooting

### Mobile Can't Connect

**Issue**: "Invalid scanner link" or connection timeout

**Solutions**:
- Ensure laptop and mobile are on the same network (for local development)
- Check that port 4000 is not blocked by firewall
- Verify the server is running (`npm run dev`)
- Try refreshing the QR code (disable and re-enable scanner mode)

### Camera Not Working

**Issue**: Camera doesn't start or permission denied

**Solutions**:
- Grant camera permissions in mobile browser settings
- Use HTTPS in production (required for camera access)
- Try a different browser (Chrome/Safari recommended)
- Check if another app is using the camera

### Scanner Not Receiving Scans

**Issue**: QR code scanned but nothing happens on laptop

**Solutions**:
- Check "Scanner Connected" indicator is showing
- Verify both devices are connected (check browser console)
- Try clearing and rescanning
- Restart scanner mode

### Port Already in Use

**Issue**: `Error: listen EADDRINUSE: address already in use :::4000`

**Solutions**:
```bash
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=5000
```

## Network Configuration

### Local Development
- Laptop and mobile must be on same WiFi network
- Access laptop via IP address: `http://192.168.x.x:4000`
- QR code automatically generates correct URL

### Production Deployment
- Set `NEXT_PUBLIC_APP_URL` environment variable
- Ensure WebSocket connections are allowed
- Use HTTPS for camera permissions
- Configure reverse proxy for Socket.IO path

## File Structure

```
infinitum-helpdesk/
├── server.js                          # Custom Next.js server with Socket.IO
├── lib/
│   └── socket.ts                      # Socket.IO initialization & logic
├── app/
│   ├── layout.tsx                     # Wrapped with ScannerProvider
│   ├── provide-kit/
│   │   └── page.tsx                   # Updated with scanner integration
│   ├── scanner/
│   │   └── page.tsx                   # Mobile scanner interface
│   └── api/
│       ├── socket/
│       │   └── route.ts               # Socket endpoint info
│       └── desk/
│           └── session/
│               └── route.ts           # Create desk session API
└── contexts/
    └── ScannerContext.tsx              # Scanner state management
```

## Performance Notes

- Socket.IO uses WebSocket protocol for real-time communication
- Fallback to polling if WebSocket unavailable
- Minimal latency (<100ms) for local network connections
- QR scanner runs at 10 FPS for battery efficiency
- Auto-cleanup of disconnected sessions

## Future Enhancements

- [ ] Add audio/haptic feedback on successful scan
- [ ] Support for batch scanning mode
- [ ] Scanner statistics and history
- [ ] Multi-desk support in single portal
- [ ] Offline mode with scan queue
- [ ] Admin dashboard for active scanners

## Support

For issues or questions, please check:
1. Browser console for error messages
2. Server logs for Socket.IO connection issues
3. Network tab in DevTools for WebSocket status
