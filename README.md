# Infinitum Helpdesk

Event helpdesk system for Infinitum - Kriya 2025. Manage on-spot registrations, kit distribution, and tracking.

## Features

- **Staff Authentication**: Secure login for helpdesk staff
- **On-Spot Registration**: Register walk-in participants with form validation
- **Payment URL Generation**: Generate payment links with QR codes
- **Kit Distribution**: Verify payment and distribute event kits
- **Kit Tracking**: Real-time statistics and participant lists
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: CSS Modules with custom CSS variables
- **State Management**: React Hooks
- **Authentication**: JWT token-based (localStorage)

## Project Structure

```
infinitum-helpdesk/
├── app/
│   ├── globals.css           # Global styles and theme
│   ├── layout.js             # Root layout component
│   ├── page.js               # Dashboard (main page)
│   ├── login/
│   │   └── page.js           # Login page
│   ├── register-on-spot/
│   │   └── page.js           # On-spot registration
│   ├── provide-kit/
│   │   └── page.js           # Kit distribution
│   └── kit-list/
│       └── page.js           # Kit tracking & statistics
├── data/
│   ├── colleges.js           # List of colleges
│   └── departments.js        # List of departments
├── utils/
│   └── api.js                # API utilities and helpers
├── public/
│   └── logo.png              # Event logo (add your logo here)
├── package.json
├── next.config.js
├── jsconfig.json
└── .env.example              # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Backend API running (see API Configuration below)

### Installation

1. **Clone the repository**

   ```bash
   cd infinitum-helpdesk
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and update:

   ```
   NEXT_PUBLIC_API_URL=http://your-backend-url
   ```

4. **Add your logo**

   - Place your event logo as `public/logo.png`
   - Recommended size: 400x400px (transparent PNG)

5. **Run development server**

   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## API Configuration

The frontend expects the following API endpoints from your backend:

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
