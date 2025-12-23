console.log('🎉 TEST SCRIPT LOADED AND EXECUTING!', new Date().toISOString());

// Create visible element
var testMarker = document.createElement('div');
testMarker.id = 'test-script-marker';
testMarker.style.cssText = 'position: fixed; top: 50px; left: 10px; background: purple; color: white; padding: 10px; z-index: 99998; font-weight: bold; border-radius: 5px;';
testMarker.textContent = 'TEST SCRIPT WORKING - ' + new Date().toLocaleTimeString();
document.body.appendChild(testMarker);

// Expose a simple function
window.initializeExternalScript = function() {
    console.log('🎯 TEST initializeExternalScript calleddd!');
    console.log('Using githubRoot:', window.githubRoot);
    
    var resultDiv = document.createElement('div');
    resultDiv.id = 'test-result';
    resultDiv.style.cssText = 'position: fixed; top: 90px; left: 10px; background: green; color: white; padding: 10px; z-index: 99997;';
    resultDiv.textContent = 'TEST INITIALIZATION SUCCESS!';
    document.body.appendChild(resultDiv);
    
    return Promise.resolve('Test successful');
};

console.log('✅ Test script functions exposed');
console.log('window.initializeExternalScript:', typeof window.initializeExternalScript);