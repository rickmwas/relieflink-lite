// Simple language dictionary for English and Swahili
const translations = {
  en: {
    'ReliefLink Lite': 'ReliefLink Lite',
    'Home': 'Home',
    'Admin': 'Admin',
    'Login': 'Login',
    'Logout': 'Logout',
    'Show Requests': 'Show Requests',
    'Show Offers': 'Show Offers',
    'Show Matches': 'Show Matches',
    'All Urgency': 'All Urgency',
    'Critical': 'Critical',
    'High': 'High',
    'Medium': 'Medium',
    'Low': 'Low',
    'All Categories': 'All Categories',
    'Food & Water': 'Food & Water',
    'Medical': 'Medical',
    'Shelter': 'Shelter',
    'Clothing': 'Clothing',
    'Transportation': 'Transportation',
    'Other': 'Other',
    'Interactive Map': 'Interactive Map',
    'Map will load here when Google Maps API is configured': 'Map will load here when Google Maps API is configured',
    'Load Map': 'Load Map',
    'Map Legend': 'Map Legend',
    'Help Requests': 'Help Requests',
    'Help Offers': 'Help Offers',
    'Successful Matches': 'Successful Matches',
    'Urgency Levels': 'Urgency Levels',
    'Contact:': 'Contact:',
    'Location:': 'Location:',
    'Status:': 'Status:',
    'View Details': 'View Details',
    'Loading map data...': 'Loading map data...',
    'No help requests found': 'No help requests found',
    'by SwizCoders - Code with Impact': 'by SwizCoders - Code with Impact',
    'Get Help': 'Get Help',
    'Offer Help': 'Offer Help',
    'View Map': 'View Map',
    'Admin Dashboard': 'Admin Dashboard',
    'Admin Panel': 'Admin Panel',
    'Submit a request for emergency assistance in your area': 'Submit a request for emergency assistance in your area',
    'Volunteer or provide aid to those in need': 'Volunteer or provide aid to those in need',
    'See active requests and offers on an interactive map': 'See active requests and offers on an interactive map',
    'Manage requests and coordinate relief efforts': 'Manage requests and coordinate relief efforts',
    'Recent Activity': 'Recent Activity',
    'Welcome to ReliefLink Lite. Start by requesting or offering help.': 'Welcome to ReliefLink Lite. Start by requesting or offering help.',
    'Loading...': 'Loading...',
  },
  sw: {
    'ReliefLink Lite': 'ReliefLink Lite',
    'Home': 'Nyumbani',
    'Admin': 'Msimamizi',
    'Login': 'Ingia',
    'Logout': 'Toka',
    'Show Requests': 'Onyesha Maombi',
    'Show Offers': 'Onyesha Ofa',
    'Show Matches': 'Onyesha Mechi',
    'All Urgency': 'Dharura Zote',
    'Critical': 'Hatari',
    'High': 'Juu',
    'Medium': 'Wastani',
    'Low': 'Chini',
    'All Categories': 'Kategoria Zote',
    'Food & Water': 'Chakula & Maji',
    'Medical': 'Tiba',
    'Shelter': 'Makazi',
    'Clothing': 'Mavazi',
    'Transportation': 'Usafiri',
    'Other': 'Nyingine',
    'Interactive Map': 'Ramani Shirikishi',
    'Map will load here when Google Maps API is configured': 'Ramani itaonekana hapa wakati API ya Google Maps imewekwa',
    'Load Map': 'Pakia Ramani',
    'Map Legend': 'Hadithi ya Ramani',
    'Help Requests': 'Maombi ya Msaada',
    'Help Offers': 'Ofer za Msaada',
    'Successful Matches': 'Mechi Zilizofanikiwa',
    'Urgency Levels': 'Viwango vya Dharura',
    'Contact:': 'Mawasiliano:',
    'Location:': 'Mahali:',
    'Status:': 'Hali:',
    'View Details': 'Tazama Maelezo',
    'Loading map data...': 'Inapakia data ya ramani...',
    'No help requests found': 'Hakuna maombi ya msaada yaliyopatikana',
    'by SwizCoders - Code with Impact': 'na SwizCoders - Kutoa Mabadiliko',
    'Get Help': 'Pata Msaada',
    'Offer Help': 'Toa Msaada',
    'View Map': 'Tazama Ramani',
    'Admin Dashboard': 'Dashibodi ya Msimamizi',
    'Admin Panel': 'Jopo la Msimamizi',
    'Submit a request for emergency assistance in your area': 'Tuma ombi la msaada wa dharura katika eneo lako',
    'Volunteer or provide aid to those in need': 'Jitolee au toa msaada kwa wanaohitaji',
    'See active requests and offers on an interactive map': 'Tazama maombi na ofa zilizo hai kwenye ramani shirikishi',
    'Manage requests and coordinate relief efforts': 'Simamia maombi na uratibu juhudi za msaada',
    'Recent Activity': 'Shughuli za Hivi Karibuni',
    'Welcome to ReliefLink Lite. Start by requesting or offering help.': 'Karibu ReliefLink Lite. Anza kwa kuomba au kutoa msaada.',
    'Loading...': 'Inapakia...',
  }
};

function setLanguage(lang) {
  localStorage.setItem('lang', lang);
  translatePage(lang);
}

function translatePage(lang) {
  // Translate static text
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  // Translate placeholders and values for select/options
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    const key = el.getAttribute('data-i18n-value');
    if (translations[lang][key]) {
      el.setAttribute('value', translations[lang][key]);
    }
  });
  // Special case for Google Maps API script tag
  if (lang === 'sw') {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&language=sw&region=TZ';
    document.head.appendChild(script);
  } else {
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.remove();
    }
  }
}

// Auto-detect language or use default
const userLang = navigator.language || navigator.userLanguage;
const lang = userLang.startsWith('sw') ? 'sw' : 'en';
setLanguage(lang);

// For testing: force language
// setLanguage('en');
// setLanguage('sw');

// Attach event listeners for language toggle buttons
window.addEventListener('DOMContentLoaded', function() {
  const enBtn = document.getElementById('lang-en');
  const swBtn = document.getElementById('lang-sw');
  if (enBtn) enBtn.addEventListener('click', () => setLanguage('en'));
  if (swBtn) swBtn.addEventListener('click', () => setLanguage('sw'));
});
