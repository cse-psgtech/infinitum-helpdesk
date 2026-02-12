Infinitum Helpdesk

A modern event helpdesk management system for Infinitum - handling participant registration, kit distribution, and real-time tracking.

What this does:

* Participant Registration - Register event participants with their college, department, year, and accommodation preferences
* Kit Distribution - Manage and track kit distribution to participants across the event
* Real-time Scanning - Mobile-friendly interface for quick participant lookup
* Payment Tracking - Keep track of who's paid and accommodation details
* Statistics Dashboard - View kit distribution progress and participant information
* Session Management - Create and manage scan sessions for different distribution points

Built with:

* Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
* Backend: Node.js with Next.js API Routes
* Database: MongoDB with Mongoose
* UI: Framer Motion for animations and custom React components

Before you start:

You'll need these installed on your machine:

* Node.js (v18 or higher) - Get it from https://nodejs.org/
* npm (comes with Node.js)
* MongoDB (either local or MongoDB Atlas cloud)
* Git (for version control)

Getting Started:

1. Clone the project

```bash
git clone <repository-url>
cd infinitum-helpdesk
```

2. Install packages

```bash
npm install
```

3. Set up environment variables

Copy the example file:
```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your settings:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
MONGODB_URI=mongodb://localhost:27017/infinitum-helpdesk
```

Or if using MongoDB Atlas (cloud):
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/infinitum-helpdesk
```

4. Set up your database

If you're using local MongoDB, just make sure it's running:
```bash
mongod
```

If you prefer MongoDB Atlas (cloud):
- Go to https://www.mongodb.com/cloud/atlas
- Create a free account and cluster
- Copy your connection string
- Add it to `.env.local`

Running the app:

For development:
```bash
npm run dev
```

Then open http://localhost:3001 in your browser

For production:
```bash
npm run build
npm start
```

How it's organized:

* app/ - All the pages and API endpoints
  * api/ - Backend routes (registration, kit tracking, scanning)
  * login/ - Staff login page
  * provide-kit/ - Where you distribute kits to participants
  * kit-list/ - View all participants and kit status
  * mobile-scanner/ - Mobile scanning interface

* components/ - Reusable UI components
* models/ - Database schemas
* lib/ - Helper functions
* types/ - TypeScript definitions
* data/ - College and department lists
* public/ - Images and static files
* scripts/ - Utility scripts

Commands you can use:

* npm run dev - Start development server
* npm run build - Build for production
* npm start - Start production server
* npm run lint - Check code quality

Features explained:

* Participant Registration: Staff can register participants with all their details. Each gets a unique ID like INF1234.

* Kit Management: View who's paid, who's received their kit, and get distribution statistics.

* Quick Lookup: Staff can enter a participant ID and instantly see their details and provide their kit.

* Payment Tracking: Keep track of who's paid their fees and who still needs to pay.

* Authentication: Only registered staff can access the system via login.

Troubleshooting:

* Can't connect to MongoDB?
  * Make sure MongoDB is running on your machine
  * Check your MONGODB_URI in .env.local
  * If using Atlas, verify your connection string is correct

* Port 3001 is already in use?
  * Either close the other app using that port
  * Or run: PORT=3002 npm run dev

* Getting dependency errors?
  * Try clearing everything and reinstalling:
```bash
rm -r node_modules
npm install
```


Need help?

For issues or questions, create an issue in the repository or contact the development team.
