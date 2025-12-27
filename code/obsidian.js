window.githubRoot = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/';

async function getLatestCommitHash() {
    try {
        const response = await fetch('https://api.github.com/repos/luisivanfv/my_dnd_data/commits/main');
        const data = await response.json();
        if(!window.latestCommitHash)
            window.latestCommitHash = data.sha.substring(0, 8);
        return data.sha.substring(0, 8); // Short hash
    } catch (error) {
        console.error('Failed to fetch commit hash:', error);
        return 'main'; // Fallback
    }
}

async function loadExternalScript(url) {
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
            setTimeout(() => {
                //console.log('- window.initializeEverything:', typeof window.initializeEverything);
            }, 0);
            
            resolve();
        };
        
        script.onerror = (event) => {
            console.error('❌ Script onerror fired:', url, event);
            reject(new Error(`Failed to load: ${url}`));
        };
        document.head.appendChild(script);
    });
}

// Main initialization
async function initializeApp() {
    try {
        const scriptUrl = `https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@${await getLatestCommitHash()}/code/dnd.js`;
        await loadExternalScript(scriptUrl);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        var initFunctions = [];
        for (var key in window) {
            if (typeof window[key] === 'function' && key.toLowerCase().includes('init')) {
                initFunctions.push(key);
            }
        }
        
        if (typeof window.initializeExternalScript === 'function') {
            await window.initializeExternalScript();
        } else if (typeof window.initializeEverything === 'function') {
            await window.initializeEverything();
        } else {
            if (window.DataManager && typeof window.DataManager.waitForLoad === 'function') {
                await window.DataManager.waitForLoad();
            }
        }
        
        console.log('✅ Application initialization complete!');
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        try {
            const fallbackUrl = 'https://raw.githubusercontent.com/luisivanfv/my_dnd_data/main/code/public.js?t=' + Date.now();
            await loadExternalScript(fallbackUrl);
            console.log('✅ Fallback script loaded');
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
    }
}

function startApp() {
    initializeApp().catch(err => {
        console.error('Unhandled error in app:', err);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}