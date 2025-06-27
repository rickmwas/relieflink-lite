// Forms Manager for ReliefLink Lite with Supabase
// Handles help requests and offers for Kenyan humanitarian aid app

class FormsManager {
    constructor() {
        this.init();
    }

    async init() {
        try {
            // Wait for Supabase to be ready
            await this.waitForSupabase();
            
            this.setupRequestForm();
            this.setupOfferForm();
            this.setupGeolocation();
            
            console.log('Forms manager initialized with Supabase');
        } catch (error) {
            console.error('Forms initialization error:', error);
        }
    }

    async waitForSupabase() {
        let attempts = 0;
        while (!window.database && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (!window.database) {
            throw new Error('Supabase database not available');
        }
    }

    setupRequestForm() {
        const requestForm = document.getElementById('help-request-form');
        if (requestForm) {
            requestForm.addEventListener('submit', (e) => this.handleRequestSubmission(e));
        }
    }

    setupOfferForm() {
        const offerForm = document.getElementById('help-offer-form');
        if (offerForm) {
            offerForm.addEventListener('submit', (e) => this.handleOfferSubmission(e));
        }
    }

    setupGeolocation() {
        const locationBtns = document.querySelectorAll('.get-location-btn');
        locationBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.getCurrentLocation(btn));
        });
    }

    async handleRequestSubmission(form) {
        try {
            // Check if user is logged in
            if (!window.authManager || !window.authManager.getCurrentUser()) {
                alert('Please sign in to submit a help request');
                window.authManager.showLoginModal();
                return;
            }

            const formData = new FormData(form.target);
            const requestData = {
                requester_id: window.authManager.getCurrentUser().id,
                requester_name: formData.get('requesterName'),
                phone_number: formData.get('phoneNumber'),
                help_category: formData.get('helpCategory'),
                urgency_level: formData.get('urgencyLevel'),
                description: formData.get('description'),
                location: formData.get('location'),
                people_count: parseInt(formData.get('peopleCount')) || 1
            };

            // Add coordinates if available
            const latInput = document.getElementById('latitude');
            const lngInput = document.getElementById('longitude');
            if (latInput && lngInput && latInput.value && lngInput.value) {
                requestData.latitude = parseFloat(latInput.value);
                requestData.longitude = parseFloat(lngInput.value);
            }

            // Validate required fields
            const validation = this.validateRequestData(requestData);
            if (!validation.isValid) {
                alert(validation.message);
                return;
            }

            showLoading('Submitting your help request...');

            // Submit to Supabase
            const savedRequest = await window.database.createHelpRequest(requestData);
            
            hideLoading();

            // Show success message with request ID
            this.showSuccessModal(
                'Your help request has been submitted successfully! Our system will automatically match you with nearby aid providers.',
                savedRequest.id,
                'request'
            );

            // Reset form
            form.target.reset();

            // Log activity
            this.logActivity('request_created', `New ${requestData.urgency_level} urgency ${requestData.help_category} request in ${requestData.location}`, savedRequest.id);

            // Try to find immediate matches
            this.findMatchesForRequest(savedRequest);

        } catch (error) {
            hideLoading();
            console.error('Error submitting help request:', error);
            alert('Failed to submit help request: ' + error.message);
        }
    }

    async handleOfferSubmission(form) {
        try {
            // Check if user is logged in
            if (!window.authManager || !window.authManager.getCurrentUser()) {
                alert('Please sign in to register as a help provider');
                window.authManager.showLoginModal();
                return;
            }

            const formData = new FormData(form.target);
            
            // Get selected help types
            const helpTypes = [];
            const helpTypeChecks = form.target.querySelectorAll('input[name="helpTypes"]:checked');
            helpTypeChecks.forEach(checkbox => helpTypes.push(checkbox.value));

            const offerData = {
                provider_id: window.authManager.getCurrentUser().id,
                provider_name: formData.get('providerName'),
                phone_number: formData.get('phoneNumber'),
                provider_type: formData.get('providerType'),
                help_types: helpTypes,
                provider_location: formData.get('providerLocation'),
                capacity: parseInt(formData.get('capacity')) || 1,
                availability: formData.get('availability'),
                service_radius: parseInt(formData.get('serviceRadius')) || 10,
                description: formData.get('description') || ''
            };

            // Add coordinates if available
            const latInput = document.getElementById('provider-latitude');
            const lngInput = document.getElementById('provider-longitude');
            if (latInput && lngInput && latInput.value && lngInput.value) {
                offerData.latitude = parseFloat(latInput.value);
                offerData.longitude = parseFloat(lngInput.value);
            }

            // Validate required fields
            const validation = this.validateOfferData(offerData);
            if (!validation.isValid) {
                alert(validation.message);
                return;
            }

            showLoading('Registering your help offer...');

            // Submit to Supabase
            const savedOffer = await window.database.createHelpOffer(offerData);
            
            hideLoading();

            // Show success message
            this.showSuccessModal(
                'Thank you for registering as a help provider! We will notify you when people in your area need assistance.',
                savedOffer.id,
                'offer'
            );

            // Reset form
            form.target.reset();

            // Log activity
            this.logActivity('offer_created', `New ${offerData.provider_type} offering ${offerData.help_types.join(', ')} in ${offerData.provider_location}`, savedOffer.id);

            // Try to find immediate matches
            this.findMatchesForOffer(savedOffer);

        } catch (error) {
            hideLoading();
            console.error('Error submitting help offer:', error);
            alert('Failed to register help offer: ' + error.message);
        }
    }

    validateRequestData(data) {
        if (!data.requester_name || data.requester_name.trim().length < 2) {
            return { isValid: false, message: 'Please enter your full name' };
        }
        
        if (!data.phone_number || data.phone_number.trim().length < 10) {
            return { isValid: false, message: 'Please enter a valid phone number' };
        }
        
        if (!data.help_category) {
            return { isValid: false, message: 'Please select a help category' };
        }
        
        if (!data.urgency_level) {
            return { isValid: false, message: 'Please select urgency level' };
        }
        
        if (!data.description || data.description.trim().length < 10) {
            return { isValid: false, message: 'Please provide a detailed description (at least 10 characters)' };
        }
        
        if (!data.location || data.location.trim().length < 3) {
            return { isValid: false, message: 'Please enter your location' };
        }
        
        if (data.people_count < 1 || data.people_count > 1000) {
            return { isValid: false, message: 'Number of people must be between 1 and 1000' };
        }
        
        return { isValid: true };
    }

    validateOfferData(data) {
        if (!data.provider_name || data.provider_name.trim().length < 2) {
            return { isValid: false, message: 'Please enter your full name or organization name' };
        }
        
        if (!data.phone_number || data.phone_number.trim().length < 10) {
            return { isValid: false, message: 'Please enter a valid phone number' };
        }
        
        if (!data.provider_type) {
            return { isValid: false, message: 'Please select your provider type' };
        }
        
        if (!data.help_types || data.help_types.length === 0) {
            return { isValid: false, message: 'Please select at least one type of help you can provide' };
        }
        
        if (!data.provider_location || data.provider_location.trim().length < 3) {
            return { isValid: false, message: 'Please enter your location' };
        }
        
        if (!data.availability) {
            return { isValid: false, message: 'Please select your availability' };
        }
        
        if (data.capacity < 1 || data.capacity > 10000) {
            return { isValid: false, message: 'Capacity must be between 1 and 10,000' };
        }
        
        if (data.service_radius < 1 || data.service_radius > 500) {
            return { isValid: false, message: 'Service radius must be between 1 and 500 kilometers' };
        }
        
        return { isValid: true };
    }

    showSuccessModal(message, id, type) {
        const modal = document.createElement('div');
        modal.className = 'modal success-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Success!</h3>
                <p>${message}</p>
                <div class="success-details">
                    <p><strong>Reference ID:</strong> ${id.substr(0, 8)}</p>
                    <p>Keep this ID for your records</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="window.location.href='index.html'">Go to Homepage</button>
                    ${type === 'request' ? 
                        '<button class="btn btn-secondary" onclick="window.location.href=\'map.html\'">View on Map</button>' :
                        '<button class="btn btn-secondary" onclick="window.location.href=\'admin.html\'">View Dashboard</button>'
                    }
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.appendChild(modal);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            modal.remove();
        }, 10000);
    }

    async getCurrentLocation(button) {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser');
            return;
        }

        const originalText = button.textContent;
        button.textContent = 'Getting location...';
        button.disabled = true;

        try {
            const position = await this.getPosition();
            const { latitude, longitude } = position.coords;

            // Update hidden coordinate inputs
            const latInput = button.closest('form').querySelector('input[name*="latitude"], input[id*="latitude"]');
            const lngInput = button.closest('form').querySelector('input[name*="longitude"], input[id*="longitude"]');
            
            if (latInput) latInput.value = latitude;
            if (lngInput) lngInput.value = longitude;

            // Reverse geocode to get address
            const address = await this.reverseGeocode(latitude, longitude);
            
            // Update location input
            const locationInput = button.closest('.form-group').querySelector('input[type="text"]');
            if (locationInput && address) {
                locationInput.value = address;
            }

            button.textContent = '✓ Location Found';
            button.style.backgroundColor = '#27ae60';
            
        } catch (error) {
            console.error('Geolocation error:', error);
            alert('Unable to get your location: ' + error.message);
            button.textContent = originalText;
        } finally {
            button.disabled = false;
            
            // Reset button after 3 seconds
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
            }, 3000);
        }
    }

    getPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });
    }

    async reverseGeocode(lat, lng) {
        try {
            // Use a free geocoding service (you can replace with Google Maps API if you have a key)
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            const data = await response.json();
            
            if (data.city && data.countryName) {
                return `${data.city}, ${data.principalSubdivision || ''}, ${data.countryName}`.replace(', ,', ',').trim();
            }
            
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    }

    async findMatchesForRequest(request) {
        try {
            const matches = await window.database.findMatchingOffers(request);
            if (matches.length > 0) {
                console.log(`Found ${matches.length} potential matches for request ${request.id}`);
                // You could implement automatic matching logic here
            }
        } catch (error) {
            console.error('Error finding matches for request:', error);
        }
    }

    async findMatchesForOffer(offer) {
        try {
            // Find requests that match this offer's help types
            const { data: matchingRequests } = await window.supabase
                .from('help_requests')
                .select('*')
                .eq('status', 'active')
                .in('help_category', offer.help_types);
            
            if (matchingRequests && matchingRequests.length > 0) {
                console.log(`Found ${matchingRequests.length} potential matches for offer ${offer.id}`);
                // You could implement automatic matching logic here
            }
        } catch (error) {
            console.error('Error finding matches for offer:', error);
        }
    }

    async logActivity(type, description, relatedId) {
        try {
            const user = window.authManager ? window.authManager.getCurrentUser() : null;
            
            await window.supabase
                .from('activity_log')
                .insert([{
                    user_id: user ? user.id : null,
                    activity_type: type,
                    description: description,
                    related_id: relatedId
                }]);
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }
}

// Initialize forms manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.formsManager = new FormsManager();
});

console.log('Supabase Forms system ready for ReliefLink Lite');