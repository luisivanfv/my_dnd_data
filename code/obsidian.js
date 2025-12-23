const githubRoot = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/';
// Load external JavaScript from a repository
function loadExternalScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    console.log('script:' + url);
    console.log(script);
    document.head.appendChild(script);
  });
}

async function loadAndInitialize() {
  try {
    await loadExternalScript(`${githubRoot}code/public.js?t=${Date.now()}`);
    await loadExternalScript(`${githubRoot}code/private.js?t=${Date.now()}`);
    
    // Signal the external script to initialize
    if (typeof window.initializeExternalScript === 'function') {
      window.initializeExternalScript();
    }
    
    console.log('External script loaded and initialized!');
  } catch (error) {
    console.error('Error loading external script:', error);
  }
}

// Run when main document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndInitialize);
} else {
  loadAndInitialize();
}