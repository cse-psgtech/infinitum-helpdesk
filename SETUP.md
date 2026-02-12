# Infinitum Helpdesk - Setup Guide

## Backend Integration

This helpdesk application is now configured to work with the Infinitum backend API.

### Required Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=https://infinitumbackend.psgtech.ac.in

# Admin API Key (REQUIRED - Get this from your backend team)
NEXT_PUBLIC_ADMIN_API_KEY=your-actual-admin-api-key-here

# Optional: Host IP for mobile scanner QR code
NEXT_PUBLIC_HOST_IP=10.155.34.158
```

**IMPORTANT:** You must replace `your-actual-admin-api-key-here` with the actual admin API key from your backend server. The app will not work without this.

### Login Credentials

**Username:** `admin`  
**Password:** `admin`

### Features

1. **Provide Kit Page** - Main feature for kit distribution
   - Enter participant's unique ID (last 4 digits)
   - System fetches user details from backend
   - Verifies user verification status and payment
   - Only allows kit provision if:
     - User is verified (verification document checked)
     - Payment is completed (generalFeePaid = true)
     - Kit not already provided
   - Updates kit status in backend when provided

2. **Mobile Scanner** - Scan QR codes with mobile device
   - Generates QR code for mobile connection
   - Syncs scans to laptop in real-time
   - Shows participant details

3. **Kit List** - View all participants and kit statistics
   - Note: This feature requires additional backend API endpoints

### Backend API Endpoints Used

- `GET /api/auth/admin/user/:id` - Get user details (requires x-api-key header)
- `PUT /api/auth/user/kit/:status` - Update kit status (requires x-api-key header)

### How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env.local` file with the admin API key

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

### User Verification Flow

1. Volunteer enters participant's unique ID
2. System fetches user details from backend including:
   - Name, email, phone
   - College, department, year
   - **Verification status** (verified field)
   - **Verification document** (verificationUrl)
   - Payment status (generalFeePaid)
   - Kit status (kit)

3. System displays all user information

4. If user is **NOT verified**, shows error: 
   > ❌ User not verified. Cannot provide kit until verification is complete.

5. If payment is **NOT completed**, shows error:
   > ❌ Payment not completed. Cannot provide kit.

6. If kit is **already provided**, shows warning:
   > ⚠️ Kit already provided to this participant!

7. Only when user is **verified AND payment is done AND kit not provided**, the "Provide Kit" button becomes active

8. When kit is provided, system calls backend API to update kit status to `true`

### Troubleshooting

**"Unauthorized admin access" error:**
- Check that `NEXT_PUBLIC_ADMIN_API_KEY` in `.env.local` matches the key in your backend

**"User not found" error:**
- Verify the unique ID is correct
- Check that the user exists in the backend database

**Cannot provide kit:**
- Ensure user verification is complete
- Check payment status in backend
- Verify kit hasn't been provided already
