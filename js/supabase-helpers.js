// Supabase helpers - non-module version for global access

const SUPABASE_URL = 'https://srcnlbdybejvcbvvdpbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY25sYmR5YmVqdmNidnZkcGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTU3MDYsImV4cCI6MjA4NTA3MTcwNn0.qLj0ClnWgAfxbtZ1P6O2c6TELdevpqerqOnjKGqhaZ8';

let supabaseClient = null;

function initSupabase() {
  if (!supabaseClient) {
    try {
      if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } else {
        throw new Error('Supabase library not loaded');
      }
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      throw error;
    }
  }
  return supabaseClient;
}

// ==================== PRODUCTS FUNCTIONS ====================
async function fetchProducts() {
  try {
    const sb = initSupabase();
    const { data, error } = await sb
      .from('products')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    
    console.log('Products fetched:', data);
    
    // Map image_url to image for consistency
    return (data || []).map(product => ({
      ...product,
      image: product.image_url || product.image || 'https://via.placeholder.com/400'
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function addProduct(productData) {
  try {
    const sb = initSupabase();
    const { data, error } = await sb
      .from('products')
      .insert([{
        name: productData.name,
        description: productData.description,
        price: productData.price,
        image_url: productData.image || 'https://via.placeholder.com/400'
      }])
      .select();
    
    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error adding product:', error);
    return { success: false, error: error.message };
  }
}

async function deleteProduct(productId) {
  try {
    const sb = initSupabase();
    const { error } = await sb
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
  }
}

async function updateProduct(productId, productData) {
  try {
    const sb = initSupabase();
    const { data, error } = await sb
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select();
    
    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message };
  }
}

// ==================== AUTHENTICATION FUNCTIONS ====================

/**
 * Register a new user with Supabase Auth
 * @param {string} email - User email
 * @param {string} password - User password (min 6 chars)
 * @param {string} name - User full name
 * @param {string} phone - User phone number
 * @returns {object} - { success: boolean, user: object, error: string }
 */
async function registerUser(email, password, name, phone) {
  try {
    const sb = initSupabase();
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await sb.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
          phone: phone
        }
      }
    });

    if (authError) throw authError;

    // 2. Also create user profile in users table
    const { data: userData, error: userError } = await sb
      .from('users')
      .insert([{
        id: authData.user.id,
        email: email,
        name: name,
        phone: phone
      }])
      .select();

    if (userError) throw userError;

    return { 
      success: true, 
      user: authData.user,
      message: 'Account created! Please check your email to verify.'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Login user with Supabase Auth
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} - { success: boolean, user: object, session: object, error: string }
 */
async function loginUser(email, password) {
  try {
    const sb = initSupabase();
    const { data, error } = await sb.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    // Fetch user profile from users table
    const { data: userProfile, error: profileError } = await sb
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    return {
      success: true,
      user: userProfile,
      session: data.session
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Logout current user
 * @returns {object} - { success: boolean, error: string }
 */
async function logoutUser() {
  try {
    const sb = initSupabase();
    const { error } = await sb.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current authenticated user session
 * @returns {object} - { user: object, session: object } or null
 */
async function getCurrentSession() {
  try {
    const sb = initSupabase();
    const { data: { session } } = await sb.auth.getSession();
    
    if (!session) return null;

    // Fetch user profile
    const { data: userProfile } = await sb
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      user: userProfile || session.user,
      session: session
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Watch for auth state changes
 * @param {function} callback - Function to call when auth state changes
 */
function onAuthStateChange(callback) {
  try {
    const sb = initSupabase();
    return sb.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  } catch (error) {
    console.error('Error setting up auth state change:', error);
  }
}
