const githubRoot = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/';

console.log('=== MAIN SCRIPT STARTING ===', new Date().toISOString());
console.log('githubRoot:', githubRoot);

// Create visible indicator immediately
var debugDiv = document.createElement('div');
debugDiv.id = 'debug-indicator';
debugDiv.style.cssText = 'position: fixed; top: 10px; left: 10px; background: #ff6b6b; color: white; padding: 10px; z-index: 99999; font-family: Arial; font-size: 12px; border-radius: 5px; max-width: 300px;';
debugDiv.innerHTML = '<strong>Script Status</strong><br>Starting...';
document.body.appendChild(debugDiv);

function updateDebug(status, color) {
    if (debugDiv) {
        debugDiv.innerHTML = '<strong>Script Status</strong><br>' + status + '<br><small>' + new Date().toLocaleTimeString() + '</small>';
        debugDiv.style.background = color || '#ff6b6b';
    }
    console.log('DEBUG:', status);
}

updateDebug('Initializing...', '#ff6b6b');

// MAIN SCRIPT - Use this in your website
async function loadExternalScript(url) {
    console.log('📥 Loading external script:', url);
    updateDebug('Loading: ' + url.split('/').pop(), '#ffa500');
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        
        // Add error capture
        var errorHandler = function(e) {
            console.error('❌ Script error event:', e);
            console.error('Error details:', e.error);
            console.error('Filename:', e.filename);
            console.error('Line:', e.lineno);
        };
        
        // Add event listener for errors
        script.addEventListener('error', errorHandler);
        
        // Set BOTH event handlers
        script.onload = () => {
            console.log('✅ Script onload fired:', url);
            console.log('Script element:', script);
            console.log('Script readyState:', script.readyState);
            updateDebug('Script loaded', '#4ecdc4');
            
            // Check if script executed by looking for a global variable
            setTimeout(() => {
                console.log('Checking for script execution...');
                console.log('- window.initializeExternalScript:', typeof window.initializeExternalScript);
                console.log('- window.initializeEverything:', typeof window.initializeEverything);
                console.log('- window.DataManager:', typeof window.DataManager);
            }, 100);
            
            resolve();
        };
        
        script.onerror = (event) => {
            console.error('❌ Script onerror fired:', url, event);
            updateDebug('Load failed', '#ff3838');
            reject(new Error(`Failed to load: ${url}`));
        };
        
        // Add to document
        console.log('Appending script to head...');
        document.head.appendChild(script);
        console.log('Script appended to DOM');
    });
}

// Main initialization
async function initializeApp() {
    console.log('=== STARTING APPLICATION ===');
    console.log('Document readyState:', document.readyState);
    updateDebug('Starting app...', '#3498db');
    
    try {
        // Use jsDelivr (confirmed working)
        //const scriptUrl = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/code/public.js?t=' + Date.now();
        const scriptUrl = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/code/test.js?v=1.0.' + Date.now();
        console.log('Attempting to load external script...');
        updateDebug('Fetching script...', '#3498db');
        await loadExternalScript(scriptUrl);
        
        // Give script time to execute
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if our script loaded successfully
        console.log('Checking loaded functions...');
        updateDebug('Checking functions...', '#9b59b6');
        
        // List ALL window properties to debug
        var initFunctions = [];
        for (var key in window) {
            if (typeof window[key] === 'function' && key.toLowerCase().includes('init')) {
                initFunctions.push(key);
            }
        }
        console.log('All init functions found:', initFunctions);
        
        console.log('- DataManager exists?', typeof window.DataManager);
        console.log('- getMap exists?', typeof window.getMap);
        console.log('- initializeEverything exists?', typeof window.initializeEverything);
        console.log('- initializeExternalScript exists?', typeof window.initializeExternalScript);
        
        // Try to initialize - check which function exists
        if (typeof window.initializeExternalScript === 'function') {
            console.log('Found initializeExternalScript, calling it...');
            updateDebug('Calling initializeExternalScript...', '#2ecc71');
            await window.initializeExternalScript();
        } else if (typeof window.initializeEverything === 'function') {
            console.log('Found initializeEverything, calling it...');
            updateDebug('Calling initializeEverything...', '#2ecc71');
            await window.initializeEverything();
        } else {
            console.warn('No initialization function found.');
            updateDebug('No init function found', '#e74c3c');
            
            // Try to manually trigger by checking if script created any elements
            console.log('Checking if script auto-initialized...');
            console.log('Body classes:', document.body.className);
            console.log('Elements with class "loaded":', document.querySelectorAll('.loaded').length);
            
            // Create a test to see if we can call anything
            if (window.DataManager && typeof window.DataManager.waitForLoad === 'function') {
                console.log('Trying DataManager.waitForLoad()...');
                await window.DataManager.waitForLoad();
            }
        }
        
        console.log('✅ Application initialization complete!');
        updateDebug('Initialization complete!', '#2ecc71');
        debugDiv.style.background = '#2ecc71';
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        updateDebug('Failed: ' + error.message, '#e74c3c');
        
        // Fallback: Try direct GitHub raw URL
        console.log('Trying fallback with raw.githubusercontent.com...');
        updateDebug('Trying fallback...', '#e67e22');
        try {
            const fallbackUrl = 'https://raw.githubusercontent.com/luisivanfv/my_dnd_data/main/code/public.js?t=' + Date.now();
            await loadExternalScript(fallbackUrl);
            console.log('✅ Fallback script loaded');
            updateDebug('Fallback loaded', '#2ecc71');
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            updateDebug('All attempts failed', '#c0392b');
        }
    }
}

// Start everything with proper timing
console.log('Script loader starting...');
updateDebug('Setting up startup...', '#3498db');

// Use DOMContentLoaded OR run immediately based on readyState
function startApp() {
    console.log('Starting app initialization...');
    updateDebug('Starting app...', '#3498db');
    initializeApp().catch(err => {
        console.error('Unhandled error in app:', err);
        updateDebug('Error: ' + err.message, '#e74c3c');
    });
}

// Check document state
console.log('Current readyState:', document.readyState);
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded...');
    updateDebug('Waiting for DOM...', '#f39c12');
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    console.log('Document already loaded, starting immediately...');
    startApp();
}

// Optional: Expose manual trigger
window.manuallyInitializeApp = startApp;

console.log('=== MAIN SCRIPT SETUP COMPLETE ===');
updateDebug('Setup complete, waiting...', '#3498db');