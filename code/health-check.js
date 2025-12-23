async function testScriptLoading() {
    try {
        console.log('=== STARTING SCRIPT LOAD TEST ===');
        
        // Try loading the minimal test script
        const testUrl = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/code/test-minimal.js?t=' + Date.now();
        console.log('TEST URL:', testUrl);
        
        // Try to fetch it first to see what happens
        console.log('Testing fetch...');
        try {
            const response = await fetch(testUrl);
            console.log('Fetch status:', response.status, response.statusText);
            console.log('Fetch headers:', [...response.headers.entries()]);
            
            if (response.ok) {
                const text = await response.text();
                console.log('Fetch content (first 200 chars):', text.substring(0, 200));
            } else {
                console.error('Fetch failed with status:', response.status);
            }
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
        }
        
        // Now try script loading
        const script = document.createElement('script');
        
        return new Promise((resolve, reject) => {
            script.src = testUrl;
            script.onload = () => {
                console.log('✅ Test script LOADED successfully');
                resolve(true);
            };
            
            script.onerror = (error) => {
                console.error('❌ Test script FAILED to load');
                console.error('Error event details:', {
                    type: error.type,
                    target: error.target,
                    srcElement: error.srcElement,
                    timeStamp: error.timeStamp
                });
                reject(error);
            };
            
            console.log('Attempting to load via script tag...');
            document.head.appendChild(script);
        });
        
    } catch (error) {
        console.error('Test failed:', error);
        return false;
    }
}