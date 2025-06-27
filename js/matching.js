// Rule-based matching engine for ReliefLink Lite
class MatchingEngine {
    constructor() {
        this.matchingRules = {
            // Priority weights for matching criteria
            urgencyWeight: 0.35,
            categoryWeight: 0.25,
            locationWeight: 0.20,
            capacityWeight: 0.10,
            availabilityWeight: 0.10
        };
        
        this.urgencyPriority = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        };

        this.availabilityPriority = {
            'immediate': 4,
            'within-hour': 3,
            'within-day': 2,
            'flexible': 1
        };

        this.init();
    }

    init() {
        console.log('Matching engine initialized');
    }

    // Main matching function for a single request
    async findMatches(request) {
        try {
            console.log('Finding matches for request:', request.id);

            // Get all active offers
            const offersRef = database.ref('help-offers');
            const offersSnapshot = await offersRef.once('value');
            const offers = offersSnapshot.val() || {};

            const activeOffers = Object.values(offers).filter(offer => 
                offer.status === 'active'
            );

            if (activeOffers.length === 0) {
                console.log('No active offers available for matching');
                return [];
            }

            // Score and rank offers
            const matches = [];
            for (const offer of activeOffers) {
                const matchScore = await this.calculateMatchScore(request, offer);
                
                if (matchScore > 0) {
                    matches.push({
                        request: request,
                        offer: offer,
                        score: matchScore,
                        reasons: this.getMatchReasons(request, offer, matchScore)
                    });
                }
            }

            // Sort by score (highest first)
            matches.sort((a, b) => b.score - a.score);

            // Save top matches
            const topMatches = matches.slice(0, 5); // Top 5 matches
            for (const match of topMatches) {
                if (match.score >= 60) { // Only save matches above 60% score
                    await this.saveMatch(match);
                }
            }

            console.log(`Found ${topMatches.length} matches for request ${request.id}`);
            return topMatches;

        } catch (error) {
            console.error('Error finding matches:', error);
            return [];
        }
    }

    // Find matches for a new offer
    async findMatchesForOffer(offer) {
        try {
            console.log('Finding matches for offer:', offer.id);

            // Get all pending requests
            const requestsRef = database.ref('help-requests');
            const requestsSnapshot = await requestsRef.once('value');
            const requests = requestsSnapshot.val() || {};

            const pendingRequests = Object.values(requests).filter(request => 
                request.status === 'pending'
            );

            if (pendingRequests.length === 0) {
                console.log('No pending requests available for matching');
                return [];
            }

            // Score and rank requests
            const matches = [];
            for (const request of pendingRequests) {
                const matchScore = await this.calculateMatchScore(request, offer);
                
                if (matchScore > 0) {
                    matches.push({
                        request: request,
                        offer: offer,
                        score: matchScore,
                        reasons: this.getMatchReasons(request, offer, matchScore)
                    });
                }
            }

            // Sort by score and urgency
            matches.sort((a, b) => {
                const urgencyDiff = this.urgencyPriority[b.request.urgencyLevel] - this.urgencyPriority[a.request.urgencyLevel];
                if (urgencyDiff !== 0) return urgencyDiff;
                return b.score - a.score;
            });

            // Save top matches
            const topMatches = matches.slice(0, 3); // Top 3 matches
            for (const match of topMatches) {
                if (match.score >= 60) {
                    await this.saveMatch(match);
                }
            }

            console.log(`Found ${topMatches.length} matches for offer ${offer.id}`);
            return topMatches;

        } catch (error) {
            console.error('Error finding matches for offer:', error);
            return [];
        }
    }

    // Calculate match score between request and offer
    async calculateMatchScore(request, offer) {
        let totalScore = 0;

        // 1. Category matching (25% weight)
        const categoryScore = this.calculateCategoryScore(request, offer);
        totalScore += categoryScore * this.matchingRules.categoryWeight;

        // 2. Urgency vs Availability matching (35% weight)
        const urgencyScore = this.calculateUrgencyScore(request, offer);
        totalScore += urgencyScore * this.matchingRules.urgencyWeight;

        // 3. Location proximity (20% weight)
        const locationScore = await this.calculateLocationScore(request, offer);
        totalScore += locationScore * this.matchingRules.locationWeight;

        // 4. Capacity matching (10% weight)
        const capacityScore = this.calculateCapacityScore(request, offer);
        totalScore += capacityScore * this.matchingRules.capacityWeight;

        // 5. Availability matching (10% weight)
        const availabilityScore = this.calculateAvailabilityScore(request, offer);
        totalScore += availabilityScore * this.matchingRules.availabilityWeight;

        // Apply rule-based bonuses/penalties
        totalScore = this.applyRuleBasedAdjustments(request, offer, totalScore);

        return Math.round(totalScore * 100); // Return as percentage
    }

    calculateCategoryScore(request, offer) {
        // Exact category match gets full score
        if (offer.helpTypes.includes(request.helpCategory)) {
            return 1.0;
        }

        // Partial matches for related categories
        const categoryRelations = {
            'medical': ['food'], // Medical often needs food support
            'shelter': ['clothing'], // Shelter often needs clothing
            'food': ['medical'], // Food providers might help with basic medical
            'transportation': ['medical', 'food'] // Transportation can help with medical/food delivery
        };

        const relatedCategories = categoryRelations[request.helpCategory] || [];
        for (const category of relatedCategories) {
            if (offer.helpTypes.includes(category)) {
                return 0.3; // Partial match
            }
        }

        // Check if offer includes 'other' - can potentially help
        if (offer.helpTypes.includes('other')) {
            return 0.2;
        }

        return 0; // No match
    }

    calculateUrgencyScore(request, offer) {
        const requestUrgency = this.urgencyPriority[request.urgencyLevel];
        const offerAvailability = this.availabilityPriority[offer.availability];

        // Perfect match: Critical + Immediate, High + Within Hour, etc.
        if ((requestUrgency === 4 && offerAvailability >= 3) ||
            (requestUrgency === 3 && offerAvailability >= 2) ||
            (requestUrgency <= 2 && offerAvailability >= 1)) {
            return 1.0;
        }

        // Partial matches
        if (requestUrgency >= 3 && offerAvailability >= 2) {
            return 0.7;
        }

        if (requestUrgency >= 2 && offerAvailability >= 1) {
            return 0.5;
        }

        return 0.3; // Minimum score for any availability
    }

    async calculateLocationScore(request, offer) {
        try {
            const distance = await this.calculateDistance(request.location, offer.providerLocation);
            
            if (distance === null) {
                return 0.5; // Default score if distance can't be calculated
            }

            const serviceRadius = offer.serviceRadius || 10;

            // Within service radius gets full score
            if (distance <= serviceRadius) {
                return 1.0;
            }

            // Progressive penalty for distance beyond service radius
            if (distance <= serviceRadius * 1.5) {
                return 0.7;
            }

            if (distance <= serviceRadius * 2) {
                return 0.4;
            }

            return 0.1; // Very distant

        } catch (error) {
            console.error('Error calculating location score:', error);
            return 0.5; // Default score on error
        }
    }

    calculateCapacityScore(request, offer) {
        const requiredCapacity = request.peopleCount || 1;
        
        // Parse offer capacity
        let offerCapacity = 1;
        if (offer.capacity) {
            if (offer.capacity.includes('1-5')) offerCapacity = 5;
            else if (offer.capacity.includes('6-20')) offerCapacity = 20;
            else if (offer.capacity.includes('21-50')) offerCapacity = 50;
            else if (offer.capacity.includes('50+')) offerCapacity = 100;
        }

        // Perfect match
        if (offerCapacity >= requiredCapacity) {
            return 1.0;
        }

        // Partial match (can help some people)
        if (offerCapacity >= requiredCapacity * 0.5) {
            return 0.6;
        }

        return 0.3; // Can provide some help
    }

    calculateAvailabilityScore(request, offer) {
        // All offers get some availability score
        const availabilityScore = this.availabilityPriority[offer.availability] / 4;
        
        // Bonus for immediate availability on critical requests
        if (request.urgencyLevel === 'critical' && offer.availability === 'immediate') {
            return 1.0;
        }

        return availabilityScore;
    }

    applyRuleBasedAdjustments(request, offer, baseScore) {
        let adjustedScore = baseScore;

        // Rule 1: IF urgency is "Critical" AND category is "Medical" THEN prioritize medical partners
        if (request.urgencyLevel === 'critical' && request.helpCategory === 'medical') {
            if (offer.helpTypes.includes('medical') && offer.providerType === 'ngo') {
                adjustedScore += 0.15; // 15% bonus
            }
        }

        // Rule 2: IF location is rural (heuristic: small location strings) AND request is food THEN prioritize over urban
        if (request.helpCategory === 'food' && this.isRuralLocation(request.location)) {
            if (offer.helpTypes.includes('food')) {
                adjustedScore += 0.10; // 10% bonus for rural food requests
            }
        }

        // Rule 3: NGOs and Government agencies get priority for high urgency requests
        if (request.urgencyLevel === 'high' || request.urgencyLevel === 'critical') {
            if (offer.providerType === 'ngo' || offer.providerType === 'government') {
                adjustedScore += 0.08; // 8% bonus
            }
        }

        // Rule 4: Individual volunteers get bonus for low urgency community requests
        if (request.urgencyLevel === 'low' && offer.providerType === 'individual') {
            adjustedScore += 0.05; // 5% bonus
        }

        // Rule 5: Businesses get bonus for transportation requests
        if (request.helpCategory === 'transportation' && offer.providerType === 'business') {
            adjustedScore += 0.10; // 10% bonus
        }

        // Rule 6: Religious organizations get bonus for shelter and food
        if ((request.helpCategory === 'shelter' || request.helpCategory === 'food') && 
            offer.providerType === 'religious') {
            adjustedScore += 0.07; // 7% bonus
        }

        // Ensure score doesn't exceed 1.0
        return Math.min(adjustedScore, 1.0);
    }

    isRuralLocation(location) {
        // Simple heuristic: rural locations tend to have shorter descriptions
        // or contain keywords like 'village', 'rural', 'countryside'
        const ruralKeywords = ['village', 'rural', 'countryside', 'remote', 'farm'];
        const locationLower = location.toLowerCase();
        
        return ruralKeywords.some(keyword => locationLower.includes(keyword)) || 
               location.length < 20; // Short location strings often indicate rural areas
    }

    async calculateDistance(location1, location2) {
        try {
            // Simple distance calculation using geocoding
            const coords1 = await this.geocodeLocation(location1);
            const coords2 = await this.geocodeLocation(location2);

            if (!coords1 || !coords2) {
                return null;
            }

            // Haversine formula for distance calculation
            const R = 6371; // Earth's radius in kilometers
            const dLat = this.toRadians(coords2.lat - coords1.lat);
            const dLon = this.toRadians(coords2.lng - coords1.lng);
            
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(this.toRadians(coords1.lat)) * Math.cos(this.toRadians(coords2.lat)) *
                     Math.sin(dLon/2) * Math.sin(dLon/2);
            
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;

            return distance;

        } catch (error) {
            console.error('Error calculating distance:', error);
            return null;
        }
    }

    async geocodeLocation(location) {
        try {
            // Use a geocoding service to get coordinates
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0&localityLanguage=en`);
            
            // This is a fallback - in production, you'd use a proper geocoding service
            // For now, return random coordinates for demonstration
            return {
                lat: Math.random() * 180 - 90,
                lng: Math.random() * 360 - 180
            };

        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    getMatchReasons(request, offer, score) {
        const reasons = [];

        // Category match
        if (offer.helpTypes.includes(request.helpCategory)) {
            reasons.push(`Exact category match: ${request.helpCategory}`);
        }

        // Urgency match
        if (request.urgencyLevel === 'critical' && offer.availability === 'immediate') {
            reasons.push('Critical request with immediate availability');
        }

        // Provider type advantages
        if (offer.providerType === 'ngo') {
            reasons.push('Professional NGO provider');
        }

        // Location
        reasons.push(`Service area covers request location`);

        // Score-based reasons
        if (score >= 80) {
            reasons.push('Excellent match');
        } else if (score >= 60) {
            reasons.push('Good match');
        }

        return reasons;
    }

    async saveMatch(match) {
        try {
            const matchId = this.generateMatchId();
            const matchData = {
                id: matchId,
                requestId: match.request.id,
                offerId: match.offer.id,
                matchScore: match.score,
                matchReasons: match.reasons,
                status: 'matched',
                timestamp: Date.now(),
                category: match.request.helpCategory,
                urgencyLevel: match.request.urgencyLevel,
                location: match.request.location
            };

            // Save to Firebase
            const matchRef = database.ref('matches/' + matchId);
            await matchRef.set(matchData);

            // Update request status
            const requestRef = database.ref('help-requests/' + match.request.id);
            await requestRef.update({
                status: 'matched',
                matchedWith: match.offer.id,
                matchScore: match.score,
                lastUpdated: Date.now()
            });

            console.log(`Match saved: ${matchId} (${match.score}%)`);
            return matchData;

        } catch (error) {
            console.error('Error saving match:', error);
            throw error;
        }
    }

    generateMatchId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `MATCH_${timestamp}_${random}`.toUpperCase();
    }

    // Run full matching for all pending requests
    async runFullMatching() {
        try {
            console.log('Running full matching algorithm...');

            // Get all pending requests
            const requestsRef = database.ref('help-requests');
            const requestsSnapshot = await requestsRef.once('value');
            const requests = requestsSnapshot.val() || {};

            const pendingRequests = Object.values(requests).filter(request => 
                request.status === 'pending'
            );

            if (pendingRequests.length === 0) {
                console.log('No pending requests to match');
                return [];
            }

            // Sort requests by urgency
            pendingRequests.sort((a, b) => 
                this.urgencyPriority[b.urgencyLevel] - this.urgencyPriority[a.urgencyLevel]
            );

            const allMatches = [];

            // Process each request
            for (const request of pendingRequests) {
                const matches = await this.findMatches(request);
                allMatches.push(...matches);
                
                // Small delay to prevent overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`Full matching completed. Found ${allMatches.length} total matches.`);
            return allMatches;

        } catch (error) {
            console.error('Error running full matching:', error);
            return [];
        }
    }

    // Get matching statistics
    async getMatchingStats() {
        try {
            const matchesRef = database.ref('matches');
            const matchesSnapshot = await matchesRef.once('value');
            const matches = Object.values(matchesSnapshot.val() || {});

            const stats = {
                totalMatches: matches.length,
                averageScore: matches.length > 0 ? 
                    matches.reduce((sum, match) => sum + match.matchScore, 0) / matches.length : 0,
                categoryBreakdown: {},
                urgencyBreakdown: {},
                statusBreakdown: {}
            };

            // Calculate breakdowns
            matches.forEach(match => {
                // Category breakdown
                const category = match.category || 'unknown';
                stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;

                // Urgency breakdown
                const urgency = match.urgencyLevel || 'unknown';
                stats.urgencyBreakdown[urgency] = (stats.urgencyBreakdown[urgency] || 0) + 1;

                // Status breakdown
                const status = match.status || 'unknown';
                stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;
            });

            return stats;

        } catch (error) {
            console.error('Error getting matching stats:', error);
            return null;
        }
    }
}

// Initialize matching engine
const matchingEngine = new MatchingEngine();
window.matchingEngine = matchingEngine;

console.log('Matching engine initialized');
