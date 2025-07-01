// Supabase Configuration for ReliefLink Lite
// Replace Firebase with Supabase for the Kenyan humanitarian aid app

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase configuration - Replace with your project details
const supabaseUrl = 'https://nvhfmkoegzjpicngbyew.supabase.co' // e.g., https://nvhfmkoegzjpicngbyew.supabase.co
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52aGZta29lZ3pqcGljbmdieWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNTcxMjEsImV4cCI6MjA2NjYzMzEyMX0.uwVPEx55-4toXL7IF87m8PJeG0dGyHTFnlvOqmEkl80' // Your public anon key

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database service - replaces Firebase Realtime Database
class SupabaseDatabase {
    async getHelpRequests() {
        try {
            const { data, error } = await supabase
                .from('help_requests')
                .select('*')
                .order('created_at', { ascending: false })
            
            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching help requests:', error)
            return []
        }
    }

    async getHelpOffers() {
        try {
            const { data, error } = await supabase
                .from('help_offers')
                .select('*')
                .order('created_at', { ascending: false })
            
            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching help offers:', error)
            return []
        }
    }

    async createHelpRequest(requestData) {
        try {
            const { data, error } = await supabase
                .from('help_requests')
                .insert([{
                    ...requestData,
                    created_at: new Date().toISOString(),
                    status: 'active'
                }])
                .select()
            
            if (error) throw error
            return data[0]
        } catch (error) {
            console.error('Error creating help request:', error)
            throw error
        }
    }

    async createHelpOffer(offerData) {
        try {
            const { data, error } = await supabase
                .from('help_offers')
                .insert([{
                    ...offerData,
                    created_at: new Date().toISOString(),
                    status: 'active'
                }])
                .select()
            
            if (error) throw error
            return data[0]
        } catch (error) {
            console.error('Error creating help offer:', error)
            throw error
        }
    }

    async updateRequestStatus(requestId, status) {
        try {
            const { data, error } = await supabase
                .from('help_requests')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', requestId)
                .select()
            
            if (error) throw error
            return data[0]
        } catch (error) {
            console.error('Error updating request status:', error)
            throw error
        }
    }

    async updateOfferStatus(offerId, status) {
        try {
            const { data, error } = await supabase
                .from('help_offers')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', offerId)
                .select()
            
            if (error) throw error
            return data[0]
        } catch (error) {
            console.error('Error updating offer status:', error)
            throw error
        }
    }

    // Real-time subscriptions for live updates
    subscribeToRequests(callback) {
        return supabase
            .channel('help_requests')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'help_requests'
            }, callback)
            .subscribe()
    }

    subscribeToOffers(callback) {
        return supabase
            .channel('help_offers')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'help_offers'
            }, callback)
            .subscribe()
    }

    // Matching logic - find offers for a request
    async findMatchingOffers(request) {
        try {
            const { data, error } = await supabase
                .from('help_offers')
                .select('*')
                .eq('status', 'active')
                .contains('help_types', [request.help_category])
                .order('created_at', { ascending: false })
            
            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error finding matching offers:', error)
            return []
        }
    }

    // Admin functions
    async setUserAsAdmin(userId) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .upsert([{
                    user_id: userId,
                    is_admin: true,
                    updated_at: new Date().toISOString()
                }])
                .select()
            
            if (error) throw error
            return data[0]
        } catch (error) {
            console.error('Error setting admin status:', error)
            throw error
        }
    }

    async checkAdminStatus(userId) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('is_admin')
                .eq('user_id', userId)
                .single()
            
            if (error && error.code !== 'PGRST116') throw error
            return data?.is_admin || false
        } catch (error) {
            console.error('Error checking admin status:', error)
            return false
        }
    }
}

// Authentication service - replaces Firebase Auth
class SupabaseAuth {
    constructor() {
        this.currentUser = null
        this.isAdmin = false
        this.listeners = []
    }

    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            })
            
            if (error) throw error
            return data
        } catch (error) {
            console.error('Sign up error:', error)
            throw error
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            
            if (error) throw error
            this.currentUser = data.user
            this.notifyListeners(data.user)
            
            // Check if first user (auto-admin)
            await this.checkFirstUserAdmin()
            
            return data
        } catch (error) {
            console.error('Sign in error:', error)
            throw error
        }
    }

    async signInWithGoogle() {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            
            this.currentUser = null
            this.isAdmin = false
            this.notifyListeners(null)
        } catch (error) {
            console.error('Sign out error:', error)
            throw error
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            this.currentUser = user
            
            if (user) {
                this.isAdmin = await database.checkAdminStatus(user.id)
            }
            
            return user
        } catch (error) {
            console.error('Get user error:', error)
            return null
        }
    }

    onAuthStateChange(callback) {
        this.listeners.push(callback)
        
        // Set up Supabase auth listener
        supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser = session?.user || null
            this.notifyListeners(this.currentUser)
        })
        
        // Return current user immediately
        callback(this.currentUser)
    }

    notifyListeners(user) {
        this.listeners.forEach(callback => callback(user))
    }

    async checkFirstUserAdmin() {
        if (!this.currentUser) return
        
        try {
            // Check if any admins exist
            const { data: existingAdmins, error } = await supabase
                .from('user_profiles')
                .select('user_id')
                .eq('is_admin', true)
                .limit(1)
            
            if (error) throw error
            
            // If no admins exist, make this user an admin
            if (!existingAdmins || existingAdmins.length === 0) {
                await database.setUserAsAdmin(this.currentUser.id)
                this.isAdmin = true
                console.log('First user - auto-assigned as admin')
            }
        } catch (error) {
            console.error('Error checking first user admin:', error)
        }
    }
}

// Initialize services
const database = new SupabaseDatabase()
const auth = new SupabaseAuth()

// Export for global use (replaces Firebase globals)
window.supabase = supabase
window.database = database
window.auth = auth

// Legacy compatibility for Firebase migration
window.isDemoMode = false

console.log('Supabase initialized for ReliefLink Lite - Ready for Kenya deployment!')

export { supabase, database, auth }