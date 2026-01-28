// Shopping Cart Management
const cart = {
    items: [],
    
    init() {
        this.loadFromStorage();
        this.updateCartDisplay();
        console.log('✓ Cart initialized with', this.items.length, 'items');
    },
    
    loadFromStorage() {
        const saved = localStorage.getItem('shoppingCart');
        this.items = saved ? JSON.parse(saved) : [];
    },
    
    saveToStorage() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.items));
    },
    
    addItem(product) {
        console.log('Adding to cart:', product);
        if (!product || !product.id) {
            console.error('Invalid product:', product);
            return;
        }
        const existing = this.items.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += product.quantity || 1;
            console.log('Updated quantity for product', product.id, ':', existing.quantity);
        } else {
            this.items.push({ ...product, quantity: product.quantity || 1 });
            console.log('Added new product to cart:', product.id);
        }
        this.saveToStorage();
        this.updateCartDisplay();
        console.log('Cart now has', this.getTotalItems(), 'items');
    },
    
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        this.updateCartDisplay();
    },
    
    getTotalItems() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    
    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = this.getTotalItems();
        }
    }
};

// Make cart globally available
window.cart = cart;

// Wishlist Management with Supabase Sync
const wishlist = {
    items: [],
    supabaseClient: null,
    currentUserId: null,
    isSyncing: false,
    
    init() {
        this.loadFromStorage();
        console.log('✓ Wishlist initialized with', this.items.length, 'items');
    },
    
    setSupabase(client, userId) {
        this.supabaseClient = client;
        this.currentUserId = userId;
        console.log('✓ Wishlist Supabase sync enabled for user:', userId);
        // Sync on init
        this.syncFromSupabase();
    },
    
    loadFromStorage() {
        const saved = localStorage.getItem('userWishlist');
        this.items = saved ? JSON.parse(saved) : [];
    },
    
    saveToStorage() {
        localStorage.setItem('userWishlist', JSON.stringify(this.items));
    },
    
    async syncFromSupabase() {
        if (!this.supabaseClient || !this.currentUserId) {
            console.warn('Cannot sync: missing supabaseClient or userId');
            return;
        }
        
        if (this.isSyncing) {
            console.log('Sync already in progress, skipping...');
            return;
        }
        
        this.isSyncing = true;
        try {
            console.log('Fetching wishlist from Supabase for user:', this.currentUserId);
            const { data, error } = await this.supabaseClient
                .from('wishlist')
                .select('*')
                .eq('user_id', this.currentUserId);
            
            if (error) {
                console.error('Supabase query error:', error);
                throw error;
            }
            
            console.log('Fetched items from Supabase:', data);
            
            // Convert Supabase data to local format
            this.items = (data || []).map(item => ({
                id: item.product_id,
                name: item.product_name,
                price: item.price,
                image_url: item.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E',
                description: item.description || 'Product'
            }));
            this.saveToStorage();
            console.log('✓ Wishlist synced from Supabase:', this.items.length, 'items');
        } catch (error) {
            console.error('Error syncing wishlist from Supabase:', error.message);
        } finally {
            this.isSyncing = false;
        }
    },
    
    async addItem(product) {
        console.log('Adding to wishlist:', product);
        if (!product || !product.id) {
            console.error('Invalid product:', product);
            return false;
        }
        
        const exists = this.items.find(item => item.id === product.id);
        if (exists) {
            console.log('Product already in wishlist:', product.id);
            return false;
        }
        
        // Add to local storage immediately
        this.items.push(product);
        this.saveToStorage();
        console.log('✓ Added to local wishlist:', product.name);
        
        // Sync to Supabase if authenticated
        if (this.supabaseClient && this.currentUserId) {
            try {
                console.log('🔄 Syncing to Supabase...');
                console.log('   User ID:', this.currentUserId);
                console.log('   Product:', { id: product.id, name: product.name });
                
                const insertData = {
                    user_id: this.currentUserId,
                    product_id: product.id,
                    product_name: product.name,
                    price: product.price,
                    image_url: product.image_url || product.image || '',
                    description: product.description || 'Product'
                };
                
                console.log('   Inserting:', insertData);
                
                const { data, error } = await this.supabaseClient
                    .from('wishlist')
                    .insert([insertData])
                    .select();
                
                if (error) {
                    console.error('❌ Supabase insert ERROR:', error.message, error.details, error.hint);
                    throw error;
                }
                console.log('✅ Successfully added to Supabase wishlist:', data);
            } catch (error) {
                console.error('❌ Error adding to Supabase wishlist:', error.message);
                // Item is already in localStorage, so it's not totally lost
                // But we should alert the user
                alert('⚠️ Item added locally but sync to server failed. This might be a permissions issue.');
            }
        } else {
            console.warn('⚠️ Wishlist not synced (no Supabase client or user ID)');
            console.log('   supabaseClient:', this.supabaseClient ? 'exists' : 'missing');
            console.log('   currentUserId:', this.currentUserId ? 'exists' : 'missing');
        }
        
        return true;
    },
    
    async removeItem(productId) {
        console.log('Removing from wishlist:', productId);
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        console.log('✓ Removed from local wishlist:', productId);
        
        // Remove from Supabase if authenticated
        if (this.supabaseClient && this.currentUserId) {
            try {
                console.log('🔄 Syncing removal to Supabase...');
                console.log('   User ID:', this.currentUserId);
                console.log('   Product ID:', productId);
                
                const { error } = await this.supabaseClient
                    .from('wishlist')
                    .delete()
                    .eq('user_id', this.currentUserId)
                    .eq('product_id', productId);
                
                if (error) {
                    console.error('❌ Supabase delete ERROR:', error.message, error.details, error.hint);
                    throw error;
                }
                console.log('✅ Successfully removed from Supabase wishlist:', productId);
            } catch (error) {
                console.error('❌ Error removing from Supabase wishlist:', error.message);
                // Item is already removed from localStorage, so it's okay
            }
        } else {
            console.warn('⚠️ Wishlist not synced (no Supabase client or user ID)');
        }
    },
    
    isInWishlist(productId) {
        return this.items.some(item => item.id === productId);
    },
    
    getTotalItems() {
        return this.items.length;
    }
};

// Make wishlist globally available
window.wishlist = wishlist;

// Load components
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        const content = await response.text();
        const element = document.getElementById(elementId);
        element.innerHTML = content;
        
        // Execute any scripts in the loaded content
        const scripts = element.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            script.parentNode.replaceChild(newScript, script);
        });
        
        return true;
    } catch (error) {
        console.error('Error loading component:', filePath, error);
        return false;
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
    cart.init();
    wishlist.init();
    
    // Load navbar first
    await loadComponent("navbar-placeholder", "components/navbar.html");
    
    // After navbar loads, update auth display and hide search if needed
    setTimeout(() => {
        console.log('Calling updateNavbarAuth after navbar load');
        if (window.updateNavbarAuth) {
            window.updateNavbarAuth();
        }
        if (window.hideSearchIconIfNeeded) {
            window.hideSearchIconIfNeeded();
        }
    }, 100);
    
    // Load footer
    loadComponent("footer-placeholder", "components/footer.html");
    
    // Handle "Shop Now" button
    const shopBtn = document.querySelector('.hero button');
    if (shopBtn) {
        shopBtn.addEventListener('click', () => {
            window.location.href = 'products.html';
        });
    }
});

// Also check auth state periodically
setInterval(() => {
    if (window.updateNavbarAuth) {
        window.updateNavbarAuth();
    }
}, 1000);
