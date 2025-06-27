// Form handling for requests and offers
class FormsManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupRequestForm();
        this.setupOfferForm();
        this.setupGeolocation();
    }

    setupRequestForm() {
        const requestForm = document.getElementById('request-help-form');
        if (!requestForm) return;

        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRequestSubmission(requestForm);
        });
    }

    setupOfferForm() {
        const offerForm = document.getElementById('offer-help-form');
        if (!offerForm) return;

        offerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleOfferSubmission(offerForm);
        });
    }

    setupGeolocation() {
        const locationBtns = document.querySelectorAll('#get-location-btn');
        locationBtns.forEach(btn => {
            btn.addEventListener('click', () => this.getCurrentLocation(btn));
        });
    }

    async handleRequestSubmission(form) {
        try {
            showLoading('Submitting help request...');

            // Get form data
            const formData = new FormData(form);
            const requestData = {
                id: this.generateId('REQ'),
                requesterName: formData.get('requesterName'),
                requesterPhone: formData.get('requesterPhone'),
                helpCategory: formData.get('helpCategory'),
                urgencyLevel: formData.get('urgencyLevel'),
                location: formData.get('location'),
                description: formData.get('description'),
                peopleCount: parseInt(formData.get('peopleCount')) || 1,
                status: 'pending',
                timestamp: Date.now(),
                submittedBy: authManager.getCurrentUser()?.uid || 'anonymous'
            };

            // Validate required fields
            if (!this.validateRequestData(requestData)) {
                hideLoading();
                return;
            }

            // Save to Firebase
            const requestRef = database.ref('help-requests/' + requestData.id);
            await requestRef.set(requestData);

            // Show success message
            hideLoading();
            this.showSuccessModal('Request submitted successfully!', requestData.id);
            
            // Reset form
            form.reset();

            // Trigger matching algorithm
            if (window.matchingEngine) {
                setTimeout(() => {
                    window.matchingEngine.findMatches(requestData);
                }, 1000);
            }

        } catch (error) {
            console.error('Error submitting request:', error);
            hideLoading();
            alert('Failed to submit request: ' + error.message);
        }
    }

    async handleOfferSubmission(form) {
        try {
            showLoading('Registering help offer...');

            // Get form data
            const formData = new FormData(form);
            const helpTypes = Array.from(form.querySelectorAll('input[name="helpTypes"]:checked'))
                .map(cb => cb.value);

            const offerData = {
                id: this.generateId('OFF'),
                providerName: formData.get('providerName'),
                providerPhone: formData.get('providerPhone'),
                providerEmail: formData.get('providerEmail'),
                providerType: formData.get('providerType'),
                helpTypes: helpTypes,
                providerLocation: formData.get('providerLocation'),
                serviceRadius: parseInt(formData.get('serviceRadius')) || 10,
                availability: formData.get('availability'),
                capacity: formData.get('capacity'),
                additionalInfo: formData.get('additionalInfo'),
                status: 'active',
                timestamp: Date.now(),
                submittedBy: authManager.getCurrentUser()?.uid || 'anonymous'
            };

            // Validate required fields
            if (!this.validateOfferData(offerData)) {
                hideLoading();
                return;
            }

            // Save to Firebase
            const offerRef = database.ref('help-offers/' + offerData.id);
            await offerRef.set(offerData);

            // Show success message
            hideLoading();
            this.showSuccessModal('Offer registered successfully!', offerData.id, 'offer');
            
            // Reset form
            form.reset();

            // Trigger matching algorithm
            if (window.matchingEngine) {
                setTimeout(() => {
                    window.matchingEngine.findMatchesForOffer(offerData);
                }, 1000);
            }

        } catch (error) {
            console.error('Error submitting offer:', error);
            hideLoading();
            alert('Failed to submit offer: ' + error.message);
        }
    }

    validateRequestData(data) {
        const required = ['requesterName', 'requesterPhone', 'helpCategory', 'urgencyLevel', 'location', 'description'];
        
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
                return false;
            }
        }

        // Validate phone number
        if (!/^\+?[\d\s\-\(\)]{10,}$/.test(data.requesterPhone)) {
            alert('Please enter a valid phone number.');
            return false;
        }

        return true;
    }

    validateOfferData(data) {
        const required = ['providerName', 'providerPhone', 'providerType', 'providerLocation', 'availability'];
        
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
                return false;
            }
        }

        // Validate phone number
        if (!/^\+?[\d\s\-\(\)]{10,}$/.test(data.providerPhone)) {
            alert('Please enter a valid phone number.');
            return false;
        }

        // Validate email if provided
        if (data.providerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.providerEmail)) {
            alert('Please enter a valid email address.');
            return false;
        }

        // Validate help types
        if (!data.helpTypes || data.helpTypes.length === 0) {
            alert('Please select at least one type of help you can provide.');
            return false;
        }

        return true;
    }

    generateId(prefix) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}_${timestamp}_${random}`.toUpperCase();
    }

    showSuccessModal(message, id, type = 'request') {
        const modal = document.getElementById('success-modal');
        if (!modal) return;

        const modalBody = modal.querySelector('.modal-body p');
        const idField = modal.querySelector(`#generated-${type}-id`);
        
        if (modalBody) modalBody.textContent = message;
        if (idField) idField.textContent = id;
        
        showModal('success-modal');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            closeModal('success-modal');
        }, 5000);
    }

    async getCurrentLocation(button) {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }

        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
        button.disabled = true;

        try {
            const position = await this.getPosition();
            const address = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
            
            // Find the location input field
            const locationInput = button.parentElement.querySelector('input[name="location"], input[name="providerLocation"]');
            if (locationInput) {
                locationInput.value = address;
            }
            
        } catch (error) {
            console.error('Error getting location:', error);
            alert('Failed to get location: ' + error.message);
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    getPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        });
    }

    async reverseGeocode(lat, lng) {
        try {
            // Using a simple reverse geocoding service
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            const data = await response.json();
            
            if (data.locality && data.countryName) {
                return `${data.locality}, ${data.principalSubdivision || ''} ${data.countryName}`.trim();
            } else {
                return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    }
}

// Initialize forms manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const formsManager = new FormsManager();
    window.formsManager = formsManager;
});

console.log('Forms manager initialized');
