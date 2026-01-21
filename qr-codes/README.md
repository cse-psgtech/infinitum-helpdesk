# QR Code System for Infinitum Helpdesk

This folder contains generated QR codes for participants. Each QR code contains the participant's unique ID (e.g., INFIN1234).

## How It Works

### For Staff Members:

1. **Generate QR Codes:**
   - Go to `/generate-qr` page in the helpdesk
   - Enter participant ID (last 4 digits or full ID)
   - Optionally enter participant name
   - Click "Generate QR Code"
   - Print or save the QR code

2. **Bulk Generate:**
   - Run `node scripts/generate-all-qr-codes.js` to generate QR codes for all participants
   - QR codes will be saved in this folder as PNG images

3. **At the Event:**
   - Participants show their QR code (printed or on phone)
   - Staff scans using laptop camera on `/provide-kit` page
   - System automatically fetches participant details
   - Staff provides kit and marks as provided

### For Participants:

**If they have QR code:**
- Show QR code at entrance
- Staff scans using camera
- Instant kit provision

**If they DON'T have QR code:**
- Tell staff their ID or name
- Staff enters manually (4 digits)
- Staff provides kit

## Files

Each QR code file is named: `INFIN1234.png`
- Contains participant ID
- 300x300 pixels
- Black and white for easy scanning

## Usage

```bash
# Generate QR codes for all participants
node scripts/generate-all-qr-codes.js

# QR codes will be saved in: infinitum-helpdesk/qr-codes/
```

## Print Instructions

1. Open the PNG files
2. Print at actual size (not scaled)
3. Ensure printer quality is set to "Best"
4. Use white paper for best scanning results

---

**Note:** QR codes are generated automatically and contain only the participant ID. No personal information is stored in the QR code itself.
