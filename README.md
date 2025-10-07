# SkyBook - Flight Ticketing Web Service

A modern, full-stack flight ticketing web application built with Next.js, React, and Firebase. Search, compare, and book flights from airlines worldwide with an intuitive and beautiful user interface.

## 🚀 Live Demo

**Deployed Application:** [https://flight-ticketing-web-service.vercel.app/](https://flight-ticketing-web-service.vercel.app/)

## 🎥 Demo Video

**YouTube Demo:** [Link to be added]

## 📋 Features

- **User Authentication**: Secure login and signup with Firebase Authentication
- **Flight Search**: Search for flights by origin, destination, date, and number of passengers
- **Flight Booking**: Book flights with real-time availability checking
- **User Dashboard**: View your booked tickets and flight schedules
- **Company Portal**: Airlines can manage their flights and view passenger information
- **Admin Panel**: 
  - Manage users and companies
  - Create and manage content (banners, offers)
  - View platform statistics
- **Responsive Design**: Beautiful UI that works seamlessly across all devices

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Deployment**: Vercel
- **Language**: TypeScript

## 🌐 Deployment Process

This application is deployed on **Vercel**, which provides seamless integration with Next.js applications.

### Deployment Steps:

1. **Platform**: Deployed on [Vercel](https://vercel.com)
2. **Integration**: Connected directly to the GitHub repository
3. **Build Settings**: 
   - Framework Preset: Next.js
   - Build Command: `npm run build` (automatically detected)
   - Output Directory: `.next` (automatically configured)
4. **Environment Variables**: Firebase configuration and other environment variables are configured in the Vercel dashboard
5. **Automatic Deployments**: Every push to the main branch triggers an automatic deployment
6. **Preview Deployments**: Pull requests generate preview deployments for testing

### Services Used:

- **Vercel**: Web hosting and deployment platform
- **Firebase**: Backend services including:
  - Firebase Authentication for user management
  - Cloud Firestore for database
  - Firebase Admin SDK for server-side operations
- **Vercel Analytics**: Performance monitoring (optional)

### Deployment Benefits:

- **Zero Configuration**: Vercel automatically detects Next.js and applies optimal settings
- **Global CDN**: Content is served from edge locations worldwide for faster load times
- **Automatic HTTPS**: SSL certificates are automatically provisioned and renewed
- **Instant Rollbacks**: Easy rollback to previous deployments if needed
- **Environment Management**: Separate production, preview, and development environments

## 🚀 Getting Started (Local Development)

### Prerequisites

- Node.js 18+ and npm/pnpm
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/flight-ticketing-web-service.git
   cd flight-ticketing-web-service
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
