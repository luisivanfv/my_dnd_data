try {
console.log('=== MAIN SCRIPT STARTING ===', new Date().toISOString());
console.log('Script location:', document.currentScript ? document.currentScript.src : 'inline');
async function initializeApp() {
    console.log('=== STARTING APPLICATION ===');
    console.log('Document readyState:', document.readyState);
    console.log('Window loaded?', window.loaded);
    
    try {
        // Use jsDelivr (confirmed working)
        const scriptUrl = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/code/public.js?t=' + Date.now();
        
        console.log('Attempting to load external script from:', scriptUrl);
        await loadExternalScript(scriptUrl);
        
        // Give it a moment to execute
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if our script loaded successfully
        console.log('=== Checking loaded functions ===');
        console.log('- DataManager exists?', typeof window.DataManager);
        console.log('- getMap exists?', typeof window.getMap);
        console.log('- initializeEverything exists?', typeof window.initializeEverything);
        console.log('- initializeExternalScript exists?', typeof window.initializeExternalScript);
        
        // List ALL window properties to see what loaded
        console.log('All window functions containing "init":', 
            Object.keys(window).filter(key => 
                key.toLowerCase().includes('init') && typeof window[key] === 'function'
            )
        );
        
        // Try to initialize - check which function exists
        if (typeof window.initializeExternalScript === 'function') {
            console.log('Found initializeExternalScript, calling it...');
            await window.initializeExternalScript();
        } else if (typeof window.initializeEverything === 'function') {
            console.log('Found initializeEverything, calling it...');
            await window.initializeEverything();
        } else {
            console.warn('No initialization function found. Checking if script auto-initialized...');
            // Check if initialization already happened
            if (document.body.classList.contains('loaded')) {
                console.log('Script appears to have auto-initialized (body has "loaded" class)');
            } else {
                console.warn('Script did not auto-initialize');
                // Try to manually trigger any initialization
                if (window.DataManager && typeof window.DataManager.waitForLoad === 'function') {
                    console.log('Waiting for DataManager to load...');
                    await window.DataManager.waitForLoad();
                }
            }
        }
        
        console.log('✅ Application initialization complete!');
        console.log('Body classes:', document.body.className);
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        console.error('Stack trace:', error.stack);
        
        // Fallback: Try direct GitHub raw URL
        console.log('Trying fallback with raw.githubusercontent.com...');
        try {
            const fallbackUrl = 'https://raw.githubusercontent.com/luisivanfv/my_dnd_data/main/code/public.js?t=' + Date.now();
            await loadExternalScript(fallbackUrl);
            console.log('✅ Fallback script loaded');
            // Give fallback time to execute
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
    }
}

// Add at the end of your main script:
window.testMyScript = function() {
    console.log('=== TEST FUNCTION CALLED ===');
    console.log('githubRoot:', window.githubRoot);
    console.log('DataManager:', window.DataManager);
    console.log('initializeEverything:', window.initializeEverything);
    console.log('Body classes:', document.body.className);
    
    if (typeof window.initializeEverything === 'function') {
        console.log('Calling initializeEverything...');
        window.initializeEverything().then(() => {
            console.log('Test initialization completed!');
        }).catch(err => {
            console.error('Test initialization failed:', err);
        });
    } else {
        console.error('initializeEverything not found!');
    }
};

console.log('Test function available: window.testMyScript()');

} catch (error) {
    console.error('❌❌❌ MAIN SCRIPT FAILED TO LOAD/EXECUTE:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Create visible error on page
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: red; color: white; padding: 20px; z-index: 999999;';
    errorDiv.innerHTML = `Script Error: ${error.message}`;
    document.body.appendChild(errorDiv);
}