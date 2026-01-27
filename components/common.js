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

// Load components
async function loadComponent(elementId, filePath) {
    const response = await fetch(filePath);
    const content = await response.text();
    document.getElementById(elementId).innerHTML = content;
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    cart.init();
    loadComponent("navbar-placeholder", "components/navbar.html");
    loadComponent("footer-placeholder", "components/footer.html");
    
    // Handle "Shop Now" button
    const shopBtn = document.querySelector('.hero button');
    if (shopBtn) {
        shopBtn.addEventListener('click', () => {
            window.location.href = 'products.html';
        });
    }
});
