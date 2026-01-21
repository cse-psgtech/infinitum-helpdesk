# Infinitum Helpdesk

Event helpdesk system for Infinitum 2026. Manage on-spot registrations, kit distribution with mobile QR scanning, and real-time tracking for multiple organizers.

## ✨ Features

- **🔐 Staff Authentication**: Secure login for multiple organizers
- **📝 On-Spot Registration**: Register walk-in participants with form validation
- **📱 Mobile QR Scanner**: Connect phone to laptop for seamless QR code scanning
- **📦 Kit Distribution**: Verify payment and distribute event kits with real-time tracking
- **📊 Live Statistics**: Real-time kit distribution stats with auto-refresh
- **🔄 Session Persistence**: Scanner stays connected even when navigating pages
- **⚠️ Connection Monitoring**: Visual indicators for phone connection status
- **🌐 Multi-Organizer Support**: Multiple organizers can work simultaneously
- **💾 MongoDB Integration**: All data stored in cloud database
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB Atlas (Cloud)
- **Styling**: Custom CSS with theme variables
- **QR Generation**: qrcode.react
- **QR Scanning**: html5-qrcode
- **State Management**: React Hooks + SessionStorage

## 📁 Project Structure

```
infinitum-helpdesk/
├── app/
│   ├── globals.css              # Global styles and theme
│   ├── layout.tsx               # Root layout with sidebar
│   ├── page.tsx                 # Dashboard
│   ├── login/page.tsx           # Staff login
│   ├── register-on-spot/        # On-spot registration
│   ├── provide-kit/             # Kit distribution with QR scanner
│   ├── mobile-scanner/          # Mobile phone scanner page
│   ├── kit-list/                # Kit tracking & statistics
│   ├── generate-qr/             # QR code generation
│   └── api/
│       ├── auth/login/          # Authentication API
│       ├── register/            # Registration API
│       ├── participant/[id]/    # Participant details
│       ├── scan-session/        # Scanner session management
│       └── kits/                # Kit statistics & list
├── components/
│   ├── sidebar.tsx              # Navigation sidebar
│   └── scanner-status-bar.tsx  # Global scanner status
├── models/
│   ├── Participant.ts           # Participant schema
│   └── ScanSession.ts           # Scanner session schema
├── lib/
│   └── mongodb.ts               # MongoDB connection
├── data/
│   ├── colleges.ts              # College list
│   └── departments.ts           # Department list
└── .env.local                   # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- MongoDB Atlas account (free tier works great)

### Local Development Setup

1. **Clone the repository**

   ```bash
   cd infinitum-helpdesk
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Edit `.env.local` with your settings:

   ```env
   # MongoDB connection string (get from MongoDB Atlas)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/infinitum-2026

   # API URL (use localhost for development)
   NEXT_PUBLIC_API_URL=http://localhost:3001

   # Your laptop's IP address (for mobile phone to connect)
   # Find using: ipconfig (Windows) or ifconfig (Mac/Linux)
   NEXT_PUBLIC_HOST_IP=192.168.1.100
   ```

4. **Find your laptop's IP address** (for mobile QR scanning)

   **Windows:**
   ```bash
   ipconfig | Select-String -Pattern "IPv4"
   ```

   **Mac/Linux:**
   ```bash
   ifconfig | grep "inet "
   ```

   Update `NEXT_PUBLIC_HOST_IP` in `.env.local` with your IP.

5. **Enable mobile Chrome to access local IP** (one-time setup)

   On your phone:
   - Open Chrome
   - Go to `chrome://flags`
   - Search for "Insecure origins treated as secure"
   - Add: `http://YOUR_IP:3001` (e.g., `http://192.168.1.100:3001`)
   - Restart Chrome

6. **Add your logo** (optional)

   - Place your event logo as `public/logo.png`
   - Recommended size: 400x400px (transparent PNG)

7. **Run development server**

   ```bash
   npm run dev
   ```

8. **Access the app**
   - **On laptop:** `http://localhost:3001`
   - **On phone:** `http://YOUR_IP:3001` (must be on same WiFi)

### Default Login Credentials

```
Username: admin
Password: infinitum2026

Additional organizers:
- organizer1 / infin123
- organizer2 / infin123
- organizer3 / infin123
```

## 📱 How to Use

### For Multiple Organizers

1. **All organizers** connect to `http://YOUR_IP:3001` (same WiFi network)
2. Each organizer logs in with their credentials
3. **Enable Scanner Mode** on Provide Kit page
4. Scan the QR code with your phone camera
5. **Scanner stays connected** even if you navigate to other pages
6. Watch the **status bar at bottom** to see connection status:
   - 🟢 **Green** = Phone connected, ready to scan
   - 🟡 **Purple** = Waiting for phone connection
   - 🔴 **Red** = Phone disconnected, scan QR again

