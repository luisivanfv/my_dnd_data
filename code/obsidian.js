const githubRoot = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/';
// MAIN SCRIPT - Use this in your website
async function loadExternalScript(url) {
    return new Promise((resolve, reject) => {
        console.log('Loading:', url);
        
        const script = document.createElement('script');
        script.src = url;
        
        // Set BOTH event handlers
        script.onload = () => {
            console.log('✅ Script loaded successfully:', url);
            resolve();
        };
        
        script.onerror = (event) => {
            console.error('❌ Script failed to load:', url, event);
            reject(new Error(`Failed to load: ${url}`));
        };
        
        // Add to document
        document.head.appendChild(script);
        console.log('Script element appended to DOM');
    });
}

// Main initialization
async function initializeApp() {
    console.log('=== STARTING APPLICATION ===');
    console.log('Document readyState:', document.readyState);
    
    try {
        // Use jsDelivr (confirmed working)
        const scriptUrl = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/code/public.js?t=' + Date.now();
        
        console.log('Attempting to load external script...');
        await loadExternalScript(scriptUrl);
        
        // Check if our script loaded successfully
        console.log('Checking loaded functions...');
        console.log('- DataManager exists?', typeof window.DataManager);
        console.log('- getMap exists?', typeof window.getMap);
        console.log('- initializeEverything exists?', typeof window.initializeEverything);
        
        // Try to initialize - check which function exists
        if (typeof window.initializeExternalScript === 'function') {
            console.log('Found initializeExternalScript, calling it...');
            await window.initializeExternalScript();
        } else if (typeof window.initializeEverything === 'function') {
            console.log('Found initializeEverything, calling it...');
            await window.initializeEverything();
        } else {
            console.warn('No initialization function found. Script may auto-initialize.');
            // Wait a bit in case script auto-initializes
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('✅ Application initialization complete!');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        
        // Fallback: Try direct GitHub raw URL
        console.log('Trying fallback with raw.githubusercontent.com...');
        try {
            const fallbackUrl = 'https://raw.githubusercontent.com/luisivanfv/my_dnd_data/main/code/public.js?t=' + Date.now();
            await loadExternalScript(fallbackUrl);
            console.log('✅ Fallback script loaded');
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
    }
}

// Start everything with proper timing
console.log('Script loader starting...');

// Use DOMContentLoaded OR run immediately based on readyState
function startApp() {
    console.log('Starting app initialization...');
    initializeApp().catch(err => {
        console.error('Unhandled error in app:', err);
    });
}

// Check document state
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    console.log('Document already loaded, starting immediately...');
    startApp();
}

// Optional: Expose manual trigger
window.manuallyInitializeApp = startApp;