# ReliefLink Lite

## Overview

ReliefLink Lite is a client-side web application for emergency aid coordination that connects people in need with nearby aid providers through intelligent, rule-based matching. The application is built as a static website with Firebase integration for real-time data management and authentication.

## System Architecture

### Frontend Architecture
- **Static Website**: Pure HTML, CSS, and JavaScript application served via Python HTTP server
- **Multi-page Application**: Separate HTML pages for different functionalities (home, request help, offer help, map view, admin dashboard)
- **Client-side Routing**: JavaScript-based navigation between pages
- **Responsive Design**: Mobile-first CSS design with Font Awesome icons

### Backend Architecture
- **Supabase PostgreSQL Database**: SQL database for storing requests, offers, and matches with Row Level Security
- **Supabase Authentication**: Email/password authentication system for Kenyan users
- **Client-side Business Logic**: All processing happens in the browser
- **Rule-based Matching Engine**: Custom JavaScript algorithm for matching requests with offers

## Key Components

### Core Pages
1. **index.html**: Homepage with statistics and navigation
2. **request-help.html**: Form for emergency help requests
3. **offer-help.html**: Form for registering aid availability
4. **map.html**: Google Maps integration showing requests and offers
5. **admin.html**: Administrative dashboard for managing the system

### JavaScript Modules
1. **main.js**: Core application logic and statistics management
2. **auth.js**: Firebase authentication management
3. **forms.js**: Form handling for requests and offers
4. **map.js**: Google Maps integration and location services
5. **matching.js**: Rule-based matching algorithm
6. **admin.js**: Administrative dashboard functionality
7. **firebase-config.js**: Firebase initialization and configuration

### CSS Framework
- **style.css**: Custom CSS framework with responsive design
- **Component-based styling**: Modular CSS for reusable components
- **Mobile-first approach**: Responsive breakpoints for different screen sizes

## Data Flow

### Request Flow
1. User fills out help request form (request-help.html)
2. Form data validated and submitted via forms.js
3. Request stored in Firebase Realtime Database
4. Matching engine automatically finds compatible offers
5. Matches created and notifications sent

### Offer Flow
1. Provider registers availability via offer-help.html
2. Offer data stored in Firebase with geolocation
3. System continuously matches new offers with existing requests
4. Provider receives match notifications

### Admin Flow
1. Admin authenticates via Google OAuth
2. Dashboard loads real-time statistics and data
3. Admin can manage requests, offers, and matches
4. Real-time updates reflected across all connected clients

## External Dependencies

### Firebase Services
- **Firebase Realtime Database**: Real-time data synchronization
- **Firebase Authentication**: Google OAuth integration
- **Firebase Hosting**: (Optional) For production deployment

### Third-party Libraries
- **Google Maps API**: Location services and map visualization
- **Font Awesome**: Icon library for UI components
- **Firebase SDK**: Client-side Firebase integration

### Browser APIs
- **Geolocation API**: For automatic location detection
- **Local Storage**: For caching user preferences

## Deployment Strategy

### Development Environment
- **Python HTTP Server**: Simple local development server (port 5000)
- **Static File Serving**: No server-side processing required
- **Environment Configuration**: Firebase config requires manual setup

### Production Deployment
- **Static Hosting**: Can be deployed to any static hosting service
- **CDN Integration**: Font Awesome and Firebase SDKs loaded from CDN
- **Environment Variables**: Firebase configuration needs to be updated for production

### Configuration Requirements
1. Firebase project setup with Realtime Database and Authentication
2. Google Maps API key configuration
3. Firebase configuration object update in firebase-config.js
4. OAuth domain whitelist configuration in Firebase console

## Configuration Status

### Firebase Integration ✅
- Firebase project configured with provided API keys
- Authentication with Google OAuth enabled
- Realtime Database ready for help requests, offers, and matches
- First user automatically becomes admin

### Features Implemented ✅
- **Request Help Form**: Complete form with validation and Firebase storage
- **Offer Help Form**: Provider registration with geolocation and capacity
- **Rule-Based Matching**: Intelligent matching algorithm with 8 priority rules
- **Admin Dashboard**: Full management interface with filters and real-time updates
- **Map Integration**: Google Maps support (requires API key)
- **Real-time Updates**: Live data synchronization across all components

### Deployment Ready ✅
- Static files optimized for any hosting service
- Firebase configuration complete
- Python HTTP server running on port 5000
- Mobile-responsive design

## Deployment Instructions

### For Firebase Hosting:
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

### For Vercel:
1. Connect your project repository to Vercel
2. Set build command to: `echo "Static files ready"`
3. Set output directory to: `.`
4. Deploy automatically on git push

### For Other Hosting:
Upload all files to any static hosting service (Netlify, GitHub Pages, etc.)

## Admin Access
- First user to login automatically becomes admin
- Admin can manage all requests, offers, and matches
- Run manual matching from admin dashboard

## Changelog

- June 27, 2025: Complete ReliefLink Lite platform built with Firebase integration
- June 27, 2025: Authentication system with auto-admin setup
- June 27, 2025: Rule-based matching engine with 8 priority algorithms
- June 27, 2025: Migrated to local storage system (no Firebase billing required)
- June 27, 2025: Created downloadable package for offline deployment

## User Preferences

Preferred communication style: Simple, everyday language.