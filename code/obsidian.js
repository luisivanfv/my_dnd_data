// Load external JavaScript from a repository
function loadExternalScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      console.log('Script loaded successfully:', url);
      resolve();
    };
    script.onerror = (error) => {
      console.error('Script failed to load:', url, error);
      reject(new Error(`Failed to load script: ${url}`));
    };
    console.log('Loading script from:', url);
    document.head.appendChild(script);
  });
}

async function loadAndInitialize() {
  try {
    console.log('Starting to load external script...');
    
    // Add cache busting with a random parameter
    const cacheBuster = Date.now();
    const scriptUrl = `https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/code/public.js?t=${cacheBuster}`;
    
    await loadExternalScript(scriptUrl);
    
    // Check if the script loaded properly by looking for a specific function
    console.log('Checking if script loaded...');
    console.log('DataManager exists?', typeof window.DataManager);
    console.log('initializeExternalScript exists?', typeof window.initializeExternalScript);
    
    // Signal the external script to initialize
    if (typeof window.initializeExternalScript === 'function') {
      console.log('Calling initializeExternalScript...');
      await window.initializeExternalScript();
      console.log('External script initialized successfully!');
    } else if (typeof window.initializeEverything === 'function') {
      // Fallback to the function name in your external script
      console.log('Calling initializeEverything...');
      await window.initializeEverything();
      console.log('External script initialized via fallback!');
    } else {
      console.warn('No initialization function found. Script may have loaded but functions are not accessible.');
      // Check for other signs the script loaded
      console.log('Checking for other global functions...');
      console.log('getMap exists?', typeof window.getMap);
      console.log('loadStatblocks exists?', typeof window.loadStatblocks);
    }
    
  } catch (error) {
    console.error('Error loading external script:', error);
  }
}

// Run when main document is ready
console.log('Main script starting. Document readyState:', document.readyState);

if (document.readyState === 'loading') {
  console.log('Document still loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired, starting script load');
    loadAndInitialize();
  });
} else {
  console.log('Document already loaded, starting script load immediately');
  loadAndInitialize();
}

// Also expose a manual trigger in case needed
window.manuallyLoadExternalScript = loadAndInitialize;