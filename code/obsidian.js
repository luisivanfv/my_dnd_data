const githubRoot = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/';
// Load external JavaScript from a repository
function loadExternalScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    console.log('script:');
    console.log(script);
    document.head.appendChild(script);
  });
}

// Usage
(async function() {
  try {
    // Load your main logic from GitHub/GitLab/Raw URL
    await loadExternalScript(`${githubRoot}code/public.js?t=${Date.now()}`);
    await loadExternalScript(`${githubRoot}code/private.js?t=${Date.now()}`);
  } catch (error) {
    console.error('Error loading external script:', error);
  }
})();