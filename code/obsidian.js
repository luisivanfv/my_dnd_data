console.log('=== MAIN SCRIPT STARTING ===', new Date().toISOString());
console.log('Script location:', document.currentScript ? document.currentScript.src : 'inline');

// Catch all unhandled errors
window.addEventListener('error', function(e) {
    console.error('=== UNHANDLED ERROR CAUGHT ===');
    console.error('Message:', e.message);
    console.error('Filename:', e.filename);
    console.error('Line:', e.lineno);
    console.error('Column:', e.colno);
    console.error('Error object:', e.error);
    return true;
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('=== UNHANDLED PROMISE REJECTION ===');
    console.error('Reason:', e.reason);
    console.error('Promise:', e.promise);
    return true;
});
// Debug: Check if we're in Obsidian Portal
console.log('Hostname:', window.location.hostname);
console.log('Page URL:', window.location.href);
console.log('=== BROWSER FEATURE CHECK ===');
console.log('Async function test:', (async function(){}).constructor === Function ? 'Supported' : 'NOT SUPPORTED');
console.log('Promise test:', typeof Promise !== 'undefined' ? 'Supported' : 'NOT SUPPORTED');
console.log('Arrow function test:', (() => {}).constructor === Function ? 'Supported' : 'NOT SUPPORTED');
console.log('Const test:', (function() { try { const x = 1; return 'Supported'; } catch(e) { return 'NOT SUPPORTED'; } })());
try {
    console.log('Step 1: Defining githubRoot...');
    const githubRoot = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/';
    console.log('✓ githubRoot defined');
    
    // MAIN SCRIPT - Use this in your website
    console.log('Step 2: Defining loadExternalScript...');
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
    console.log('✓ loadExternalScript defined');
    
    // Main initialization
    console.log('Step 3: Defining initializeApp...');
    async function initializeApp() {
        console.log('=== STARTING APPLICATION ===');
        console.log('Document readyState:', document.readyState);
        
        try {
            // Use jsDelivr (confirmed working)
            const scriptUrl = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/code/public.js?t=' + Date.now();
            
            console.log('Attempting to load external script...');
            await loadExternalScript(scriptUrl);
            console.log('✓ Script load promise resolved');
            
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
    console.log('✓ initializeApp defined');
    
    // Start everything with proper timing
    console.log('Step 4: Setting up startup logic...');
    console.log('Script loader starting...');
    
    // Use DOMContentLoaded OR run immediately based on readyState
    function startApp() {
        console.log('Starting app initialization...');
        initializeApp().catch(err => {
            console.error('Unhandled error in app:', err);
        });
    }
    
    // Check document state
    console.log('Current readyState:', document.readyState);
    if (document.readyState === 'loading') {
        console.log('Document still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', startApp);
    } else {
        console.log('Document already loaded, starting immediately...');
        startApp();
    }
    
    // Optional: Expose manual trigger
    console.log('Step 5: Exposing manual trigger...');
    window.manuallyInitializeApp = startApp;
    
    console.log('=== MAIN SCRIPT COMPLETED SETUP ===');
    
} catch (error) {
    console.error('❌❌❌ MAIN SCRIPT FAILED:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
}