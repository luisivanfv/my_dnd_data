// Test loading first
async function testScriptLoading() {
    try {
        console.log('=== STARTING SCRIPT LOAD TEST ===');
        
        // Try loading the minimal test script
        const testUrl = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/code/health-check.js?t=' + Date.now();
        
        const script = document.createElement('script');
        
        return new Promise((resolve, reject) => {
            script.src = testUrl;
            script.onload = () => {
                console.log('✅ Test script LOADED successfully');
                console.log('Checking if testFunction exists:', typeof window.testFunction);
                
                if (typeof window.testFunction === 'function') {
                    const result = window.testFunction();
                    console.log('✅ Test function executed:', result);
                    resolve(true);
                } else {
                    console.warn('⚠ Test function not found');
                    resolve(false);
                }
            };
            
            script.onerror = (error) => {
                console.error('❌ Test script FAILED to load:', error);
                reject(error);
            };
            
            console.log('Attempting to load:', testUrl);
            document.head.appendChild(script);
        });
        
    } catch (error) {
        console.error('Test failed:', error);
        return false;
    }
}

// Main loading function
async function loadAndInitialize() {
    console.log('=== MAIN SCRIPT STARTING ===');
    
    // First test with minimal script
    const testPassed = await testScriptLoading();
    
    if (!testPassed) {
        console.error('❌ TEST FAILED - Basic script loading is broken');
        return;
    }
    
    console.log('✅ Basic script loading works, now trying main script...');
    
    // Now try your main script
    try {
        const mainUrl = `https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/code/public.js?t=${Date.now()}`;
        
        const script = document.createElement('script');
        
        return new Promise((resolve, reject) => {
            script.src = mainUrl;
            
            // Add error handler to catch syntax errors
            script.onload = () => {
                console.log('✅ Main script loaded (onload fired)');
                console.log('Checking DataManager:', typeof window.DataManager);
                console.log('Checking initializeExternalScript:', typeof window.initializeExternalScript);
                
                // Try to call initialization
                setTimeout(() => {
                    if (typeof window.initializeExternalScript === 'function') {
                        console.log('Calling initializeExternalScript...');
                        window.initializeExternalScript().then(() => {
                            console.log('✅ Main script initialized');
                            resolve();
                        }).catch(err => {
                            console.error('Initialization error:', err);
                            resolve();
                        });
                    } else {
                        console.warn('initializeExternalScript not found, script may have errors');
                        resolve();
                    }
                }, 500);
            };
            
            script.onerror = (error) => {
                console.error('❌ Main script FAILED to load (network/syntax error):', error);
                // Check if script partially loaded
                console.log('Checking for partial load - DataManager exists?', typeof window.DataManager);
                reject(error);
            };
            
            // Add to document
            document.head.appendChild(script);
            console.log('Main script element added to DOM');
        });
        
    } catch (error) {
        console.error('Error in main load:', error);
    }
}

// Add a global error handler to catch any script errors
window.addEventListener('error', function(event) {
    console.error('GLOBAL ERROR CAUGHT:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    return false;
});

// Start everything
console.log('Initializing... Document readyState:', document.readyState);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded fired, starting load');
        loadAndInitialize();
    });
} else {
    console.log('Document already loaded, starting immediately');
    loadAndInitialize();
}