window.githubRoot = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/';
const statblockReplacementColor = '#010101';
const statblockFontSize = '14px';

async function getLatestCommitHash() {
    try {
        const response = await fetch('https://api.github.com/repos/luisivanfv/my_dnd_data/commits/main');
        const data = await response.json();
        if(!window.latestCommitHash)
            window.latestCommitHash = data.sha.substring(0, 8);
        localStorage.setItem('commitHash', data.sha.substring(0, 8));
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

function getImagePreview(url, txt, color, fontSize) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const cleanTxt = txt.replace("Scoia'tael", "Scoiatael");
    color = color ? color : 'darkred';
    fontSize = fontSize || txtSize;
    const isImage = imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
    if (isImage) {
        const previewId = 'img-preview-' + Date.now();
        return `
        <a href="${url}" 
           target="_blank"
           class="image-preview-link"
           data-url="${url}"
           data-text="${cleanTxt}"
           data-preview-id="${previewId}"
           oncontextmenu="handleImagePreviewMouseEnter(event, '${previewId}', '${url}', '${cleanTxt}')"
           onmouseleave="handleImagePreviewMouseLeave(event, '${previewId}')"
           style="color: ${color}; font-size: ${fontSize}; cursor: pointer; text-decoration: none;">
            ${txt}
        </a>
        <div id="${previewId}" class="image-preview-container" style="
            position: fixed;
            display: none;
            z-index: 9999;
            background: white;
            border: 1px solid #ccc;
            padding: 8px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            pointer-events: auto;
            overflow: auto;
            top: 0;
            bottom: 0;
        ">
            <div style="position: relative; height: 100%;">
                <button onclick="hideImagePreview('${previewId}')" style="
                    position: absolute; top: 5px; right: 5px; background: #333; color: white; border: none; border-radius: 50%; width: 25px;
                    height: 25px; cursor: pointer; z-index: 10000; font-size: 16px; line-height: 1;">x</button>
                <div class="image-wrapper" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    width: 100%;
                ">
                    <img src="${url}" alt="${txt}" class="preview-image" style="
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                        display: block;
                    ">
                </div>
            </div>
        </div>`;
    }
    return `<a class="lazy-preview-link"
           href="${url}"
           data-url="${url}"
           data-text="${txt.replace(/"/g, '&quot;')}"
           style="color: ${color}; font-size: ${fontSize}; cursor: pointer;">
            ${txt}
        </a>`;
}
function keywordToUrl(txt, color, url, fontSize) {
    if (!url) return color ? `<span style="color:${color}">${txt}</span>` : txt;
    return getImagePreview(url, txt, color, fontSize);
}
function toUpper(str) {
	return str
		.toLowerCase()
		.split(' ')
		.map(function(word) {
			return word[0].toUpperCase() + word.substr(1);
		})
		.join(' ');
}
async function getJson(url) {
    const response = await fetch(`${window.githubRoot}${url}`);
    return await response.json(`${window.githubRoot}${url}`);
}
async function fetchIfNotSet(key) {
    if(!window[key])
        window[key] = await getJson(key);
    return window[key];
}
async function getFilenames(path = '') {
    const apiUrl = `https://api.github.com/repos/luisivanfv/my_dnd_data/contents/${path}`;
    try {
        const response = await fetch(apiUrl, { headers: {} });
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        const data = await response.json();
        return data
            .filter(item => item.type === 'file')  // Only files, not folders
            .map(item => item.name);
    } catch (error) {
        console.error('Error fetching GitHub files:', error);
        return [];
    }
}
async function getKeywordsFromFolder(folderName) {
    return (await getFilenames(folderName)).map(file => file.replace(/\.json$/, '').replaceAll('-', ' '));
}
async function loadAllCreatures() {
    //const allEntries = [];
    const playersInJson = await getKeywordsFromFolder('players');
    const players = {};
    for (const player of playersInJson) {
        console.log('Trying to load player: ', player)
        players[player] = await getJson(`players/${player}.json`);
    }
    localStorage.setItem('players', JSON.stringify(players));
}
async function loadDirectoriesToStorage() {
    const directories = ['characters', 'encounters', 'locations', 'spells', 'statblocks'];
    directories.forEach(async (directory) => {
        const filenames = await getFilenames(directory);
        localStorage.setItem(directory, JSON.stringify(filenames));
        filenames.forEach(async (filename) => {
            localStorage.setItem(`${directory}_${filename}`, JSON.stringify(await getJson(`${directory}/${filename}`)))
        });
    });
}
//await getJson(`spells/${spellSearched}`)
async function loadAllReplacementsToStorage() {
    const allEntries = [];
    const keywords = await fetchIfNotSet('keywords.json');
    for (const [keyword, url] of Object.entries(keywords)) {
        allEntries.push(
            [keyword, keywordToUrl(keyword, statblockReplacementColor, url, statblockFontSize)],
            [toUpper(keyword), keywordToUrl(toUpper(keyword), statblockReplacementColor, url, statblockFontSize)]
        );
    }
    const spells = await getKeywordsFromFolder('spells');
    for (const spell of spells) {
        const slug = `spell?name=${spell.replaceAll(' ', '-')}`;
        allEntries.push(
            [spell, keywordToUrl(spell, statblockReplacementColor, slug, statblockFontSize)],
            [toUpper(spell), keywordToUrl(toUpper(spell), statblockReplacementColor, slug, statblockFontSize)]
        );
    }
    const creatures = await getKeywordsFromFolder('statblocks');
    for (const creature of creatures) {
        const slug = `creature?name=${creature.replaceAll(' ', '-')}`;
        allEntries.push(
            [creature, keywordToUrl(creature, 'black', slug, statblockFontSize)],
            [toUpper(creature), keywordToUrl(toUpper(creature), 'black', slug, statblockFontSize)]
        );
    }
    const locations = await getKeywordsFromFolder('locations');
    for (const location of locations) {
        const slug = `location?name=${location.replaceAll(' ', '-')}`;
        allEntries.push(
            [location, keywordToUrl(location, statblockReplacementColor, slug, statblockFontSize)],
            [toUpper(location), keywordToUrl(toUpper(location), statblockReplacementColor, slug, statblockFontSize)]
        );
    }
    const characters = await getKeywordsFromFolder('characters');
    for (const character of characters) {
        const slug = `character?name=${character.replaceAll(' ', '-')}`;
        allEntries.push(
            [character, keywordToUrl(character, statblockReplacementColor, slug, statblockFontSize)],
            [toUpper(character), keywordToUrl(toUpper(character), statblockReplacementColor, slug, statblockFontSize)]
        );
    }
    
    // Sort entries by key in reverse alphabetical order
    allEntries.sort(([keyA], [keyB]) => keyB.localeCompare(keyA));
    
    // Convert to object (last value wins for duplicates)
    const result = {};
    for (const [key, value] of allEntries) {
        result[key] = value;
    }
    
    localStorage.setItem('allReplacements', JSON.stringify(result));
}
async function loadSoundboard() {
    console.log('Loading soundboard...');
    localStorage.setItem('soundboard', JSON.stringify(await getJson('soundboard.json')));
}
async function loadAllStorageData() {
    localStorage.clear();
    await loadAllReplacementsToStorage();
    await loadDirectoriesToStorage();
    await loadAllCreatures();
    await loadSoundboard();
    console.log('Local storage:');
    console.log(localStorage);
}
// Main initialization
async function initializeApp() {
    try {
        const supabaseScriptUrl = `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`;
        await loadExternalScript(supabaseScriptUrl);
        const scriptUrl = `https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@${await getLatestCommitHash()}/code/dnd.js`;
        await loadExternalScript(scriptUrl);
        
        if(document.URL.endsWith('/advanced-settings'))
            await loadAllStorageData();
        
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
        
        // NOW initialize auto updates AFTER external script is loaded
        await initializeAutoUpdates();
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        try {
            const fallbackUrl = 'https://raw.githubusercontent.com/luisivanfv/my_dnd_data/main/code/public.js?t=' + Date.now();
            await loadExternalScript(fallbackUrl);
            console.log('✅ Fallback script loaded');
            
            // Try to initialize auto updates with fallback
            setTimeout(initializeAutoUpdates, 1000);
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
// Smart polling with backoff
class SmartPoller {
    constructor(config = {}) {
        this.baseInterval = config.baseInterval || 30000; // Increased from 5s to 30s
        this.maxInterval = config.maxInterval || 300000;
        this.backoffFactor = config.backoffFactor || 2;
        this.jitter = config.jitter || 0.1;
        this.pollTimer = null;
        this.currentInterval = this.baseInterval;
        this.consecutiveErrors = 0;
        this.isPolling = false;
        this.lastCharacterData = null;
    }
    
    start() {
        if (this.isPolling) return;
        
        console.log(`Starting smart poller with ${this.currentInterval}ms interval`);
        this.isPolling = true;
        this.poll();
    }
    
    stop() {
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        this.isPolling = false;
        console.log('Smart poller stopped');
    }
    
    async poll() {
        if (!this.isPolling) return;
        
        try {
            const updates = await this.fetchUpdates();
            
            // Reset backoff on success
            if (this.consecutiveErrors > 0) {
                this.consecutiveErrors = 0;
                this.resetInterval();
            }
            
            if (updates && updates.length > 0) {
                this.handleUpdates(updates);
            }
            
        } catch (error) {
            console.error('Poll failed:', error);
            this.consecutiveErrors++;
            this.handlePollError(error);
        } finally {
            this.scheduleNextPoll();
        }
    }
    
    scheduleNextPoll() {
        if (!this.isPolling) return;
        
        // Calculate next interval with backoff and jitter
        let nextInterval = this.currentInterval;
        
        if (this.consecutiveErrors > 0) {
            nextInterval = Math.min(
                this.baseInterval * Math.pow(this.backoffFactor, this.consecutiveErrors),
                this.maxInterval
            );
        }
        
        // Add jitter to prevent thundering herd
        const jitterAmount = nextInterval * this.jitter;
        nextInterval += (Math.random() * jitterAmount * 2) - jitterAmount;
        
        this.currentInterval = Math.max(this.baseInterval, nextInterval);
        
        this.pollTimer = setTimeout(() => {
            this.poll();
        }, this.currentInterval);
    }
    
    resetInterval() {
        this.currentInterval = this.baseInterval;
        console.log('Poll interval reset to base');
    }
    
    handlePollError(error) {
        // Notify user of connection issues
        this.showConnectionWarning();
        
        // If too many errors, switch to a different strategy
        if (this.consecutiveErrors >= 5) {
            console.warn('Multiple consecutive errors, switching to fallback mode');
            this.switchToFallbackMode();
        }
    }
    
    switchToFallbackMode() {
        // Implement fallback (longer intervals, cached data, etc.)
        this.baseInterval = 30000; // 30 seconds in fallback mode
        this.resetInterval();
    }
    
    showConnectionWarning() {
        // Show a temporary warning
        const warning = document.getElementById('connection-warning');
        if (warning) {
            warning.style.display = 'block';
            setTimeout(() => {
                warning.style.display = 'none';
            }, 5000);
        }
    }
    
    async fetchUpdates() {
        const url = new URL(window.location.href);
        const value = url.searchParams.get('name');
        
        // Only update if we're on a character sheet page
        if(window.location.href.includes('charactersheet') && value) {
            try {
                // Get current character data
                const characterName = value;
                const character = await this.getCharacterData(characterName);
                
                // Check if data has actually changed
                if (this.hasCharacterChanged(character)) {
                    console.log('Character data changed, updating sheet');
                    await window.updateCharacterSheet();
                    this.lastCharacterData = character;
                } else {
                    console.log('No changes detected, skipping update');
                }
            } catch (error) {
                console.error('Error checking for updates:', error);
                throw error;
            }
        }
        return [];
    }
    
    async getCharacterData(characterName) {
        // Use your existing queryDatabase function
        if (typeof window.queryDatabase === 'function') {
            const characters = await window.queryDatabase('Players', 
                { name: capitalizeFirstLetter(characterName) }, 
                {});
            return characters[0];
        }
        return null;
    }
    
    hasCharacterChanged(newCharacter) {
        if (!this.lastCharacterData) return true;
        
        // Compare key properties that would require a UI update
        const keysToCompare = [
            'hp', 'maxHp', 'gold', 'level', 
            'str', 'dex', 'con', 'int', 'wis', 'cha'
        ];
        
        for (const key of keysToCompare) {
            if (this.lastCharacterData[key] !== newCharacter[key]) {
                return true;
            }
        }
        
        return false;
    }
    
    handleUpdates(updates) {
        console.log(`Received ${updates.length} updates`);
        
        // Process each update
        updates.forEach(update => {
            this.processSingleUpdate(update);
        });
        
        // Show notification
        this.showUpdateNotification(updates.length);
    }
    
    processSingleUpdate(update) {
        // Based on update type, update specific parts of your UI
        switch(update.type) {
            case 'character_update':
                this.updateCharacterInfo(update.data);
                break;
            case 'campaign_update':
                this.updateCampaignDisplay(update.data);
                break;
            case 'message':
                this.addNewMessage(update.data);
                break;
        }
    }
    
    showUpdateNotification(count) {
        // Optional: Show a subtle notification
        if (count > 0 && Notification.permission === 'granted') {
            new Notification('D&D Campaign', {
                body: `${count} update${count > 1 ? 's' : ''} received`
            });
        }
    }
}

// Initialize in your main script
async function initializeAutoUpdates() {
    // Check if we're on ObsidianPortal (based on your constraints)
    const isObsidianPortal = window.location.hostname.includes('obsidianportal');
    
    if (isObsidianPortal) {
        // Use polling for ObsidianPortal since WebSockets might be blocked
        const poller = new SmartPoller({
            baseInterval: 30000, // 30 seconds
            maxInterval: 120000 // 2 minutes max
        });
        poller.start();
        
        // Also set up a manual refresh button
        createManualRefreshButton();
    } else {
        // For your own hosted version, use better options
        console.log('Not on ObsidianPortal, using normal updates');
    }
}

function createManualRefreshButton() {
    const button = document.createElement('button');
    button.id = 'manual-refresh';
    button.innerHTML = '🔄 Refresh';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 15px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    button.addEventListener('click', async () => {
        if (typeof updateCharacterSheet === 'function') {
            await updateCharacterSheet();
        } else {
            console.log('updateCharacterSheet function not available yet');
        }
    });
    
    document.body.appendChild(button);
}

// Start when page loads AND after external script is loaded
document.addEventListener('DOMContentLoaded', () => {
    // We'll initialize auto updates after the external script loads
    // This is handled in the startApp function
});
// Initialize in your main script
async function initializeAutoUpdates() {
    // Check if we're on ObsidianPortal (based on your constraints)
    const isObsidianPortal = window.location.hostname.includes('obsidianportal');
    
    if (isObsidianPortal) {
        // Use polling for ObsidianPortal since WebSockets might be blocked
        const poller = new SmartPoller({
            baseInterval: 15000, // 15 seconds
            maxInterval: 120000 // 2 minutes max
        });
        poller.start();
        
        // Also set up a manual refresh button
        createManualRefreshButton();
    } else {
        // For your own hosted version, use better options
        const hybridUpdater = new HybridUpdater();
        await hybridUpdater.initialize();
    }
}

function createManualRefreshButton() {
    const button = document.createElement('button');
    button.id = 'manual-refresh';
    button.innerHTML = '🔄 Refresh';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 15px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    button.addEventListener('click', async () => {
        await updateCharacterSheet();
    });
    
    document.body.appendChild(button);
}

// Start when page loads
document.addEventListener('DOMContentLoaded', initializeAutoUpdates);