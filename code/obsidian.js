window.githubRoot = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/';
const statblockReplacementColor = '#010101';
const fontSize = '15px';

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

function getImagePreview(url, txt, color, fontSize) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
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
           data-text="${txt}"
           data-preview-id="${previewId}"
           oncontextmenu="handleImagePreviewMouseEnter(event, '${previewId}', '${url}', '${txt}')"
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
    const response = await fetch(`${window.githubRoot}${url}.json?t=${Date.now()}`);
    return await response.json(`${window.githubRoot}${url}.json?t=${Date.now()}`);
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
async function loadDirectoriesToStorage() {
    const directories = ['characters', 'locations', 'spells', 'statblocks'];
    directories.forEach(async (directory) => {
        localStorage.setItem(directory, JSON.stringify(await getFilenames(directory)));
    });
}
async function loadAllReplacementsToStorage() {
    const allEntries = [];
    const keywords = await fetchIfNotSet('keywords');
    for (const [keyword, url] of Object.entries(keywords)) {
        allEntries.push(
            [keyword, keywordToUrl(keyword, statblockReplacementColor, url, fontSize)],
            [toUpper(keyword), keywordToUrl(toUpper(keyword), statblockReplacementColor, url, fontSize)]
        );
    }
    const spells = await getKeywordsFromFolder('spells');
    for (const spell of spells) {
        const slug = `spell?name=${spell.replaceAll(' ', '-')}`;
        allEntries.push(
            [spell, keywordToUrl(spell, statblockReplacementColor, slug, fontSize)],
            [toUpper(spell), keywordToUrl(toUpper(spell), statblockReplacementColor, slug, fontSize)]
        );
    }
    const creatures = await getKeywordsFromFolder('statblocks');
    for (const creature of creatures) {
        const slug = `creature?name=${creature.replaceAll(' ', '-')}`;
        allEntries.push(
            [creature, keywordToUrl(creature, 'black', slug, fontSize)],
            [toUpper(creature), keywordToUrl(toUpper(creature), 'black', slug, fontSize)]
        );
    }
    const locations = await getKeywordsFromFolder('locations');
    for (const location of locations) {
        const slug = `location?name=${location.replaceAll(' ', '-')}`;
        allEntries.push(
            [location, keywordToUrl(location, statblockReplacementColor, slug, fontSize)],
            [toUpper(location), keywordToUrl(toUpper(location), statblockReplacementColor, slug, fontSize)]
        );
    }
    const characters = await getKeywordsFromFolder('characters');
    for (const character of characters) {
        const slug = `character?name=${character.replaceAll(' ', '-')}`;
        allEntries.push(
            [character, keywordToUrl(character, statblockReplacementColor, slug, fontSize)],
            [toUpper(character), keywordToUrl(toUpper(character), statblockReplacementColor, slug, fontSize)]
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
async function loadAllStorageData() {
    await loadAllReplacementsToStorage();
    await loadDirectoriesToStorage();
    console.log('Local storage:');
    console.log(localStorage);
}
// Main initialization
async function initializeApp() {
    try {
        const scriptUrl = `https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@${await getLatestCommitHash()}/code/dnd.js`;
        await loadExternalScript(scriptUrl);
        console.log('WE ARE IN: ', document.URL);
        if(document.URL.endsWith('/advanced-settings'))
            await loadAllStorageData();
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