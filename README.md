# ReliefLink Lite - Emergency Aid Coordination Platform

A professional, mobile-first web application for emergency aid coordination that connects people in need with nearby aid providers through intelligent, rule-based matching.

## 🚀 Features

### Core Functionalities
- **Request Help Form**: Users can submit emergency assistance requests with location, category, and urgency
- **Offer Help Form**: Volunteers and organizations can register their available aid services
- **Intelligent Matching**: Rule-based algorithm that prioritizes matches based on urgency, location, and category
- **Admin Dashboard**: Complete management interface for monitoring and coordinating relief efforts
- **Interactive Map**: Google Maps integration showing real-time locations of requests and offers
- **Real-time Updates**: Live synchronization of data across all connected devices

### Smart Matching Rules
1. **Critical Medical Priority**: Critical medical requests get immediate attention from healthcare providers
2. **Rural Food Priority**: Food requests in rural areas receive priority matching
3. **NGO/Government Priority**: Professional organizations prioritized for high-urgency requests
4. **Individual Volunteer Support**: Community volunteers matched with low-urgency local needs
5. **Business Transportation**: Companies prioritized for transportation requests
6. **Religious Organization Aid**: Faith-based groups matched with shelter and food needs
7. **Location-based Matching**: Distance and service radius calculations
8. **Capacity Matching**: Provider capacity matched with number of people needing help

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth with Google OAuth
- **Maps**: Google Maps API integration
- **Deployment**: Static hosting ready (Firebase, Vercel, Netlify)

## 📱 Mobile-First Design

- Responsive layout optimized for all devices
- Touch-friendly interface
- Fast loading on low-bandwidth connections
- Progressive Web App features

## 🔧 Setup Instructions

### Prerequisites
1. Firebase project with Authentication and Realtime Database enabled
2. Google OAuth configured in Firebase Console
3. (Optional) Google Maps API key for map features

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "ReliefLink Lite" or similar
3. Enable Authentication and select Google as sign-in provider
4. Enable Realtime Database in test mode
5. Add your domain to authorized domains in Authentication settings

### Local Development
1. Clone/download the project files
2. Update Firebase configuration in `js/firebase-config.js`
3. Start local server: `python -m http.server 5000`
4. Access at `http://localhost:5000`

### Deployment Options

#### Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

#### Vercel
1. Connect repository to Vercel
2. Set build command: `echo "Static files ready"`
3. Set output directory: `.`
4. Deploy automatically

#### Other Hosting
Upload all files to any static hosting service (Netlify, GitHub Pages, etc.)

## 👨‍💼 Admin Access

- First user to log in automatically becomes system administrator
- Admin dashboard accessible at `/admin.html`
- Features include:
  - View all requests and offers
  - Filter by urgency, status, and category
  - Run manual matching algorithms
  - Update request/offer statuses
  - View detailed match information

## 📊 Database Structure

```
help-requests/
  ├── REQ_[timestamp]_[random]/
  │   ├── requesterName
  │   ├── helpCategory
  │   ├── urgencyLevel
  │   ├── location
  │   └── status

help-offers/
  ├── OFF_[timestamp]_[random]/
  │   ├── providerName
  │   ├── helpTypes[]
  │   ├── providerLocation
  │   └── availability

matches/
  ├── MATCH_[timestamp]_[random]/
  │   ├── requestId
  │   ├── offerId
  │   ├── matchScore
  │   └── status

admins/
  ├── [user-uid]/
  │   ├── email
  │   ├── role
  │   └── createdAt
```

## 🔒 Security Features

- Firebase Security Rules configured
- Input validation on all forms
- XSS protection
- Authentication required for admin functions
- Rate limiting through Firebase

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📈 Performance

- Lightweight vanilla JavaScript
- Optimized CSS with mobile-first approach
- Firebase CDN for fast global access
- Efficient real-time data synchronization

## 🆘 Emergency Use Cases

- Natural disaster response
- Community aid coordination
- Food distribution programs
- Medical emergency assistance
- Shelter and housing support
- Transportation services

## 🔧 Customization

The platform can be easily customized for different types of emergency response:

1. **Help Categories**: Modify categories in form options
2. **Matching Rules**: Adjust weights in `js/matching.js`
3. **UI Styling**: Update CSS variables for branding
4. **Form Fields**: Add/remove fields as needed

## 📞 Support

For technical support or feature requests, please refer to the project documentation or contact your system administrator.

## 📄 License

Built for emergency response and humanitarian purposes. Free to use and modify for non-commercial aid coordination.

---

**ReliefLink Lite** - Code with Impact by SwizCoders