### Workflow

1. **Register Participant** → Register on-spot page
2. **Generate QR Code** → Participant gets INFIN1234 ID
3. **Scan QR** → Use phone scanner to scan participant's QR
4. **Provide Kit** → Verify payment, mark kit as provided
5. **Track Stats** → View real-time statistics on Kit List page

## 🌐 Production Deployment (For 1000+ Participants)

For events with many participants and multiple organizers, deploy to a cloud platform:

### Deploy to Vercel (Recommended - Free)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add environment variable**
   ```bash
   vercel env add MONGODB_URI
   # Paste your MongoDB connection string
   ```

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

5. **Share URL with all organizers**
   - Everyone accesses: `https://infinitum-helpdesk.vercel.app`
   - No IP address issues
   - Works from anywhere with internet

### Benefits of Cloud Deployment

✅ No local IP configuration needed  
✅ Accessible from anywhere  
✅ Multiple organizers simultaneously  
✅ Automatic HTTPS (secure)  
✅ Fast global CDN  
✅ Free for your use case  

## 🔧 API Endpoints

All API routes are built-in (no separate backend needed):

### Authentication

- `POST /api/login` - Staff login
  - Request: `{ username, password }`
  - Response: `{ token, username }`

### Registration

- `POST /api/register` - Register new participant

  - Request: `{ name, email, college, department, year, phone, accommodation }`
  - Response: `{ participant_id, name, email, fee }`

- `POST /api/payment/generate-url` - Generate payment URL
  - Request: `{ participant_id, email, name, fee }`
  - Response: `{ payment_url }`

### Participant Management

- `GET /api/participant/:id` - Get participant details

  - Response: `{ participant_id, name, college, payment_status, kit_type, kit_provided }`

- `PUT /api/participant/:id/kit` - Mark kit as provided
  - Request: `{ kit_provided: true }`
  - Response: `{ success: true }`

### Kit Tracking

- `GET /api/kits/statistics` - Get kit distribution stats

  - Response: `{ workshop_and_general, workshop_only, general_only }`

- `GET /api/kits/list` - Get list of participants who received kits
  - Response: `{ participants: [...] }`

Update the API base URL in `utils/api.js` or use environment variables.

## Pages Overview

### 1. Login (`/login`)

- Staff authentication with username and password
- Password visibility toggle
- Redirects to dashboard on success

### 2. Dashboard (`/`)

- Navigation cards to all features
- QR code display area for payment URLs
- Logout functionality
- Welcome message

### 3. Register On-Spot (`/register-on-spot`)

- Participant registration form
- College/Department dropdowns with "Other" option
- Auto-calculates fee based on college
- Payment URL generation
- QR code display integration

### 4. Provide Kit (`/provide-kit`)

- 4-digit OTP-style ID input
- Auto-fetch participant details
- Payment status verification
- Duplicate kit prevention
- Kit distribution confirmation

### 5. Kit List (`/kit-list`)

- Statistics cards (Workshop, General, Combined)
- Scrollable participants table
- Real-time refresh functionality
- Serial numbers and participant details

## Customization

### Theme Colors

Edit CSS variables in `app/globals.css`:

```css
:root {
  --primary-purple: #8b5cf6;
  --light-purple: #e9d5ff;
  --dark-purple: #6d28d9;
  /* ... */
}
```

### College/Department Lists

Update arrays in:

- `data/colleges.js` - Add/remove colleges
- `data/departments.js` - Add/remove departments

### Fee Calculation

Modify in `utils/api.js`:

```javascript
calculateFee: (college) => {
  const hostColleges = ["Your College Name"];
  return hostColleges.includes(college) ? 200 : 250;
};
```

## Building for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

- Build with `npm run build`
- Serve `.next` folder
- Set `NEXT_PUBLIC_API_URL` environment variable

## Features Checklist

- ✅ Staff authentication
- ✅ On-spot registration with validation
- ✅ Payment URL generation
- ✅ QR code display
- ✅ Kit distribution with verification
- ✅ Payment status checking
- ✅ Duplicate kit prevention
- ✅ Kit tracking statistics
- ✅ Participant list with filters
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- All API calls include authentication headers
- Authentication token stored in localStorage
- Form validation on both client and server side
- Auto-focus and keyboard navigation support
- Mobile-responsive design with touch support

## Support

For issues or questions:

1. Check API endpoint configuration
2. Verify backend is running
3. Check browser console for errors
4. Ensure all dependencies are installed

## License

Copyright © 2025 Kriya - PSG College of Technology

---

Built with ❤️ for Kriya 2025
