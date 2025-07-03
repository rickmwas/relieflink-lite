// Google Maps integration for ReliefLink Lite
class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.infoWindow = null;
        this.isMapLoaded = false;
        this.filters = {
            showRequests: true,
            showOffers: true,
            showMatches: false,
            urgency: 'all',
            category: 'all'
        };
        this.data = {
            requests: {},
            offers: {},
            matches: {}
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        
        // Check if Google Maps is available
        if (typeof google !== 'undefined' && google.maps) {
            this.initializeMap();
        } else {
            this.showMapPlaceholder();
        }
    }

    setupEventListeners() {
        // Map controls
        const showRequestsCheckbox = document.getElementById('show-requests');
        const showOffersCheckbox = document.getElementById('show-offers');
        const showMatchesCheckbox = document.getElementById('show-matches');
        const urgencyFilter = document.getElementById('urgency-filter');
        const categoryFilter = document.getElementById('category-filter');
        const loadMapBtn = document.getElementById('load-map-btn');

        if (showRequestsCheckbox) {
            showRequestsCheckbox.addEventListener('change', (e) => {
                this.filters.showRequests = e.target.checked;
                this.updateMarkers();
            });
        }

        if (showOffersCheckbox) {
            showOffersCheckbox.addEventListener('change', (e) => {
                this.filters.showOffers = e.target.checked;
                this.updateMarkers();
            });
        }

        if (showMatchesCheckbox) {
            showMatchesCheckbox.addEventListener('change', (e) => {
                this.filters.showMatches = e.target.checked;
                this.updateMarkers();
            });
        }

        if (urgencyFilter) {
            urgencyFilter.addEventListener('change', (e) => {
                this.filters.urgency = e.target.value;
                this.updateMarkers();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.updateMarkers();
            });
        }

        if (loadMapBtn) {
            loadMapBtn.addEventListener('click', () => {
                this.loadGoogleMaps();
            });
        }
    }

    showMapPlaceholder() {
        const mapContainer = document.getElementById('map');
        if (mapContainer && !this.isMapLoaded) {
            mapContainer.innerHTML = `
                <div class="map-placeholder">
                    <i class="fas fa-map-marked-alt"></i>
                    <h3>Interactive Map</h3>
                    <p>Google Maps API is not configured. Please add your API key to load the map.</p>
                    <button id="load-mock-map-btn" class="btn btn-primary">View Data List</button>
                </div>
            `;

            // Add event listener for mock map button
            const mockMapBtn = document.getElementById('load-mock-map-btn');
            if (mockMapBtn) {
                mockMapBtn.addEventListener('click', () => {
                    this.showDataList();
                });
            }
        }
    }

    async loadGoogleMaps() {
        try {
            showLoading('Loading Google Maps...');
            let timeout = setTimeout(() => {
                hideLoading();
                this.showMapPlaceholder();
            }, 8000); // fallback after 8 seconds
            // Try to initialize map
            if (typeof google !== 'undefined' && google.maps && this.getGoogleMapsApiKey() !== 'YOUR_GOOGLE_MAPS_API_KEY') {
                this.initializeMap();
                clearTimeout(timeout);
                hideLoading();
            } else if (this.getGoogleMapsApiKey() === 'YOUR_GOOGLE_MAPS_API_KEY') {
                hideLoading();
                this.showMapPlaceholder();
            } else {
                // Load Google Maps API dynamically
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${this.getGoogleMapsApiKey()}&callback=initMap`;
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
                // Set global callback
                window.initMap = () => {
                    clearTimeout(timeout);
                    this.initializeMap();
                    hideLoading();
                };
            }
        } catch (error) {
            console.error('Error loading Google Maps:', error);
            hideLoading();
            this.showMapPlaceholder();
        }
    }

    getGoogleMapsApiKey() {
        // Try to get API key from environment or use placeholder
        return process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
    }

    initializeMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        try {
            // Default location (center of world)
            const defaultLocation = { lat: 0, lng: 0 };

            this.map = new google.maps.Map(mapContainer, {
                zoom: 2,
                center: defaultLocation,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            this.infoWindow = new google.maps.InfoWindow();
            this.isMapLoaded = true;

            // Add markers for existing data
            this.updateMarkers();

            // Try to get user's location
            this.getUserLocation();

        } catch (error) {
            console.error('Error initializing map:', error);
            this.showMapPlaceholder();
        }
    }

    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    if (this.map) {
                        this.map.setCenter(userLocation);
                        this.map.setZoom(12);
                    }
                },
                (error) => {
                    console.log('Geolocation error:', error);
                    // Use default location or major city
                    this.setDefaultLocation();
                }
            );
        } else {
            this.setDefaultLocation();
        }
    }

    setDefaultLocation() {
        // Set to a major city as default
        const defaultCity = { lat: 40.7128, lng: -74.0060 }; // New York
        if (this.map) {
            this.map.setCenter(defaultCity);
            this.map.setZoom(10);
        }
    }

    async loadData() {
        try {
            // Load requests
            const requestsRef = database.ref('help-requests');
            const requestsSnapshot = await requestsRef.once('value');
            this.data.requests = requestsSnapshot.val() || {};

            // Load offers
            const offersRef = database.ref('help-offers');
            const offersSnapshot = await offersRef.once('value');
            this.data.offers = offersSnapshot.val() || {};

            // Load matches
            const matchesRef = database.ref('matches');
            const matchesSnapshot = await matchesRef.once('value');
            this.data.matches = matchesSnapshot.val() || {};

            if (this.isMapLoaded) {
                this.updateMarkers();
            }

        } catch (error) {
            console.error('Error loading map data:', error);
        }
    }

    updateMarkers() {
        if (!this.isMapLoaded || !this.map) return;

        // Clear existing markers
        this.clearMarkers();

        // Add request markers
        if (this.filters.showRequests) {
            Object.values(this.data.requests).forEach(request => {
                if (this.shouldDisplayItem(request, 'request')) {
                    this.createRequestMarker(request);
                }
            });
        }

        // Add offer markers
        if (this.filters.showOffers) {
            Object.values(this.data.offers).forEach(offer => {
                if (this.shouldDisplayItem(offer, 'offer')) {
                    this.createOfferMarker(offer);
                }
            });
        }

        // Add match markers
        if (this.filters.showMatches) {
            Object.values(this.data.matches).forEach(match => {
                this.createMatchMarker(match);
            });
        }
    }

    shouldDisplayItem(item, type) {
        // Filter by urgency (for requests)
        if (type === 'request' && this.filters.urgency !== 'all') {
            if (item.urgencyLevel !== this.filters.urgency) {
                return false;
            }
        }

        // Filter by category
        if (this.filters.category !== 'all') {
            if (type === 'request' && item.helpCategory !== this.filters.category) {
                return false;
            }
            if (type === 'offer' && !item.helpTypes.includes(this.filters.category)) {
                return false;
            }
        }

        return true;
    }

    async createRequestMarker(request) {
        try {
            const position = await this.geocodeAddress(request.location);
            if (!position) return;

            const marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: `Help Request: ${request.helpCategory}`,
                icon: this.getRequestIcon(request.urgencyLevel),
                animation: request.urgencyLevel === 'critical' ? google.maps.Animation.BOUNCE : null
            });

            marker.addListener('click', () => {
                this.showRequestInfo(marker, request);
            });

            this.markers.push(marker);

        } catch (error) {
            console.error('Error creating request marker:', error);
        }
    }

    async createOfferMarker(offer) {
        try {
            const position = await this.geocodeAddress(offer.providerLocation);
            if (!position) return;

            const marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: `Help Offer: ${offer.helpTypes.join(', ')}`,
                icon: this.getOfferIcon(),
            });

            marker.addListener('click', () => {
                this.showOfferInfo(marker, offer);
            });

            this.markers.push(marker);

        } catch (error) {
            console.error('Error creating offer marker:', error);
        }
    }

    async createMatchMarker(match) {
        try {
            const request = this.data.requests[match.requestId];
            const offer = this.data.offers[match.offerId];

            if (!request || !offer) return;

            const requestPosition = await this.geocodeAddress(request.location);
            const offerPosition = await this.geocodeAddress(offer.providerLocation);

            if (!requestPosition || !offerPosition) return;

            // Create line between matched request and offer
            const matchLine = new google.maps.Polyline({
                path: [requestPosition, offerPosition],
                geodesic: true,
                strokeColor: '#2ecc71',
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map: this.map
            });

            // Create match marker at midpoint
            const midpoint = {
                lat: (requestPosition.lat + offerPosition.lat) / 2,
                lng: (requestPosition.lng + offerPosition.lng) / 2
            };

            const marker = new google.maps.Marker({
                position: midpoint,
                map: this.map,
                title: `Match: ${match.matchScore}%`,
                icon: this.getMatchIcon(),
            });

            marker.addListener('click', () => {
                this.showMatchInfo(marker, match);
            });

            this.markers.push(marker);
            this.markers.push({ setMap: (map) => matchLine.setMap(map) }); // Add line to markers for clearing

        } catch (error) {
            console.error('Error creating match marker:', error);
        }
    }

    getRequestIcon(urgency) {
        const colors = {
            critical: '#ff4757',
            high: '#ff6b6b',
            medium: '#ffa502',
            low: '#26de81'
        };

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: colors[urgency] || colors.medium,
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
        };
    }

    getOfferIcon() {
        return {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: '#3498db',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6
        };
    }

    getMatchIcon() {
        return {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#2ecc71',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6
        };
    }

    showRequestInfo(marker, request) {
        const content = `
            <div class="info-window">
                <div class="info-header">
                    <h4>Help Request</h4>
                    <span class="urgency-badge urgency-${request.urgencyLevel}">${request.urgencyLevel}</span>
                </div>
                <div class="info-content">
                    <p><strong>Category:</strong> ${request.helpCategory}</p>
                    <p><strong>Requester:</strong> ${request.requesterName}</p>
                    <p><strong>Location:</strong> ${request.location}</p>
                    <p><strong>People Affected:</strong> ${request.peopleCount}</p>
                    <p><strong>Description:</strong> ${this.truncateText(request.description, 100)}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${request.status}">${request.status}</span></p>
                </div>
                <div class="info-actions">
                    <button class="btn btn-sm btn-primary" onclick="mapManager.contactRequester('${request.id}')">Contact</button>
                </div>
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    showOfferInfo(marker, offer) {
        const content = `
            <div class="info-window">
                <div class="info-header">
                    <h4>Help Offer</h4>
                </div>
                <div class="info-content">
                    <p><strong>Provider:</strong> ${offer.providerName}</p>
                    <p><strong>Type:</strong> ${offer.providerType}</p>
                    <p><strong>Help Types:</strong> ${offer.helpTypes.join(', ')}</p>
                    <p><strong>Location:</strong> ${offer.providerLocation}</p>
                    <p><strong>Availability:</strong> ${offer.availability}</p>
                    <p><strong>Capacity:</strong> ${offer.capacity}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${offer.status}">${offer.status}</span></p>
                </div>
                <div class="info-actions">
                    <button class="btn btn-sm btn-secondary" onclick="mapManager.contactProvider('${offer.id}')">Contact</button>
                </div>
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    showMatchInfo(marker, match) {
        const request = this.data.requests[match.requestId];
        const offer = this.data.offers[match.offerId];

        const content = `
            <div class="info-window">
                <div class="info-header">
                    <h4>Successful Match</h4>
                    <span class="match-score">${match.matchScore}%</span>
                </div>
                <div class="info-content">
                    <p><strong>Request:</strong> ${request?.helpCategory || 'Not found'}</p>
                    <p><strong>Offer:</strong> ${offer?.providerName || 'Not found'}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${match.status}">${match.status}</span></p>
                    <p><strong>Matched:</strong> ${new Date(match.timestamp).toLocaleDateString()}</p>
                </div>
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    contactRequester(requestId) {
        const request = this.data.requests[requestId];
        if (request && request.requesterPhone) {
            window.open(`tel:${request.requesterPhone}`);
        } else {
            alert('Contact information not available.');
        }
    }

    contactProvider(offerId) {
        const offer = this.data.offers[offerId];
        if (offer && offer.providerPhone) {
            window.open(`tel:${offer.providerPhone}`);
        } else {
            alert('Contact information not available.');
        }
    }

    async geocodeAddress(address) {
        if (!this.map) return null;

        try {
            // Simple geocoding using Google Maps Geocoder
            const geocoder = new google.maps.Geocoder();
            
            return new Promise((resolve, reject) => {
                geocoder.geocode({ address: address }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        resolve(results[0].geometry.location);
                    } else {
                        console.log('Geocoding failed for address:', address, status);
                        resolve(null);
                    }
                });
            });

        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    showDataList() {
        // Fallback display when map is not available
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        const requests = Object.values(this.data.requests);
        const offers = Object.values(this.data.offers);

        mapContainer.innerHTML = `
            <div class="data-list-container">
                <div class="data-section">
                    <h3><i class="fas fa-hand-paper"></i> Help Requests (${requests.length})</h3>
                    <div class="data-items">
                        ${requests.length === 0 ? 
                            '<p class="no-data">No help requests found.</p>' :
                            requests.map(request => `
                                <div class="data-item request-item">
                                    <div class="item-header">
                                        <strong>${request.helpCategory}</strong>
                                        <span class="urgency-badge urgency-${request.urgencyLevel}">${request.urgencyLevel}</span>
                                    </div>
                                    <p><strong>Requester:</strong> ${request.requesterName}</p>
                                    <p><strong>Location:</strong> ${request.location}</p>
                                    <p><strong>Description:</strong> ${this.truncateText(request.description, 100)}</p>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
                
                <div class="data-section">
                    <h3><i class="fas fa-heart"></i> Help Offers (${offers.length})</h3>
                    <div class="data-items">
                        ${offers.length === 0 ? 
                            '<p class="no-data">No help offers found.</p>' :
                            offers.map(offer => `
                                <div class="data-item offer-item">
                                    <div class="item-header">
                                        <strong>${offer.providerName}</strong>
                                        <span class="provider-type">${offer.providerType}</span>
                                    </div>
                                    <p><strong>Help Types:</strong> ${offer.helpTypes.join(', ')}</p>
                                    <p><strong>Location:</strong> ${offer.providerLocation}</p>
                                    <p><strong>Availability:</strong> ${offer.availability}</p>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        `;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    setupRealTimeUpdates() {
        // Listen for data changes
        database.ref('help-requests').on('value', () => {
            this.loadData();
        });

        database.ref('help-offers').on('value', () => {
            this.loadData();
        });

        database.ref('matches').on('value', () => {
            this.loadData();
        });
    }
}

// Global callback for Google Maps API
window.initMap = function() {
    if (window.mapManager) {
        window.mapManager.initializeMap();
    }
};

// Initialize map manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mapManager = new MapManager();
    window.mapManager = mapManager;
});

console.log('Map manager initialized');
