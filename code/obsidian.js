const githubRoot = 'https://raw.githubusercontent.com/luisivanfv/my_dnd_data/main/';
// Load external JavaScript from a repository
function loadExternalScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}

// Usage
(async function() {
  try {
    // Load your main logic from GitHub/GitLab/Raw URL
    await loadExternalScript(`${githubRoot}/public.js?t=${Date.now()}`);
    await loadExternalScript(`${githubRoot}/private.js?t=${Date.now()}`);
    
    // Now you can use functions from the external script
    if (typeof myExternalFunction === 'function') {
      myExternalFunction();
    }
    
    console.log('External script loaded successfully!');
  } catch (error) {
    console.error('Error loading external script:', error);
  }
})();