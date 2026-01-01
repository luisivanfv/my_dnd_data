const websiteRoot = 'https://blindingdarkness.obsidianportal.com';
const keywordColorInStatblock = '#997300';
const keywordSizeInStatblock = '14px';
const iconColor = '8B0000';
const iconSize = '26';
const smallIconSize = '17';
const damageTypeIconSize = "20";
const txtSize = '16px';
const lookerTxtSize = '16px';
const specialTextColor = 'FAB005';
const actionTitleTxtSize = '14px';
const soundIconSize = '30';
const secondsPopupShown = 5;
const damageTypes = ['Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic', 'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder'];
window.githubRoot = `https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@${window.latestCommitHash}/`;


window.initializeExternalScript = async function() {
    document.body.classList.add('loading');
        //await loadEncounterTables();
        //loadEncounterLoaders();
        //loadCustomAccordions();
        loadPageBackgrounds();
        await recolor();
        //await fetchFolderDataSequentially();
        await loadStatblocks();
        await loadSpells();
        await loadCharacters();
        //await loadEncounters();
        await loadLocations();
        //await loadSearchBoxes();
        await loadWikiLists();
        await loadLookers();
        await renameWikisWithNames();
        addSearchBarStyles();
        convertToSearchBar();
        addEncounterTableStyles();
        convertToEncounterTable();
        initLazyPreviews();
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
};
// Make helper functions globally available
window.showNumberPrompt = function(currentValue, callback) {
    const modal = document.createElement('div');
    modal.className = 'number-prompt-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-width: 300px;
    `;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentValue;
    input.style.cssText = `
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        font-size: 16px;
        box-sizing: border-box;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'OK';
    confirmButton.addEventListener('click', () => {
        const value = input.value; // Don't parse as int to allow text for HP
        callback(value);
        document.body.removeChild(modal);
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const value = input.value;
            callback(value);
            document.body.removeChild(modal);
        }
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    
    modalContent.appendChild(document.createTextNode('Enter value:'));
    modalContent.appendChild(input);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    input.focus();
    input.select();
    
    return modal;
};
// Add this global function for text prompts
window.showTextPrompt = function(currentValue, callback, title = 'Enter text:') {
    const modal = document.createElement('div');
    modal.className = 'text-prompt-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-width: 300px;
        max-width: 500px;
    `;
    
    const textarea = document.createElement('textarea');
    textarea.value = currentValue;
    textarea.style.cssText = `
        width: 100%;
        height: 100px;
        padding: 10px;
        margin: 10px 0;
        font-size: 16px;
        box-sizing: border-box;
        resize: vertical;
        font-family: inherit;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'OK';
    confirmButton.addEventListener('click', () => {
        callback(textarea.value);
        document.body.removeChild(modal);
    });
    
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            callback(textarea.value);
            document.body.removeChild(modal);
        }
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    
    modalContent.appendChild(document.createTextNode(title));
    modalContent.appendChild(textarea);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    textarea.focus();
    textarea.select();
    
    return modal;
};
async function loadLocations() {
    Array.from(document.getElementsByClassName('location')).forEach(async (element) => {
        const locationSlug = getUrlParameter('name');
        if(!locationSlug) return;
        const locationData = JSON.parse(localStorage.getItem(`locations_${locationSlug}.json`));
        html = `<div id="${locationSlug}" class="location">
            <span style="color: white">${enrichText(locationData.description, { fontColor: specialTextColor })}</span>
            `;
        if(locationData.inhabitants.length > 0) {
            html += `<div class="op_accordion ui-accordion ui-widget ui-helper-reset" role="tablist">
                <h3 class="ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all" role="tab" id="ui-accordion-1-header-0" aria-controls="ui-accordion-1-panel-0" aria-selected="false" tabindex="0" data-accordion-key="habitantes" style="background: rgb(28, 28, 28); color: rgb(242, 242, 242);"><span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"></span> Habitantes </h3>
            <div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom" id="ui-accordion-1-panel-0" aria-labelledby="ui-accordion-1-header-0" role="tabpanel" aria-expanded="false" aria-hidden="true" style="display: none; background: rgb(28, 28, 28); overflow: hidden;">
            <ul>`;
            locationData.inhabitants.forEach((inhabitant) => {
                html += `<li style="color: rgb(242, 242, 242);"><a href="/character?t=${inhabitant.toLowerCase().replaceAll(' ', '-')}" class="wiki-content-link">${inhabitant}</a></li>`;
            });
            html += `</ul>
            </div>
            </div>`;
        }
        html += `
        </div>`;
        element.outerHTML = html;
    });
}
async function loadCharacters() {
    Array.from(document.getElementsByClassName('character')).forEach(async (element) => {
        const replacements = await buildAllReplacements(true, true, true, true, true, statblockReplacementColor, statblockFontSize);
        const characterSlug = getUrlParameter('name');
        if(!characterSlug) return;
        const characterData = JSON.parse(localStorage.getItem(`characters_${characterSlug}.json`));
        html = `<div id="${characterSlug}" class="character">
            <span style="color: white">${enrichText(characterData.description, replacements, { fontColor: specialTextColor })}</span>`;
        html += `</div>`;
        element.outerHTML = html;
    });
}
function addSpellComponentIcons(txt) {
    txt = txt.replaceAll(', ', '   ');
    const replacements = {
        'V': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/sf-black-filled/64/${specialTextColor}/medium-volume.png" alt="medium-volume"/>`,
        'S': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/pastel-glyph/64/${specialTextColor}/hand--v3.png" alt="hand--v3"/>`,
        'M': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/ios-filled/50/${specialTextColor}/diamond--v1.png" alt="diamond--v1"/>`
    };
    return replaceIcons(txt, replacements);
}
function addRangeOrAreaIcons(txt) {
    const replacements = {
        'Touch': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/pastel-glyph/64/${specialTextColor}/hand--v3.png" alt="hand--v3"/>`,
        'distance': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/deco-glyph/48/${specialTextColor}/goal.png" alt="goal"/>`,
        'cone': `<img style="transform: rotate(270deg);" width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/external-tanah-basah-basic-outline-tanah-basah/24/${specialTextColor}/external-line-shapes-tanah-basah-basic-outline-tanah-basah-4.png" alt="external-line-shapes-tanah-basah-basic-outline-tanah-basah-4"/>`,
        'sphere': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/external-outline-black-m-oki-orlando/32/${specialTextColor}/external-sphere-math-vol-2-outline-outline-black-m-oki-orlando.png" alt="external-sphere-math-vol-2-outline-outline-black-m-oki-orlando"/>`,
        'line': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/sf-black-filled/64/${specialTextColor}/line.png" alt="line"/>`
    };
    return replaceIcons(txt, replacements);
}
function addCastingTimeIcons(txt) {
    const replacements = {
        '(Ritual)': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/pulsar-line/48/${specialTextColor}/pentagram-devil.png" alt="pentagram-devil"/>`,
        '1 Action': `<img width="${smallIconSize}" height="${smallIconSize}" src="https://img.icons8.com/ios-filled/50/40C057/filled-circle.png" alt="filled-circle"/>`,
        'Action': `<img width="${smallIconSize}" height="${smallIconSize}" src="https://img.icons8.com/ios-filled/50/40C057/filled-circle.png" alt="filled-circle"/>`,
        'Bonus Action': `<img width="${smallIconSize}" height="${smallIconSize}" src="https://img.icons8.com/external-tanah-basah-glyph-tanah-basah/48/FD7E14/external-glyph-shapes-tanah-basah-glyph-tanah-basah-69.png" alt="external-glyph-shapes-tanah-basah-glyph-tanah-basah-69"/>`,
        '1 Bonus Action': `<img width="${smallIconSize}" height="${smallIconSize}" src="https://img.icons8.com/external-tanah-basah-glyph-tanah-basah/48/FD7E14/external-glyph-shapes-tanah-basah-glyph-tanah-basah-69.png" alt="external-glyph-shapes-tanah-basah-glyph-tanah-basah-69"/>`,
        'Reaction': `<img width="${smallIconSize}" height="${smallIconSize}" src="https://img.icons8.com/ios-filled/50/C850F2/star.png" alt="star"/>`,
        '1 Reaction': `<img width="${smallIconSize}" height="${smallIconSize}" src="https://img.icons8.com/ios-filled/50/C850F2/star.png" alt="star"/>`,
    };
    return replaceIcons(txt, replacements);
}
async function loadSpells() {
    Array.from(document.getElementsByClassName('spell')).forEach(async (element) => {
        let spellSearched = element.id.toString().split('_spell')[0].replace('_', ' ');
        if(spellSearched == 'spell')
            spellSearched = getUrlParameter('name');
        else
            return;
        const spellInfo = JSON.parse(localStorage.getItem(`spells_${spellSearched}.json`));
        if (!spellInfo) return;
        element.outerHTML = `<div id="${element.id}" class="loaded_spell" style="color: white;">
            <strong>Level</strong> ${spellInfo.level}<br><br>
            <strong>Casting time</strong> ${addCastingTimeIcons(spellInfo.castingTime)}<br><br>
            <strong>Range/Area</strong> ${addRangeOrAreaIcons(spellInfo.rangeOrArea)}<br><br>
            <strong>Components</strong> ${addSpellComponentIcons(spellInfo.components)}<br><br>
            <strong>Duration</strong> ${spellInfo.duration}<br><br>
            <strong>School</strong> ${spellInfo.school}<br><br>
            <strong>Attack/Save</strong> ${spellInfo.attackOrSave}<br><br>
            <strong>Damage/Effect</strong> ${spellInfo.damageOrEffect}<br><br>
            <hr>
            ${enrichText(spellInfo.description, { fontColor: iconColor, addSpellUrls: false })}
            <hr>
            <a href="/wikis/spells" class="wiki-page-link">< Spells</a>
        </div>`;
    });
}
function toPrettyListName(str) {
    let result = '';
    let capitalizeNext = true;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '-') {
            result += ' ';
            capitalizeNext = true;
        } else if (capitalizeNext) {
            result += char.toUpperCase();
            capitalizeNext = false;
        } else
            result += char;
    }
    return result;
}
async function loadWikiLists() {
    Array.from(document.getElementsByClassName('wiki_list')).forEach(async (element) => {
        let html = `<ul>`;
        let array = JSON.parse(localStorage.getItem(element.id));
        let genericWikiName = element.innerHTML;
        await fetchMapIfNotSet('colors');
        array.forEach((item) => {
            if(item != '_example.json') {
                const articleName = item.replace('.json', '');
                html += `<li><a class="lazy-preview-link" href="${genericWikiName}?name=${articleName}"
                            data-url="${genericWikiName}?name=${articleName}"
                            data-text="${toPrettyListName(articleName)}"
                            style="color: ${window.colors.get('gambobe')}; font-size: ${lookerTxtSize}; cursor: pointer;">
                                ${toPrettyListName(articleName)}
                            </a></li>`;
            }
        });
        element.innerHTML = `${html}</ul>`;
    });
}
function positionPreviewNearCursor(event) {
    const container = document.getElementById('global-preview-container');
    if (!container || container.style.display === 'none') return;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const spaceOnLeft = event.clientX;
    const spaceOnRight = windowWidth - event.clientX;
    container.style.height = windowHeight + 'px';
    container.style.top = '0';
    container.style.left = '';
    container.style.right = '';
    container.style.width = '';
    container.style.borderRadius = '';
    if (spaceOnRight >= spaceOnLeft) {
        container.style.left = event.clientX + 'px';
        container.style.right = '0';
        container.style.width = 'auto';
        container.style.borderRadius = '8px 0 0 8px';
    } else {
        container.style.left = '0';
        container.style.right = (windowWidth - event.clientX) + 'px';
        container.style.width = 'auto';
        container.style.borderRadius = '0 8px 8px 0';
    }
    container.style.maxHeight = windowHeight + 'px';
    container.style.overflowY = 'auto';
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
}
function showLazyPreview(link, event) {
    window.lastPreviewMouseEvent = event;
    const container = document.getElementById('global-preview-container');
    const url = link.getAttribute('data-url');
    const text = link.getAttribute('data-text');
    container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #666;">
            <div style="font-size: 16px; margin-bottom: 10px;">Loading preview...</div>
            <div style="font-size: 12px;">${text}</div>
        </div>
    `;
    container.style.display = 'block';
    positionPreviewNearCursor(event);
    setTimeout(() => {
        const windowHeight = window.innerHeight;
        const iframeHeight = windowHeight - 20;
        container.innerHTML = `
            <div style="position: relative; height: 100%;">
                <button onclick="hideLazyPreview()" style="
                    position: absolute; top: 5px; right: 5px; background: #333; color: white; border: none; border-radius: 50%; width: 25px;
                    height: 25px; cursor: pointer; z-index: 10000; font-size: 16px; line-height: 1;">x</button>
                <iframe 
                    src="${url}" 
                    style="width: 100%; height: ${iframeHeight}px; border: none; pointer-events: auto;"
                    loading="lazy"
                    title="Preview of ${text}">
                </iframe>
            </div>
        `;
    }, 100);
}
async function loadLookers() {
    document.querySelectorAll('.looker').forEach(async (looker) => {
        let fullTxt = looker.innerHTML;
        let txt = '';
        let url = '';
        if(fullTxt.includes('=')) {
            if(fullTxt.includes('http')) {
                url = fullTxt.split('=')[1].trim();
            } else {
                if(fullTxt.split('=')[1].includes('/'))
                    url = `${websiteRoot}/${fullTxt.split('=')[1].trim().toLowerCase().replaceAll(' ', '-')}`;
                else
                    url = `${websiteRoot}/wikis/${fullTxt.split('=')[1].trim().toLowerCase().replaceAll(' ', '-')}`;
            }
            txt = fullTxt.split('=')[0].trim();
        } else {
            url = `${websiteRoot}/wikis/${fullTxt.toLowerCase().trim().replaceAll(' ', '-')}`;
            txt = fullTxt.trim();
        }
        await fetchMapIfNotSet('colors');
        looker.outerHTML = `<a class="lazy-preview-link" href="${url}"
           data-url="${url}"
           data-text="${txt.replace(/"/g, '&quot;')}"
           style="color: ${window.colors.get('gambobe')}; font-size: ${lookerTxtSize}; cursor: pointer;">
            ${txt}
        </a>`;
    });
}
class PopupManager {
    constructor() {
        this.element = null;
        this.timeout = null;
        this.defaultDuration = secondsPopupShown * 1000;
    }
    
    show(message, seconds = secondsPopupShown) {
        // Clear existing timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        
        // Create or update popup
        if (!this.element) {
            this.element = this.createPopup();
            document.body.appendChild(this.element);
            
            // Fade in
            setTimeout(() => {
                this.element.style.opacity = '1';
            }, 10);
        }
        
        // Update content
        this.element.innerHTML = message;
        
        // Set new timeout
        this.timeout = setTimeout(() => this.hide(), seconds * 1000);
    }
    
    createPopup() {
        const element = document.createElement('div');
        Object.assign(element.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#333',
            color: '#' + specialTextColor,
            padding: '12px 20px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '9999',
            fontSize: '18px',
            fontWeight: '500',
            maxWidth: '300px',
            pointerEvents: 'none',
            cursor: 'default',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });
        return element;
    }
    
    hide() {
        if (!this.element) return;
        
        this.element.style.opacity = '0';
        
        setTimeout(() => {
            if (this.element && document.body.contains(this.element)) {
                document.body.removeChild(this.element);
                this.element = null;
            }
        }, 300);
    }
    
    // Optional: Force immediate hide
    hideNow() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.hide();
    }
}
const popup = new PopupManager();
function is_numeric(str){
    return /^\d+$/.test(str);
}
function getUrlParameter(name) {
    try {
        const url = new URL(window.location.href);
        const value = url.searchParams.get(name);
        return value !== null ? value : null;
    } catch (error) {
        console.error("Invalid URL or parameter error:", error);
        return null;
    }
}
/*async function getJson(url) {
    const response = await fetch(`${window.githubRoot}${url}.json?t=${Date.now()}`);
    return await response.json(`${window.githubRoot}${url}.json?t=${Date.now()}`);
}*/
async function getJsonMap(url) {
    const response = await fetch(`${window.githubRoot}${url}.json?t=${Date.now()}`);
    const jsonObject = await response.json()
    return new Map(Object.entries(jsonObject));
}
function addSavingThrowField(title, value, modifier) {
    return `<div class="ability-${title.toLowerCase()}">
        <h3 style="font-weight: bold;" oncontextmenu="makeSavingThrow('${title}', '${modifier}');" onclick="makeSavingThrow('${title}', '${modifier}'); ">${title}</h3>
        <p>${value} (${modifier})</p>
    </div>`;
}
function makeSavingThrow(title, mod) {
    window.event.preventDefault();
    mod = parseInt(mod);
    let roll = rollDie(20);
    if(mod != 0) {
        let symbol = mod > 0 ? '+' : '-';
        popup.show(`${colorText(`${title} check = ${roll.toString()} ${symbol} ${Math.abs(mod).toString()} = `, 'white')}${Math.max((roll + mod), 1).toString()}`);
    } else
        popup.show(`${colorText(`${title} check = `, 'white')}${roll.toString()}`);
}
async function buildAllReplacements(addWikiUrls, addSpellUrls, addCreatureUrls, addLocationUrls, addCharacterUrls, fontColor, fontSize) {
    const allEntries = [];
    
    if (addWikiUrls) {
        const keywords = await fetchIfNotSet('keywords');
        for (const [keyword, url] of Object.entries(keywords)) {
            allEntries.push(
                [keyword, keywordToUrl(keyword, fontColor, url, fontSize)],
                [toUpper(keyword), keywordToUrl(toUpper(keyword), fontColor, url, fontSize)]
            );
        }
    }
    if (addSpellUrls) {
        const spells = await getKeywordsFromFolder('spells');
        for (const spell of spells) {
            const slug = `spell?name=${spell.replaceAll(' ', '-')}`;
            allEntries.push(
                [spell, keywordToUrl(spell, fontColor, slug, fontSize)],
                [toUpper(spell), keywordToUrl(toUpper(spell), fontColor, slug, fontSize)]
            );
        }
    }
    if (addCreatureUrls) {
        const creatures = await getKeywordsFromFolder('statblocks');
        for (const creature of creatures) {
            const slug = `creature?name=${creature.replaceAll(' ', '-')}`;
            allEntries.push(
                [creature, keywordToUrl(creature, 'black', slug, fontSize)],
                [toUpper(creature), keywordToUrl(toUpper(creature), 'black', slug, fontSize)]
            );
        }
    }
    if (addLocationUrls) {
        const locations = await getKeywordsFromFolder('locations');
        for (const location of locations) {
            const slug = `location?name=${location.replaceAll(' ', '-')}`;
            allEntries.push(
                [location, keywordToUrl(location, fontColor, slug, fontSize)],
                [toUpper(location), keywordToUrl(toUpper(location), fontColor, slug, fontSize)]
            );
        }
    }
    if (addCharacterUrls) {
        const characters = await getKeywordsFromFolder('characters');
        for (const character of characters) {
            const slug = `character?name=${character.replaceAll(' ', '-')}`;
            allEntries.push(
                [character, keywordToUrl(character, fontColor, slug, fontSize)],
                [toUpper(character), keywordToUrl(toUpper(character), fontColor, slug, fontSize)]
            );
        }
    }
    
    // Sort entries by key in reverse alphabetical order
    allEntries.sort(([keyA], [keyB]) => keyB.localeCompare(keyA));
    
    // Convert to object (last value wins for duplicates)
    const result = {};
    for (const [key, value] of allEntries) {
        result[key] = value;
    }
    
    return result;
}
function colorText(txt, color) {
    return `<span style="color: ${color}">${txt}</span>`;
}
function rollDie(dieSize) {
    return Math.floor(Math.random() * dieSize) + 1;
}
function addToHitFormulas(str, options = {}) {
    let foundInstances = [];
    for(let i=0;i<str.length;i++) {
        if(i<str.length - ' to hit'.length) {
            let followingStr = str.substring(i+1);
            if(followingStr.startsWith(' to hit'))
                if(is_numeric(str[i]) && str[i-1] == '+')
                    foundInstances.push(str.substring(i-1,i+1) + ' to hit');
        }
    }
    for(let i=0;i<foundInstances.length;i++)
        str = str.replace(foundInstances[i], addDieModalCaller(foundInstances[i], options));
    return str;
}
function updateModalText(formula) {
    if(formula.includes('d')) {
        let numberOfDie = parseInt(formula.split('d')[0].trim());
        let remainingFormula = formula.split('d')[1].trim();
        let dieSize = 0;
        let extra = 0;
        if(remainingFormula.includes('+')) {
            dieSize = parseInt(remainingFormula.split('+')[0].trim());
            extra = parseInt(remainingFormula.split('+')[1].trim());
        } else if(remainingFormula.includes('-')) {
            dieSize = parseInt(remainingFormula.split('-')[0].trim());
            extra = parseInt(remainingFormula.split('-')[1].trim()) * -1;
        } else
            dieSize = parseInt(formula.split('d')[1].trim());
        let result = 0;
        for(let i=0;i<numberOfDie;i++) result += rollDie(dieSize);
        popup.show(`${colorText(`${formula} = `, 'white')}${Math.max((result + extra), 1).toString()}`);
    } else if(formula.includes('to hit')) {
        let newFormula = formula;
        let numberStr = newFormula.replace('to hit', '').trim();
        if(numberStr.includes('+')) {
            numberStr = numberStr.replace('+', '').trim();
            let number = parseInt(numberStr);
            let roll = rollDie(20);
            if(roll == 1) popup.show(colorText('Nat 1', 'red'));
            else if(roll == 20) popup.show('Nat 20!');
            else popup.show(`${colorText(`${roll.toString()} + ${number.toString()} = `, 'white')}${(roll + number).toString()}`);
        }
    }
}
function hideLazyPreview() {
    const container = document.getElementById('global-preview-container');
    container.style.display = 'none';
}
async function renameWikisWithNames() {
    if(getUrlParameter('name'))
        Array.from(document.getElementsByClassName('wiki-page-name')).forEach((element) => {
            const name = toUpper(getUrlParameter('name').replaceAll('-', ' ')).replace("Scoiatael", "Scoia'tael");
            element.innerHTML = name;
            document.title = name;
        });
}
const toggleModal = (element) => {
    window.event.preventDefault();
    if(element && !element.innerHTML.trim().startsWith('<'))
        updateModalText(element.innerHTML);
};
function addDieModalCaller(str, options = {}) {
    const {
        fontColor = 'darkred',
        fontSize = txtSize
    } = options;
    return `<a oncontextmenu="toggleModal(this)" onclick="toggleModal(this)" style="cursor: pointer; color: ${fontColor}; font-size: ${fontSize};">${str}</a>`;
}
function replaceFormulasWithLinks(text, options = {}) {
    return text.replace(/\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/g, (match) => {
        return addDieModalCaller(match, options);
    });
}
function styleFormat(str, keywords, tag) {
    if(!str) return '';
    for(let i=0;i<keywords.length;i++)
        if(str.includes(keywords[i])) {
            let pieces = str.split(keywords[i]);
            str = pieces[0] + '<'+tag+'>' + keywords[i] + '</'+tag+'>' + pieces[1];
        }
    return str;
}
function addTextStyling(str) {
    let keywords_to_italic = ['Hit:', 'Melee Weapon Attack:', 'Melee Spell Attack', 'Ranged Weapon Attack:', 'Ranged Spell Attack'];
    let keywords_to_bold = [];
    return styleFormat(styleFormat(str, keywords_to_italic, 'i'), keywords_to_bold, 'b');
}
/*function keywordToUrl(txt, color, url, fontSize) {
    if (!url) return color ? `<span style="color:${color}">${txt}</span>` : txt;
    return getImagePreview(url, txt, color, fontSize);
}*/
async function loadStatblocks() {
    Array.from(document.getElementsByClassName('statblock')).forEach(async (element) => {
        let creatureSearched = element.id.toString().split('_statblock')[0].replaceAll('_', ' ');
        if(creatureSearched == 'creature')
            creatureSearched = getUrlParameter('name');
        else
            return;
        const creatureInfo = await getJson(`statblocks/${creatureSearched}.json`);
        const allReplacements = JSON.parse(localStorage.getItem('allReplacements'));
        if (!creatureInfo) return;
        element.outerHTML = `
            <div id="global-image-preview" class="global-image-preview">
                <img src="" alt="" style="max-width: 300px; max-height: 200px; display: block;">
            </div>
            <div id="statblock_${creatureSearched}" class="stat-block wide">
                <hr class="orange-border" />
                <div class="section-left">
                    <div class="creature-heading">
                        ${getImagePreview(window.githubRoot + 'images/monsters/' + creatureSearched + ".jpeg", creatureInfo.name, null, '26px')}
                        <h2 style="font-size: 15px;">${enrichText(creatureInfo.creatureType, allReplacements, { fontColor: 'black' })}</h2>
                        <div class="soundboard">${await getSoundboardForCreature(creatureInfo.sounds)}</div>
                    </div>
                    <hr>
                    <div class="top-stats">
                        ${await addSectionIfExists(creatureInfo.armorClass, allReplacements, "Armor Class", { fontColor: 'black', fontSize: keywordSizeInStatblock })}
                        ${await addSectionIfExists(creatureInfo.hitPoints, allReplacements, "Hit Points", { fontColor: keywordColorInStatblock, fontSize: keywordSizeInStatblock })}
                        ${await addSectionIfExists(creatureInfo.speed, allReplacements, "Speed", { fontColor: 'black', fontSize: keywordSizeInStatblock })}
                        <hr>
                        <div class="abilities">
                            ${addSavingThrowField("STR", creatureInfo.str, creatureInfo.strSave)}
                            ${addSavingThrowField("DEX", creatureInfo.dex, creatureInfo.dexSave)}
                            ${addSavingThrowField("CON", creatureInfo.con, creatureInfo.conSave)}
                            ${addSavingThrowField("INT", creatureInfo.int, creatureInfo.intSave)}
                            ${addSavingThrowField("WIS", creatureInfo.wis, creatureInfo.wisSave)}
                            ${addSavingThrowField("CHA", creatureInfo.cha, creatureInfo.chaSave)}
                        </div>
                        <hr>
                        ${await addSectionIfExists(creatureInfo.savingThrows, allReplacements, "Saving Throws", { fontColor: keywordColorInStatblock, fontSize: keywordSizeInStatblock })}
                        ${await toResistanceOrImmunityField(creatureInfo.damageVulnerabilities, "Damage Vulnerabilities")}
                        ${await toResistanceOrImmunityField(creatureInfo.damageResistances, "Damage Resistances")}
                        ${await toResistanceOrImmunityField(creatureInfo.damageImmunities, "Damage Immunities")}
                        ${await addSectionIfExists(creatureInfo.conditionImmunities, allReplacements, "Condition Immunities", { fontColor: keywordColorInStatblock, fontSize: keywordSizeInStatblock })}
                        ${await addSectionIfExists(creatureInfo.senses, allReplacements, "Senses", { fontColor: 'black', fontSize: keywordSizeInStatblock })}
                        ${await addSectionIfExists(creatureInfo.languages, allReplacements, "Languages", { fontColor: 'black', fontSize: keywordSizeInStatblock })}
                        ${await addSectionIfExists(creatureInfo.challenge, allReplacements, "Challenge", { fontColor: 'black', fontSize: keywordSizeInStatblock })}
                        ${await addSectionIfExists(creatureInfo.proficiencyBonus, allReplacements, "Proficiency Bonus", { fontColor: 'black', fontSize: keywordSizeInStatblock })}
                    </div>
                    <hr>
                    ${await toActionSection(creatureInfo.passives, allReplacements, '', { fontColor: keywordColorInStatblock, fontSize: keywordSizeInStatblock })}
                </div>
                <div class="section-right">
                    ${await toActionSection(creatureInfo.actions, allReplacements, 'Actions', { fontColor: keywordColorInStatblock, fontSize: keywordSizeInStatblock })}
                    ${await toActionSection(creatureInfo.reactions, allReplacements, 'Reactions', { fontColor: keywordColorInStatblock, fontSize: keywordSizeInStatblock })}
                    ${await toActionSection(creatureInfo.bonusActions, allReplacements, 'Bonus Actions', { fontColor: keywordColorInStatblock, fontSize: keywordSizeInStatblock })}
                    ${await toActionSection(creatureInfo.legendaryActions, allReplacements, 'Legendary Actions', { fontColor: keywordColorInStatblock, fontSize: keywordSizeInStatblock })}
                </div>
                <hr class="orange-border bottom" />
            </div>
            <p style="color: rgb(242, 242, 242);"><a href="/wikis/creatures" class="wiki-page-link">&lt; Creatures</a></p>`;
    });
}
function hideImagePreview(id) {
    const preview = document.getElementById(id);
    if (preview)
        preview.style.display = 'none';
}
function handleImagePreviewMouseLeave(event, previewId) {
    // Check if we're moving to the preview
    if (isMovingBetweenLinkAndPreview(event, previewId))
        return;
    
    // Clear hover timer
    if (window.imagePreviewState.hoverTimer) {
        clearTimeout(window.imagePreviewState.hoverTimer);
        window.imagePreviewState.hoverTimer = null;
    }
    
    // Set hide timer
    window.imagePreviewState.hideTimer = setTimeout(() => {
        if (window.imagePreviewState.currentPreviewId === previewId) {
            hideImagePreview(previewId);
            window.imagePreviewState.currentPreviewId = null;
            window.imagePreviewState.isPreviewVisible = false;
        }
    }, 0);
}
function isMovingBetweenLinkAndPreview(event, previewId) {
    const link = document.querySelector(`[data-preview-id="${previewId}"]`);
    const preview = document.getElementById(previewId);
    
    if (!link || !preview) return false;
    
    const target = event.target;
    const relatedTarget = event.relatedTarget;
    
    // Check if moving from link to preview
    if ((target === link || link.contains(target)) && 
        relatedTarget && preview.contains(relatedTarget)) {
        return true;
    }
    
    // Check if moving from preview to link
    if (target && preview.contains(target) && 
        relatedTarget && (relatedTarget === link || link.contains(relatedTarget))) {
        return true;
    }
    
    return false;
}
window.imagePreviewState = {
    hoverTimer: null,
    hideTimer: null,
    currentPreviewId: null,
    isPreviewVisible: false
};
window.addEventListener('resize', () => {
    const container = document.getElementById('global-preview-container');
    if (container && container.style.display === 'block') {
        if (window.lastPreviewMouseEvent) {
            positionPreviewNearCursor(window.lastPreviewMouseEvent);
            const iframe = container.querySelector('iframe');
            if (iframe)
                iframe.style.height = (window.innerHeight - 20) + 'px';
        }
    }
    document.querySelectorAll('.image-preview-container').forEach(preview => {
        if (preview.style.display === 'block' && window.lastImagePreviewEvent) {
            positionImagePreview(preview, window.lastImagePreviewEvent);
        }
    });
});
function positionImagePreview(preview, event) {
    if (!preview) return;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate available space on both sides
    const spaceOnLeft = event.clientX;
    const spaceOnRight = windowWidth - event.clientX;
    
    // Set full vertical height
    preview.style.height = windowHeight + 'px';
    preview.style.top = '0';
    preview.style.maxHeight = windowHeight + 'px';
    
    // Reset all positioning properties
    preview.style.left = '';
    preview.style.right = '';
    preview.style.width = '';
    preview.style.borderRadius = '';
    
    if (spaceOnRight >= spaceOnLeft) {
        // Position on the right side - use all space from cursor to right edge
        preview.style.left = event.clientX + 'px';
        preview.style.right = '0';
        preview.style.width = 'auto';
        preview.style.borderRadius = '8px 0 0 8px';
    } else {
        // Position on the left side - use all space from left edge to cursor
        preview.style.left = '0';
        preview.style.right = (windowWidth - event.clientX) + 'px';
        preview.style.width = 'auto';
        preview.style.borderRadius = '0 8px 8px 0';
    }
    
    // Center the image vertically and horizontally
    const imageWrapper = preview.querySelector('.image-wrapper');
    if (imageWrapper) {
        imageWrapper.style.display = 'flex';
        imageWrapper.style.alignItems = 'center';
        imageWrapper.style.justifyContent = 'center';
        imageWrapper.style.height = '100%';
    }
}

const AudioManager = {
    sounds: new Map(),
    
    // Preload sounds (optional, for better performance)
    preloadSound: function(name, url) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
        this.sounds.set(name, audio);
    },
    
    // Play a sound by URL
    playSound: function(url, options = {}) {
        const audio = new Audio(url);
        if (options.volume !== undefined) audio.volume = options.volume;
        if (options.loop) audio.loop = options.loop;
        if (options.playbackRate !== undefined) audio.playbackRate = options.playbackRate;
        audio.play().catch(error => {
            if (error.name === 'NotAllowedError') {
                console.log('Audio blocked. Will play on next user interaction.');
            }
        });
        if (!options.loop)
            audio.onended = () => {
                audio.src = '';
                audio.remove();
            };
        return audio;
    },
    
    // Play a preloaded sound by name
    playPreloaded: function(name, options = {}) {
        const audio = this.sounds.get(name);
        if (!audio) {
            console.error(`Sound "${name}" not found`);
            return null;
        }
        
        // Reset audio to start if already playing
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
        
        // Set options
        if (options.volume !== undefined) audio.volume = options.volume;
        if (options.loop) audio.loop = options.loop;
        
        audio.play().catch(error => {
            console.warn(`Could not play sound "${name}":`, error);
        });
        
        return audio;
    }
};
function showImagePreview(id, url, txt, event) {
    const preview = document.getElementById(id);
    if (!preview) return;
    
    // Store the event for resize handling
    window.lastImagePreviewEvent = event;
    
    // Position the preview first
    positionImagePreview(preview, event);
    
    // Show the preview
    preview.style.display = 'block';
    window.imagePreviewState.isPreviewVisible = true;
    
    // Add mouseenter event to the preview container
    preview.addEventListener('mouseenter', function() {
        // Clear any hide timer when mouse enters preview
        if (window.imagePreviewState.hideTimer) {
            clearTimeout(window.imagePreviewState.hideTimer);
            window.imagePreviewState.hideTimer = null;
        }
    });
    
    // Add mouseleave event to the preview container
    preview.addEventListener('mouseleave', function(previewEvent) {
        // Check if we're moving back to the link
        const relatedTarget = previewEvent.relatedTarget;
        const link = document.querySelector(`[data-preview-id="${id}"]`);
        
        if (relatedTarget && link && (link === relatedTarget || link.contains(relatedTarget))) {
            // We're moving back to the link, don't hide
            return;
        }
        
        // Set hide timer when leaving preview
        window.imagePreviewState.hideTimer = setTimeout(() => {
            hideImagePreview(id);
            window.imagePreviewState.currentPreviewId = null;
            window.imagePreviewState.isPreviewVisible = false;
        }, 300);
    });
    
    // Check if image is already loaded
    const img = preview.querySelector('.preview-image');
    if (img && img.complete) {
        // Image already loaded
    } else if (img) {
        // Wait for image to load
        img.onload = function() {
            // Image loaded
        };
    }
}
function handleImagePreviewMouseEnter(event, previewId, url, txt) {
    event.preventDefault();
    const preview = document.getElementById(previewId);
    if (!preview) return;
    
    // Clear any pending hide timer
    if (window.imagePreviewState.hideTimer) {
        clearTimeout(window.imagePreviewState.hideTimer);
        window.imagePreviewState.hideTimer = null;
    }
    
    // If preview is already showing for this link, don't do anything
    if (window.imagePreviewState.currentPreviewId === previewId && 
        window.imagePreviewState.isPreviewVisible) {
        return;
    }
    
    // Clear any existing hover timer
    if (window.imagePreviewState.hoverTimer)
        clearTimeout(window.imagePreviewState.hoverTimer);

    window.imagePreviewState.hoverTimer = setTimeout(() => {
        showImagePreview(previewId, url, txt, event);
        window.imagePreviewState.currentPreviewId = previewId;
        window.imagePreviewState.isPreviewVisible = true;
    }, 0);
}
async function getSoundboardForCreature(sounds) {
    if (!sounds) return '';
    let html = '';
    await fetchMapIfNotSet('icons');
    Array.from(sounds).forEach((sound) => {
        let iconData = window.icons.get(sound.icon);
        let iconUrl = iconData.split('||')[0].replace('customColor', iconColor);
        let iconAlt = iconData.includes('||') ? iconData.split('||')[1] : '';
        if(sound.icon)
            html += `
                <img oncontextmenu="playSoundIfPossible('${sound.sound}');" onclick="playSoundIfPossible('${sound.sound}');" width="${soundIconSize}" height="${soundIconSize}"
                    src="${iconUrl}" alt="${iconAlt}"/>
                `;
        else
            html += `<span oncontextmenu="playSoundIfPossible('${sound.sound}');" onclick="playSoundIfPossible('${sound.sound}');">${sound.name}</span>`;
    });
    return html;
}
async function toResistanceOrImmunityField(txt, title) {
    if(!txt || txt.trim() == '') return '';
    txt = txt.replaceAll(',', '');
    return `<div class="property-line">
        <h4>${title} </h4>${await addDamageTypeIcons(txt)}
    </div>`;
}
function replaceIcons(txt, replacements) {
    const escapedKeys = Object.keys(replacements).map(key => 
        key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const pattern = new RegExp(escapedKeys.join('|'), 'g');
    return txt.replace(pattern, match => replacements[match]);
}
async function addDamageTypeIcons(txt) {
    const replacements = {};
    await fetchMapIfNotSet('icons');
    damageTypes.forEach((damageType) => {
        let iconData = window.icons.get(damageType.toLowerCase());
        let iconUrl = iconData.split('||')[0].replace('customColor', iconColor);
        let iconAlt = iconData.includes('||') ? iconData.split('||')[1] : '';
        replacements[damageType] = `<img width="${damageTypeIconSize}" height="${damageTypeIconSize}" src="${iconUrl}" alt="${iconAlt}" title="${damageType}"/>`;
    });
    return replaceIcons(txt, replacements);
}
async function addSectionIfExists(txt, replacements, title, options) {
    if(!txt || txt.trim() == '') return '';
    const enrichedText = enrichText(txt, replacements, options);
    return `<div class="property-line">
        <h4>${title} </h4>${enrichedText}
    </div>`;
}
function playSoundIfPossible(soundUrl) {
    window.event.preventDefault();
    AudioManager.playSound(`${window.githubRoot}sound_effects/${soundUrl}.mp3`, {volume: 0.5});
}
function enrichText(txt, replacements, options = {}) {
    const {
        styleText = true,
        addDieRolls = true,
        addToHit = true,
        fontColor = '#ffffff',
        fontSize = '16px'
    } = options;
    if(styleText) txt = addTextStyling(txt);
    if(addDieRolls) txt = replaceFormulasWithLinks(txt, { fontColor, fontSize });
    if(addToHit) txt = addToHitFormulas(txt, { fontColor, fontSize });
    return replaceIcons(txt, replacements);
}
async function toActionSection(actions, replacements, title, options) {
    if(!actions || actions.length == 0) return '';
    let inner_html = '';
    for(let action of actions) {
        let action_name = action.name.trim();
        let action_description = action.description.trim();
        let action_sound = action.sound ? action.sound : action.name.toLowerCase().trim();
        const richActionDescription = enrichText(action_description, replacements, options);
        if(action_name != '')
            inner_html += `<div class="property-block">
                <h4 oncontextmenu="playSoundIfPossible('${action_sound}');" onclick="playSoundIfPossible('${action_sound}');" style="font-size: ${actionTitleTxtSize}; font-weight: bold;">${action_name}. </h4>${richActionDescription}
            </div>`;
        else
            inner_html += `<div class="property-block">${richActionDescription}</div>`;
    }
    if(title.trim() == '') return `<div class="actions">${inner_html}</div>`;
    return `<div class="actions"><h3>${title}.</h3>${inner_html}</div>`;
}
function loadPageBackgrounds() {
    Array.from(document.getElementsByClassName('page-background')).forEach((element) => {
        element.style.backgroundImage = `url("https://i.pinimg.com/originals/ea/97/ef/ea97ef1a0002ed47e29e3532de801781.jpg")`;
    });
}
function changeElementPropertyIfExists(selector, property, value) {
    const elements = document.querySelectorAll(selector);
    for(let i=0;i<elements.length;i++) {
        if(property.trim() == 'outerHTML')
            elements[i].outerHTML = value;
        else if(property.trim() == 'innerHTML')
            elements[i].innerHTML = value;
        else
            elements[i].style[property.trim()] = value;
    }
}
async function recolor() {
    await fetchMapIfNotSet('colors');
    changeElementPropertyIfExists('.post-section', 'background', window.colors.get('dark jungle green'));
    changeElementPropertyIfExists('.post-section> div > p', 'color', window.colors.get('anti-flash white'));
    changeElementPropertyIfExists('.post-section > div > h3', 'color', window.colors.get('anti-flash white'));
    changeElementPropertyIfExists('.post-section > div > ul > li', 'color', window.colors.get('anti-flash white'));
    changeElementPropertyIfExists('.description > h6', 'color', window.colors.get('light gray'));
    changeElementPropertyIfExists('.description > .content > p', 'color', window.colors.get('anti-flash white'));
    changeElementPropertyIfExists('.op_accordion > h3', 'background', window.colors.get('dark jungle green'));
    changeElementPropertyIfExists('.op_accordion > h3', 'color', window.colors.get('anti-flash white'));
    changeElementPropertyIfExists('.ui-accordion-content', 'background', window.colors.get('dark jungle green'));
    changeElementPropertyIfExists('.ui-accordion-content > ul > li', 'color', window.colors.get('anti-flash white'));
    changeElementPropertyIfExists('.property-line', 'color', 'darkred');
    changeElementPropertyIfExists('.property-line', 'font-size', '14px');
    changeElementPropertyIfExists('.property-line > p', 'font-size', '14px');
    changeElementPropertyIfExists('#character-details', 'background', window.colors.get('dark jungle green'));
    changeElementPropertyIfExists('.wiki-page-name', 'color', window.colors.get('gambobe'));
    changeElementPropertyIfExists('.character-name', 'color', window.colors.get('gambobe'));
}
/*async function fetchIfNotSet(key) {
    if(!window[key])
        window[key] = await getJson(key);
    return window[key];
}*/
async function fetchMapIfNotSet(key) {
    if(!window[key])
        window[key] = await getJsonMap(key);
    return window[key];
}
function findParentWithClass(element, className) {
    while (element && element !== document) {
        if (element.classList && element.classList.contains(className))
            return element;
        element = element.parentNode;
    }
    return null;
}
function initLazyPreviews() {
    const previewContainer = document.createElement('div');
    previewContainer.id = 'global-preview-container';
    previewContainer.style.cssText = `
        position: fixed; display: none; z-index: 9999; background: white; border: 2px solid #333; border-radius: 8px 0 0 8px; padding: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3); pointer-events: auto; overflow-y: auto; top: 0; bottom: 0;`;
    document.body.appendChild(previewContainer);
    let hoverTimer;
    let isPreviewVisible = false;
    let currentHoveredLink = null;
    let previewHideTimer;
    document.addEventListener('click', function(e) {
        const link = findParentWithClass(e.target, 'lazy-preview-link');
        if (link) {
            clearTimeout(hoverTimer);
            clearTimeout(previewHideTimer);
            hideLazyPreview();
            isPreviewVisible = false;
        }
    }, true);
    document.addEventListener('contextmenu', function(e) {
        const link = findParentWithClass(e.target, 'lazy-preview-link');
        if (link) {
            e.preventDefault();
            currentHoveredLink = link;
            clearTimeout(hoverTimer);
            clearTimeout(previewHideTimer);
            
            hoverTimer = setTimeout(() => {
                if (currentHoveredLink === link) {
                    showLazyPreview(link, e);
                    isPreviewVisible = true;
                }
            }, 0);
        }
    }, true);
    document.addEventListener('mouseleave', function(e) {
        const link = findParentWithClass(e.target, 'lazy-preview-link');
        const preview = findParentWithClass(e.target, '#global-preview-container');
        if (link || preview)
            clearTimeout(previewHideTimer);
        if (link && !preview) {
            previewHideTimer = setTimeout(() => {
                if (!isMouseOverPreview()) {
                    hideLazyPreview();
                    isPreviewVisible = false;
                    currentHoveredLink = null;
                }
            }, 100);
        }
        if (preview && !link) {
            previewHideTimer = setTimeout(() => {
                if (!isMouseOverLink()) {
                    hideLazyPreview();
                    isPreviewVisible = false;
                    currentHoveredLink = null;
                }
            }, 300);
        }
    }, true);
    document.addEventListener('mouseout', function(e) {
        if (!e.relatedTarget && isPreviewVisible) {
            hideLazyPreview();
            isPreviewVisible = false;
            currentHoveredLink = null;
        }
    });
    function isMouseOverPreview() {
        const preview = document.getElementById('global-preview-container');
        const hovered = document.querySelector(':hover');
        return preview && (hovered === preview || preview.contains(hovered));
    }
    function isMouseOverLink() {
        const hovered = document.querySelector(':hover');
        return hovered && hovered.classList.contains('lazy-preview-link');
    }
    previewContainer.addEventListener('mouseenter', function() {
        clearTimeout(previewHideTimer);
    });
    previewContainer.addEventListener('mouseleave', function(e) {
        if (!isMouseOverLink()) {
            previewHideTimer = setTimeout(() => {
                hideLazyPreview();
                isPreviewVisible = false;
                currentHoveredLink = null;
            }, 300);
        }
    });
}
// SEARCH BAR
function convertToSearchBar() {
  // Get all elements with the class "to-search-bar"
  const elements = document.querySelectorAll('.to-search-bar');
  
  elements.forEach(element => {
    // Clear the element's content
    element.innerHTML = '';
    
    // Create the search bar structure
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-bar-container';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Search...';
    
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.style.display = 'none';
    
    // Add elements to container
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(suggestionsContainer);
    element.appendChild(searchContainer);
    
    // Get data from local storage
    let searchData = [];
    try {
      const storedData = localStorage.getItem('statblocks');
      if (storedData) {
        searchData = JSON.parse(storedData);
        if (!Array.isArray(searchData)) {
          console.warn('Data in localStorage is not an array');
          searchData = [];
        } else {
            searchData = searchData.filter(name => name !== '_example.json' && name !== 'repeated-statblock.json');
            searchData = searchData.map(name => toUpper(name.replace('.json', '').replaceAll('-', ' ')));
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      searchData = [];
    }
    
    // Event listener for input changes
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.trim().toLowerCase();
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';
      
      if (searchTerm.length > 0) {
        const filteredItems = searchData.filter(item => {
          if (typeof item === 'string') {
            return item.toLowerCase().includes(searchTerm);
          }
          return String(item).toLowerCase().includes(searchTerm);
        });
        
        if (filteredItems.length > 0) {
          filteredItems.forEach(item => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = item;
            suggestionItem.addEventListener('click', function() {
              selectedInSearchBar(item);
              searchInput.value = item;
              suggestionsContainer.style.display = 'none';
            });
            suggestionsContainer.appendChild(suggestionItem);
          });
          suggestionsContainer.style.display = 'block';
        }
      }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(event) {
      if (!searchContainer.contains(event.target)) {
        suggestionsContainer.style.display = 'none';
      }
    });
    
    // Show suggestions when input is focused (if there's text)
    searchInput.addEventListener('focus', function() {
      if (this.value.trim().length > 0 && suggestionsContainer.children.length > 0) {
        suggestionsContainer.style.display = 'block';
      }
    });
    
    // Keyboard navigation for suggestions
    searchInput.addEventListener('keydown', function(event) {
      const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
      const activeSuggestion = suggestionsContainer.querySelector('.suggestion-item.active');
      
      if (suggestions.length === 0) return;
      
      let currentIndex = -1;
      if (activeSuggestion) {
        currentIndex = Array.from(suggestions).indexOf(activeSuggestion);
      }
      
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (currentIndex < suggestions.length - 1) {
          if (activeSuggestion) activeSuggestion.classList.remove('active');
          suggestions[currentIndex + 1].classList.add('active');
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (currentIndex > 0) {
          if (activeSuggestion) activeSuggestion.classList.remove('active');
          suggestions[currentIndex - 1].classList.add('active');
        }
      } else if (event.key === 'Enter' && activeSuggestion) {
        event.preventDefault();
        activeSuggestion.click();
      }
    });
  });
}

window.encounterTableData = null;
window.encounterTableRender = null;
window.encounterTableShowNumberPrompt = null;

// The onclick function you requested
function selectedInSearchBar(selectedValue) {
    const slugName = selectedValue.replaceAll(' ', '-').toLowerCase();
    const data = JSON.parse(localStorage.getItem(`statblocks_${slugName}.json`));
    
    // Extract HP
    let hp = '0';
    if (data.hitPoints) {
        const hpMatch = data.hitPoints.match(/^(\d+)/);
        if (hpMatch) {
            hp = hpMatch[1];
        }
    }
    
    // Find the next available ID for creatures
    let nextId = 1;
    if (window.encounterTableData && window.encounterTableData.length > 0) {
        // Only consider creature IDs when finding the next available number
        const creatureIds = window.encounterTableData
            .filter(row => row.type === 'creature')
            .map(row => {
                // Try to parse the ID, fall back to 0 if invalid
                const id = parseInt(row.id);
                return isNaN(id) ? 0 : id;
            });
        
        if (creatureIds.length > 0) {
            nextId = Math.max(...creatureIds) + 1;
        }
    }
    const dexMod = Math.floor((parseInt(data.dex) - 10) / 2);
    const roll = Math.floor(Math.random() * 20) + 1;
    const initiative = roll + dexMod;
    const dataToAdd = {
        id: nextId, // Use unique ID
        initiative: initiative,
        name: selectedValue,
        ac: data.armorClass || 10,
        hp: hp,
        maxHp: hp,
        tempHp: '0',
        conditions: '',
        notes: '',
        type: 'creature',
        sourceKey: selectedValue,
        whenDamagedReminder: data.whenDamagedReminder,
        color: '#dc2626',
        textColor: 'white'
    };
    
    if (window.encounterTableData && window.encounterTableRender) {
        window.encounterTableData.push(dataToAdd);
        //sortTableData(window.encounterTableData);
        window.encounterTableRender();
    }
}

// Optional: Basic CSS styles for the search bar
function addSearchBarStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .search-bar-container {
      position: relative;
      width: 100%;
      max-width: 400px;
    }
    
    .search-input {
      width: 100%;
      padding: 10px 15px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    
    .search-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 4px 4px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .suggestion-item {
      padding: 10px 15px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .suggestion-item:hover,
    .suggestion-item.active {
      background-color: #f0f0f0;
    }
  `;
  document.head.appendChild(style);
}
// Also export the function for manual use
window.convertToSearchBar = convertToSearchBar;
window.selectedInSearchBar = selectedInSearchBar;
window.encounterTables = new Map(); // Store table data by element ID
// ENCOUNTER TABLE

// Function to initialize data from localStorage players and monsters
function initializeTableData() {
    const tableForData = [];
    let idCounter = 1;
    try {
        const playerData = JSON.parse(localStorage.getItem('players'));
        if (playerData && typeof playerData === 'object') {
            const playerKeys = Object.keys(playerData);
            for (let i = 0; i < playerKeys.length; i++) {
                const playerKey = playerKeys[i];
                const playerInfo = playerData[playerKey];
                const dexMod = playerInfo.initiativeMod.includes('+') ?
                    parseInt(playerInfo.initiativeMod.split('+')[1]) :
                    parseInt(playerInfo.initiativeMod);
                const roll = Math.floor(Math.random() * 20) + 1;
                const initiative = roll + dexMod;
                if (playerInfo && typeof playerInfo === 'object') {
                    tableForData.push({
                        id: playerInfo.name,
                        initiative: initiative,
                        name: toUpper(playerInfo.name),
                        ac: playerInfo.ac || 10,
                        hp: playerInfo.maxHp || '0',
                        maxHp: playerInfo.maxHp || '0',
                        tempHp: '0',
                        conditions: '',
                        notes: '',
                        type: 'player',
                        sourceKey: playerKey,
                        color: playerInfo.color || '#4a5568',
                        textColor: playerInfo.textColor
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading player data:', error);
    }
    
    // Get monster data from encounter name (when available)
    try {
        const encounterName = getUrlParameter('name');
        if(encounterName) {
            const encounterData = JSON.parse(localStorage.getItem(`encounters_${encounterName}.json`));
            if (encounterData && Array.isArray(encounterData.enemies)) {
                let idCounter = 1;
                encounterData.enemies.forEach((enemy) => {
                    const numberOfEnemies = enemy.split('-')[0].trim()
                    const typeOfEnemy = enemy.split('-')[1].trim().toLowerCase().replaceAll(' ', '-');
                    const monsterInfo = JSON.parse(localStorage.getItem(`statblocks_${typeOfEnemy}.json`));
                    for(let n=0;n<parseInt(numberOfEnemies);n++) {
                        const dexMod = Math.floor((parseInt(monsterInfo.dex) - 10) / 2);
                        const roll = Math.floor(Math.random() * 20) + 1;
                        const initiative = roll + dexMod;
                        const hp = monsterInfo.hitPoints.split('(')[0].trim();
                        const ac = monsterInfo.armorClass.split('(')[0].trim();
                        tableForData.push({
                            id: idCounter++,
                            initiative: initiative,
                            name: monsterInfo.name,
                            ac: ac || 10,
                            hp: hp || '0',
                            maxHp: hp || '0',
                            tempHp: '0',
                            conditions: '',
                            notes: '',
                            type: 'monster',
                            sourceKey: monsterInfo.name,
                            whenDamagedReminder: monsterInfo.whenDamagedReminder || '',
                            color: '#dc2626' // Red for monsters
                        });
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading monster data:', error);
    }
    
    return tableForData;
}
// Helper function for sorting
function sortTableData(tableData) {
    tableData.sort((a, b) => {
        const initA = parseInt(a.initiative) || 0;
        const initB = parseInt(b.initiative) || 0;
        
        if (initA === initB) {
            // If same initiative, sort by name instead of separating by type
            return a.name.localeCompare(b.name);
        }
        
        return initB - initA; // Higher initiative first
    });
}
function addRowToDOM(data, tableData, tbody, showNumberPromptFunc, renderTableFunc) {
    const row = document.createElement('tr');
    // Add appropriate class based on type
    if (data.type === 'player') {
        row.style.backgroundColor = data.color || 'darkblue';
        row.style.color = data.textColor 
    } else if (data.type === 'monster' || data.type === 'creature') {
        row.classList.add('monster-row');
        row.style.backgroundColor = 'darkred';
        row.style.color = 'white';
    }
    row.style.position = 'relative';

    // No need for the alternating row logic since CSS handles it
    const columns = [
        { key: 'initiative', editable: true, type: 'number' },
        { key: 'name', editable: false, type: 'text' },
        { key: 'ac', editable: false, type: 'number' },
        { key: 'hp', editable: false, type: 'text' },
        { key: 'conditions', editable: true, type: 'text' }
    ];
    
    columns.forEach((column) => {
        const cell = document.createElement('td');
        cell.dataset.key = column.key;
        
        // Set cell content
        const cellValue = data[column.key] !== undefined ? data[column.key] : '';
        cell.textContent = cellValue;
        
        // Only make certain cells editable
        if (column.editable) {
            cell.style.cursor = 'pointer';
            //cell.classList.add('editable-cell');
            
            cell.addEventListener('click', () => {
            const currentValue = cell.textContent;
            
            // Special handling for initiative column
            if (column.key === 'initiative') {
                if (data.type === 'player') {
                    // For players, open modal
                    showNumberPrompt(currentValue, (newValue) => {
                        cell.textContent = newValue;
                        // Update the specific player row
                        const rowIndex = window.encounterTableData.findIndex(item => 
                            item.id === data.id && item.name === data.name
                        );
                        
                        if (rowIndex !== -1) {
                            window.encounterTableData[rowIndex][column.key] = newValue;
                            sortTableData(window.encounterTableData);
                            renderTable();
                        }
                    });
                } else if (data.type === 'creature') {
                    // For creatures, call setInitiative (handled separately)
                    // This case should be handled in the special creature initiative code above
                } else {
                    // For other types, use standard prompt
                    if (column.type === 'number') {
                        showNumberPrompt(currentValue, (newValue) => {
                            cell.textContent = newValue;
                            const rowIndex = window.encounterTableData.findIndex(item => item.id === data.id);
                            
                            if (rowIndex !== -1) {
                                window.encounterTableData[rowIndex][column.key] = newValue;
                                
                                if (column.key === 'initiative') {
                                    sortTableData(window.encounterTableData);
                                    renderTable();
                                }
                            }
                        });
                    }
                }
            } else {
                // Non-initiative columns use standard handling
                if (column.type === 'number') {
                    showNumberPrompt(currentValue, (newValue) => {
                        cell.textContent = newValue;
                        const rowIndex = window.encounterTableData.findIndex(item => item.id === data.id);
                        
                        if (rowIndex !== -1) {
                            window.encounterTableData[rowIndex][column.key] = newValue;
                            
                            if (column.key === 'initiative') {
                                sortTableData(window.encounterTableData);
                                renderTable();
                            }
                        }
                    });
                }
            }
        });
        } else {
            cell.style.cursor = 'default';
        }
        
        row.appendChild(cell);
    });
    
    // Add edit button cell
    const editCell = document.createElement('td');
    const editButton = document.createElement('button');
    editButton.className = 'edit-button';
    editButton.innerHTML = '✎'; // Pencil icon
    editButton.title = 'Click for actions, right-click to edit notes';
    editButton.style.color = '#364051';
    // Left click - show context menu
    editButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Get the row data from the clicked row, not by searching array
        const row = editButton.closest('tr');
        const rowIdCell = row.querySelector('td[data-key="id"]');
        const rowNameCell = row.querySelector('td[data-key="name"]');
        
        if (!rowIdCell || !rowNameCell) return;
        
        const rowId = rowIdCell.textContent.trim();
        const rowName = rowNameCell.textContent.trim();
        
        // Find the row in the data by matching both ID and name for better accuracy
        const rowIndex = window.encounterTableData.findIndex(item => {
            // For creatures, match by ID and name
            if (item.type === 'creature') {
                return String(item.id) === rowId && item.name === rowName;
            }
            // For players, match by name (players don't have IDs)
            return item.name === rowName;
        });
        
        if (rowIndex === -1) return;
        
        showContextMenu(event.clientX, event.clientY, 
            ['Damage', 'Heal', 'Add Temp HP', '---', 'Destroy'],
            (option) => {
                console.log('Selected option (2):', option);
                if (option === 'Damage') {
                    showDamageModal(0, window.encounterTableData[rowIndex], (damageAmount) => {
                        const updatedStats = applyDamage(window.encounterTableData[rowIndex], damageAmount);
                        window.encounterTableData[rowIndex].tempHp = updatedStats.tempHp;
                        window.encounterTableData[rowIndex].hp = updatedStats.hp;
                        
                        const row = editButton.closest('tr');
                        if (row) {
                            const hpCell = row.querySelector('td[data-key="hp"]');
                            if (hpCell && hpCell._rowData) {
                                hpCell._rowData.tempHp = updatedStats.tempHp;
                                hpCell._rowData.hp = updatedStats.hp;
                                updateCellWithHpBar(
                                    hpCell, 
                                    updatedStats.hp, 
                                    hpCell._rowData.maxHp,
                                    updatedStats.tempHp,
                                    hpCell._textColor || 'white'
                                );
                            }
                        }
                        
                        // Show damage reminder if applicable
                        if (window.encounterTableData[rowIndex].whenDamagedReminder) {
                            // ... existing reminder code ...
                        }
                    });
                } else if (option === 'Heal') {
                    showHealingModal(0, (healAmount) => {
                        const updatedStats = applyHealing(window.encounterTableData[rowIndex], healAmount);
                        window.encounterTableData[rowIndex].hp = updatedStats.hp;
                        
                        const row = editButton.closest('tr');
                        if (row) {
                            const hpCell = row.querySelector('td[data-key="hp"]');
                            if (hpCell && hpCell._rowData) {
                                hpCell._rowData.hp = updatedStats.hp;
                                updateCellWithHpBar(
                                    hpCell,
                                    updatedStats.hp,
                                    hpCell._rowData.maxHp,
                                    hpCell._rowData.tempHp || '0',
                                    hpCell._textColor || 'white'
                                );
                            }
                        }
                    });
                } else if (option === 'Add Temp HP') {
                    showTempHpModal(window.encounterTableData[rowIndex].tempHp || '0', (tempHpAmount) => {
                        console.log('Temp HP amount entered (2):', tempHpAmount);
                        window.encounterTableData[rowIndex].tempHp = tempHpAmount.toString();
                        // Update the HP display to show temp HP
                        const row = editButton.closest('tr');
                        if (row) {
                            const hpCell = row.querySelector('td[data-key="hp"]');
                            if (hpCell && hpCell._rowData) {
                                hpCell._rowData.tempHp = tempHpAmount.toString();
                                updateCellWithHpBar(
                                    hpCell,
                                    hpCell._rowData.hp,
                                    hpCell._rowData.maxHp,
                                    hpCell._rowData.tempHp || '0',
                                    hpCell._textColor || 'white'
                                );
                            }
                        }
                    });
                }else if (option === 'Destroy') {
                    if (confirm(`Are you sure you want to remove ${window.encounterTableData[rowIndex].name}?`)) {
                        // Store the data for logging
                        const toRemove = window.encounterTableData[rowIndex];
                        
                        window.encounterTableData.splice(rowIndex, 1);
                        renderTable();
                    }
                }
            }
        );
    });

    // Right click - edit notes
    editButton.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const rowIndex = window.encounterTableData.findIndex(item => item.id === data.id);
        if (rowIndex === -1) return;
        
        showNotesModal(window.encounterTableData[rowIndex].notes || '', (newNotes) => {
            window.encounterTableData[rowIndex].notes = newNotes;
            // Update the notes cell
            const row = editButton.closest('tr');
            if (row) {
                const notesCell = row.querySelector('td[data-key="notes"]');
                if (notesCell) {
                    notesCell.textContent = newNotes || '';
                }
            }
        });
    });

    editCell.appendChild(editButton);
    row.appendChild(editCell);
    
    tbody.appendChild(row);
}
// Create a showNumberPrompt function that can be used outside
function createNumberPrompt(currentValue, callback) {
  const modal = document.createElement('div');
  modal.className = 'number-prompt-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    min-width: 300px;
  `;
  
  const input = document.createElement('input');
  input.type = 'number';
  input.value = currentValue;
  input.style.cssText = `
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    font-size: 16px;
    box-sizing: border-box;
  `;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
  `;
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  const confirmButton = document.createElement('button');
  confirmButton.textContent = 'OK';
  confirmButton.addEventListener('click', () => {
    const value = parseInt(input.value);
    if (!isNaN(value)) {
      callback(value);
    }
    document.body.removeChild(modal);
  });
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const value = parseInt(input.value);
      if (!isNaN(value)) {
        callback(value);
      }
      document.body.removeChild(modal);
    }
  });
  
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(confirmButton);
  
  modalContent.appendChild(document.createTextNode('Enter a number:'));
  modalContent.appendChild(input);
  modalContent.appendChild(buttonContainer);
  modal.appendChild(modalContent);
  
  document.body.appendChild(modal);
  input.focus();
  input.select();
  
  return modal;
}
function showTempHpModal(currentValue, callback) {
    const modal = document.createElement('div');
    modal.className = 'temp-hp-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-width: 300px;
    `;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentValue || '0';
    input.min = '0';
    input.style.cssText = `
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        font-size: 16px;
        box-sizing: border-box;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    console.log('Creating Temp HP modal with current value:', currentValue);
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Add Temp HP';
    confirmButton.style.backgroundColor = '#eab308'; // Yellow for temp HP
    confirmButton.style.color = 'black';
    confirmButton.addEventListener('click', () => {
        const value = parseInt(input.value);
        console.log('Value entered for Temp HP:', value);
        if (!isNaN(value) && value >= 0) {
            callback(value);
        }
        document.body.removeChild(modal);
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const value = parseInt(input.value);
            if (!isNaN(value) && value >= 0) {
                callback(value);
            }
            document.body.removeChild(modal);
        }
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    
    modalContent.appendChild(document.createTextNode('Enter temporary HP amount:'));
    modalContent.appendChild(input);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    input.focus();
    input.select();
    
    return modal;
}
const dndConditions = [
    { name: 'Blinded', icon: '👁️', color: '#4a5568' },
    { name: 'Charmed', icon: '💖', color: '#db2777' },
    { name: 'Deafened', icon: '👂', color: '#7c3aed' },
    { name: 'Frightened', icon: '😨', color: '#dc2626' },
    { name: 'Grappled', icon: '🤼', color: '#059669' },
    { name: 'Incapacitated', icon: '😵', color: '#0ea5e9' },
    { name: 'Invisible', icon: '👻', color: '#6366f1' },
    { name: 'Paralyzed', icon: '⏸️', color: '#8b5cf6' },
    { name: 'Petrified', icon: '🗿', color: '#78716c' },
    { name: 'Poisoned', icon: '☠️', color: '#10b981' },
    { name: 'Prone', icon: '⬇️', color: '#f59e0b' },
    { name: 'Restrained', icon: '🔗', color: '#f97316' },
    { name: 'Stunned', icon: '💫', color: '#eab308' },
    { name: 'Unconscious', icon: '💤', color: '#3b82f6' },
    { name: 'Exhaustion', icon: '😫', color: '#57534e' },
    { name: 'Concentrating', icon: 'https://img.icons8.com/ios-filled/50/fefefe/brain.png', color: '#8b5cf6' },
    { name: 'Blessed', icon: '✨', color: '#fbbf24' },
    { name: 'Cursed', icon: '👹', color: '#7c2d12' },
    { name: 'Burning', icon: '🔥', color: '#ea580c' },
    { name: 'Frozen', icon: '❄️', color: '#0ea5e9' }
];
function parseConditions(conditionsStr) {
    if (!conditionsStr || conditionsStr.trim() === '') return [];
    
    const conditions = [];
    // Parse format like: "Stunned[3], Poisoned[1]"
    const conditionRegex = /([^,\[]+)\[(\d+)\]/g;
    let match;
    
    while ((match = conditionRegex.exec(conditionsStr)) !== null) {
        const conditionName = match[1].trim();
        const turns = parseInt(match[2]);
        const conditionInfo = dndConditions.find(c => c.name === conditionName);
        
        conditions.push({
            name: conditionName,
            turns: turns,
            icon: conditionInfo ? conditionInfo.icon : '❓',
            color: conditionInfo ? conditionInfo.color : '#6b7280'
        });
    }
    
    return conditions;
}
function stringifyConditions(conditionsArray) {
    if (conditionsArray.length === 0) return '';
    
    return conditionsArray.map(condition => `${condition.name}[${condition.turns}]`).join(', ');
}
function showConditionAddModal(currentConditions, callback) {
    cleanupExistingModals();
    // Check if modal already exists
    const existingModal = document.querySelector('.condition-add-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    const modal = document.createElement('div');
    modal.className = 'condition-add-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-width: 400px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Add Condition';
    title.style.marginTop = '0';
    title.style.marginBottom = '15px';
    
    // Filter out already existing conditions
    const availableConditions = dndConditions.filter(condition => 
        !currentConditions.some(c => c.name === condition.name)
    );
    
    // Create condition grid
    const conditionGrid = document.createElement('div');
    conditionGrid.style.display = 'grid';
    conditionGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    conditionGrid.style.gap = '10px';
    conditionGrid.style.marginBottom = '20px';
    
    let selectedCondition = null;
    
    availableConditions.forEach(condition => {
        const conditionButton = document.createElement('button');
        conditionButton.style.cssText = `
            padding: 10px;
            border: 2px solid ${condition.color};
            background: ${condition.color};
            color: white;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all 0.2s;
        `;
        
        conditionButton.innerHTML = `
            <div style="font-size: 20px; margin-bottom: 5px;"><img width="30" height="30" src="${condition.icon}"/></div>
            
            <div>${condition.name}</div>
        `;
        
        conditionButton.addEventListener('click', () => {
            // Remove selection from all buttons
            conditionGrid.querySelectorAll('button').forEach(btn => {
                btn.style.background = 'white';
                btn.style.color = btn.style.borderColor;
                btn.style.fontWeight = 'normal';
            });
            
            // Select this button
            conditionButton.style.background = condition.color;
            conditionButton.style.color = 'white';
            conditionButton.style.fontWeight = 'bold';
            selectedCondition = condition;
            
            // Enable add button
            addButton.disabled = false;
        });
        
        conditionGrid.appendChild(conditionButton);
    });
    
    // Turns input
    const turnsLabel = document.createElement('div');
    turnsLabel.textContent = 'Duration (turns):';
    turnsLabel.style.marginBottom = '5px';
    turnsLabel.style.fontWeight = 'bold';
    
    const turnsInput = document.createElement('input');
    turnsInput.type = 'number';
    turnsInput.min = '1';
    turnsInput.value = '1';
    turnsInput.style.cssText = `
        width: 100%;
        padding: 10px;
        margin-bottom: 20px;
        font-size: 16px;
        box-sizing: border-box;
    `;
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    /*cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });*/
    
    const addButton = document.createElement('button');
    addButton.textContent = 'Add Condition';
    addButton.style.backgroundColor = '#4a5568';
    addButton.style.color = 'white';
    addButton.disabled = true;
    
    addButton.addEventListener('click', () => {
        if (selectedCondition) {
            const turns = parseInt(turnsInput.value) || 1;
            callback(selectedCondition, turns);
            document.body.removeChild(modal);
        }
    });
    
    // Enable add button when condition is selected
    conditionGrid.addEventListener('click', () => {
        if (selectedCondition) {
            addButton.disabled = false;
        }
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(addButton);
    
    modalContent.appendChild(title);
    modalContent.appendChild(conditionGrid);
    modalContent.appendChild(turnsLabel);
    modalContent.appendChild(turnsInput);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    const closeModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    };
    
    cancelButton.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.body.appendChild(modal);
    
    return modal;
}
function showConditionManageModal(currentConditions, callback) {
    // Check if modal already exists
    const existingModal = document.querySelector('.condition-manage-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    const modal = document.createElement('div');
    modal.className = 'condition-manage-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-width: 300px;
        max-width: 400px;
    `;
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Manage Conditions';
    title.style.marginTop = '0';
    title.style.marginBottom = '15px';
    
    // Options container
    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'flex';
    optionsContainer.style.flexDirection = 'column';
    optionsContainer.style.gap = '8px';
    optionsContainer.style.marginBottom = '20px';
    
    // Add current conditions as removable options
    currentConditions.forEach(condition => {
        const optionButton = document.createElement('button');
        optionButton.style.cssText = `
            padding: 10px 15px;
            border: none;
            background: ${condition.color};
            color: white;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            font-weight: bold;
            transition: opacity 0.2s;
        `;
        
        optionButton.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">${condition.icon}</span>
                <span>${condition.name}</span>
            </div>
            <div>
                <span style="background: rgba(255,255,255,0.3); padding: 2px 6px; border-radius: 10px;">
                    ${condition.turns} turn${condition.turns !== 1 ? 's' : ''}
                </span>
            </div>
        `;
        
        optionButton.addEventListener('click', () => {
            callback('remove', condition.name);
            document.body.removeChild(modal);
        });
        
        optionButton.addEventListener('mouseenter', () => {
            optionButton.style.opacity = '0.8';
        });
        
        optionButton.addEventListener('mouseleave', () => {
            optionButton.style.opacity = '1';
        });
        
        optionsContainer.appendChild(optionButton);
    });
    
    // Add "Pass Turn" option if there are conditions
    if (currentConditions.length > 0) {
        const passTurnButton = document.createElement('button');
        passTurnButton.style.cssText = `
            padding: 12px 15px;
            border: 2px solid #4a5568;
            background: white;
            color: #4a5568;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            margin-top: 10px;
            transition: all 0.2s;
        `;
        
        passTurnButton.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span style="font-size: 18px;">⏭️</span>
                <span>Pass Turn (Decrease all timers by 1)</span>
            </div>
        `;
        
        passTurnButton.addEventListener('click', () => {
            callback('passTurn');
            document.body.removeChild(modal);
        });
        
        passTurnButton.addEventListener('mouseenter', () => {
            passTurnButton.style.background = '#4a5568';
            passTurnButton.style.color = 'white';
        });
        
        passTurnButton.addEventListener('mouseleave', () => {
            passTurnButton.style.background = 'white';
            passTurnButton.style.color = '#4a5568';
        });
        
        optionsContainer.appendChild(passTurnButton);
    } else {
        const noConditions = document.createElement('div');
        noConditions.textContent = 'No active conditions';
        noConditions.style.textAlign = 'center';
        noConditions.style.color = '#6b7280';
        noConditions.style.fontStyle = 'italic';
        noConditions.style.padding = '20px';
        optionsContainer.appendChild(noConditions);
    }
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Close';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    buttonContainer.appendChild(cancelButton);
    
    modalContent.appendChild(title);
    modalContent.appendChild(optionsContainer);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    const closeModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    };
    
    cancelButton.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.body.appendChild(modal);
    
    return modal;
}
function updateConditionsDisplay(container, conditionsArray) {
    // Clear container
    container.innerHTML = '';
    // Reset container styles to fill the cell
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style['border'] = 'none';
    container.style.gap = '4px';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.minHeight = '40px'; // Match the height from your name cell
    container.style.height = '100%'; // Fill the cell height
    container.style.padding = '4px';
    container.style.width = '100%';
    container.style.boxSizing = 'border-box'; // Important: include padding in dimensions
    
    if (!conditionsArray || conditionsArray.length === 0) {
        const emptyText = document.createElement('span');
        emptyText.textContent = 'None';
        emptyText.style.color = '#9ca3af';
        emptyText.style.fontStyle = 'italic';
        emptyText.style.width = '100%';
        emptyText.style.height = '100%';
        emptyText.style.textAlign = 'center';
        emptyText.style.display = 'flex';
        emptyText.style.alignItems = 'center';
        container.appendChild(emptyText);
        return;
    }
    
    conditionsArray.forEach(condition => {
        const conditionBadge = document.createElement('div');
        conditionBadge.className = 'condition-badge';
        conditionBadge.style.display = 'flex';
        conditionBadge.style.alignItems = 'center';
        conditionBadge.style.justifyContent = 'center';
        conditionBadge.style.gap = '3px';
        conditionBadge.style.padding = '6px 8px';
        conditionBadge.style.borderRadius = '12px';
        conditionBadge.style.backgroundColor = condition.color;
        conditionBadge.style.color = 'white';
        conditionBadge.style.fontSize = '13px';
        conditionBadge.style.fontWeight = 'bold';
        conditionBadge.style.cursor = 'pointer';
        conditionBadge.style.minWidth = '40px'; // Minimum width for consistency
        conditionBadge.style.height = '28px';
        conditionBadge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        //conditionBadge.style.flexShrink = '0';
        conditionBadge.title = `${condition.name} (${condition.turns} turn${condition.turns !== 1 ? 's' : ''} remaining)`;
        
        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = `<img width="20" height="20" src="${condition.icon}" alt="brain"/>`;
        iconSpan.style.fontSize = '14px';
        
        const turnsSpan = document.createElement('span');
        turnsSpan.textContent = condition.turns;
        turnsSpan.style.marginLeft = '2px';
        
        conditionBadge.appendChild(iconSpan);
        conditionBadge.appendChild(turnsSpan);
        container.appendChild(conditionBadge);
    });
}
function cleanupExistingModals() {
    // Remove any existing condition modals
    const addModal = document.querySelector('.condition-add-modal');
    const manageModal = document.querySelector('.condition-manage-modal');
    
    if (addModal) document.body.removeChild(addModal);
    if (manageModal) document.body.removeChild(manageModal);
    
    // Also clean up other modal types if needed
    const tempHpModal = document.querySelector('.temp-hp-modal');
    if (tempHpModal) document.body.removeChild(tempHpModal);
}

function convertToEncounterTable() {
    // Get the element with ID "encounter_table" or class "to-encounter-table"
    const element = document.getElementById('encounter_table') || 
                    document.querySelector('.to-encounter-table');
    
    if (!element)
        return;
    
    // Clear the element's content
    element.innerHTML = '';
    
    // Create table structure
    const tableContainer = document.createElement('div');
    tableContainer.className = 'encounter-table-container';
    
    const table = document.createElement('table');
    table.className = 'encounter-table';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['#', 'Name', 'AC', 'HP', 'Conditions', 'Notes'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.style.textAlign = 'center';
        headerRow.appendChild(th);
        if(headerText === 'AC') {
            const armorClassIcon = document.createElement('span');
            th.appendChild(armorClassIcon);
            armorClassIcon.innerHTML = '<img width="30" height="30" src="https://img.icons8.com/sf-black-filled/64/FAFAFA/shield.png" alt="shield"/>';
        } else if(headerText === '#') {
            const initiativeIcon = document.createElement('span');
            th.appendChild(initiativeIcon);
            initiativeIcon.innerHTML = '<img width="30" height="30" src="https://img.icons8.com/glyph-neue/64/FAFAFA/hand-cursor.png" alt="hand-cursor"/>';
        } else {
            th.textContent = headerText;
        }
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    
    // Initialize table data - use window.encounterTableData directly
    window.encounterTableData = initializeTableData();
    // Function to ensure creature IDs are preserved and unique WITHOUT affecting order
    function ensureCreatureIds() {
        // Track existing creature IDs
        const existingIds = new Set();
        let maxId = 0;
        
        // First pass: collect all existing valid creature IDs
        window.encounterTableData.forEach(row => {
            if (row.type === 'creature') {
                const id = parseInt(row.id);
                if (!isNaN(id) && id > 0) {
                    existingIds.add(id);
                    maxId = Math.max(maxId, id);
                }
            }
        });
        
        // Second pass: fix any issues
        window.encounterTableData.forEach(row => {
            if (row.type === 'creature') {
                const currentId = parseInt(row.id);
                
                // If creature has no ID, invalid ID, or duplicate ID
                if (isNaN(currentId) || currentId <= 0 || 
                    (existingIds.has(currentId) && 
                    window.encounterTableData.filter(r => 
                        r.type === 'creature' && parseInt(r.id) === currentId
                    ).length > 1)) {
                    
                    // Find next available ID
                    let newId = currentId;
                    while (newId <= 0 || existingIds.has(newId)) {
                        maxId++;
                        newId = maxId;
                    }
                    
                    row.id = newId;
                    existingIds.add(newId);
                }
            }
        });
    }
    // Function to update global reference whenever tableData changes
    function updateTableData(newData) {
        window.encounterTableData = newData;
        return window.encounterTableData;
    }
    
    // Function to create a modal prompt for numbers only
    function showNumberPrompt(currentValue, callback) {
        const modal = document.createElement('div');
        modal.className = 'number-prompt-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            min-width: 300px;
        `;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue;
        input.style.cssText = `
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            font-size: 16px;
            box-sizing: border-box;
        `;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 15px;
        `;
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'OK';
        confirmButton.addEventListener('click', () => {
            const value = parseInt(input.value);
            if (!isNaN(value)) {
                callback(value);
            }
            document.body.removeChild(modal);
        });
        
        // Allow Enter key to confirm
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = parseInt(input.value);
                if (!isNaN(value)) {
                    callback(value);
                }
                document.body.removeChild(modal);
            }
        });
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);
        
        modalContent.appendChild(document.createTextNode('Enter a number:'));
        modalContent.appendChild(input);
        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
        input.focus();
        input.select();
        
        return modal;
    }
    
    // Store showNumberPrompt globally
    window.encounterTableShowNumberPrompt = showNumberPrompt;
    
    // Function to add a new row to the DOM
    function addRowToDOM(data) {
        const row = document.createElement('tr');
        // === ADD THESE LINES ===
        // Add color classes based on type
        let backgroundColor = 'darkblue';
        let textColor = 'white';
        if (data.type === 'player') {
            backgroundColor = data.color || 'darkblue';
            textColor = data.textColor || 'white';
        } else if (data.type === 'monster' || data.type === 'creature') {
            backgroundColor = 'grey';
            textColor = 'white';
        }
        row.style.backgroundColor = backgroundColor;
        row.style.color = textColor;
        // =======================
        row.style.position = 'relative';
        // Define which columns are editable and their types
        const columns = [
            { key: 'initiative', editable: true, type: 'number' },
            { key: 'name', editable: false, type: 'text' },
            { key: 'ac', editable: true, type: 'number' },
            { key: 'hp', editable: false, type: 'text' },
            { key: 'conditions', editable: true, type: 'text' }
        ];
        
        columns.forEach((column) => {
            let cell = document.createElement('td');
            cell.dataset.key = column.key;
            cell.style.color = textColor;
            cell.style.textAlign = 'center';
            // Set cell content
            const cellValue = data[column.key] !== undefined ? data[column.key] : '';
            cell._rowData = data;
            cell.textContent = cellValue;
            if (column.editable && 
                !(column.key === 'initiative' && data.type === 'monster')) {
                cell.style.cursor = 'pointer';
                cell.classList.add('editable-cell');
                cell.addEventListener('click', () => {
                    const currentValue = cell.textContent;
                    if (column.key === 'hp') {
                        cell.style.padding = '4px'; // Reduce padding for better visual
                        cell.style.textAlign = 'center';
                        
                        // Always create progress bar with temp HP support
                        updateCellWithHpBar(cell, data.hp, data.maxHp, data.tempHp || '0', textColor);
                        // Store reference to data for editing
                        cell._rowData = data;
                        cell._textColor = textColor;
                        
                        // Make cell editable
                        cell.style.cursor = 'pointer';
                        cell.classList.add('editable-cell');
                        cell.addEventListener('click', () => {
                            const currentValue = data.hp;
                            window.showNumberPrompt(currentValue, (newValue) => {
                                data.hp = newValue;
                                
                                // Find and update the row
                                const rowIndex = window.encounterTableData.findIndex(item => {
                                    if (data.type === 'player') {
                                        return item.name === data.name && item.type === 'player';
                                    } else {
                                        return item.id === data.id;
                                    }
                                });
                                
                                if (rowIndex !== -1) {
                                    window.encounterTableData[rowIndex].hp = newValue;
                                    data.hp = newValue;
                                    updateCellWithHpBar(cell, newValue, data.maxHp, data.tempHp || '0', textColor);
                                }
                            });
                        });
                    } else if (column.type === 'number') {
                        // Use number prompt for numeric fields
                        window.showNumberPrompt(currentValue, (newValue) => {
                            cell.textContent = newValue;
                            
                            // Find the row in window.encounterTableData by ID
                            const rowIndex = window.encounterTableData.findIndex(item => {
                                if (data.type === 'player') {
                                    // For players, match by name and type
                                    return item.name === data.name && item.type === 'player';
                                } else {
                                    // For creatures, match by ID
                                    return item.id === data.id;
                                }
                            });
                            
                            if (rowIndex !== -1) {
                                window.encounterTableData[rowIndex][column.key] = newValue;
                                
                                // For HP-related fields, also update the data model
                                if (column.key === 'hp') {
                                    // Ensure HP doesn't exceed max HP
                                    const maxHp = parseInt(window.encounterTableData[rowIndex].maxHp) || 0;
                                    const newHp = parseInt(newValue) || 0;
                                    if (newHp > maxHp) {
                                        cell.textContent = maxHp;
                                        window.encounterTableData[rowIndex].hp = maxHp.toString();
                                    }
                                }
                                
                                // Auto-sort if initiative changed
                                if (column.key === 'initiative') {
                                    sortTableData(window.encounterTableData);
                                    renderTable();
                                }
                            }
                        });
                    }
                });
            } else {
                cell.style.cursor = 'default';
            }
            if (column.key === 'initiative' && data.type === 'monster') {
                const link = document.createElement('a');
                link.style.color = textColor;
                link.style.cursor = 'pointer';
                
                // Load creature data
                const creatureData = JSON.parse(localStorage.getItem(`statblocks_${data.sourceKey.replaceAll(' ', '-').toLowerCase()}.json`));
                
                // Set current initiative value
                link.textContent = data.initiative || '0';
                
                // Add click handler
                link.onclick = () => {
                    setInitiative(link, data.name, data.id, creatureData.dex || 10);
                };
                
                cell.textContent = '';
                cell.appendChild(link);
            } else if (column.key === 'ac') {
                setIconShieldForAc(cell, data, textColor);
            } else if (column.key === 'id') {
                if (data.type === 'monster' || data.type === 'creature') {
                    // For creatures, show the ID from data (which should be unique)
                    cell.textContent = data.id || '';
                    // Make the ID cell editable for manual override
                    cell.style.cursor = 'pointer';
                    cell.classList.add('editable-cell');
                    cell.addEventListener('click', () => {
                        const currentValue = cell.textContent;
                        window.showNumberPrompt(currentValue, (newValue) => {
                            // Check if this ID is already taken by another creature
                            const isTaken = window.encounterTableData.some(row => 
                                row.type === 'monster' && 
                                row.id == newValue && 
                                row.id !== data.id
                            );
                            
                            if (isTaken) {
                                alert(`ID ${newValue} is already in use by another creature!`);
                                return;
                            }
                            
                            cell.textContent = newValue;
                            
                            // Update the data model
                            const rowIndex = window.encounterTableData.findIndex(item => item.id === data.id);
                            if (rowIndex !== -1) {
                                window.encounterTableData[rowIndex].id = newValue;
                                // Keep the sort by initiative after ID change
                                sortTableData(window.encounterTableData);
                                renderTable();
                            }
                        });
                    });
                } else if (data.type === 'player') {
                    cell.textContent = '';
                }
            } else if (column.key === 'name') {
                // Create container for name with ID badge
                const nameContainer = document.createElement('div');
                nameContainer.style.display = 'flex';
                nameContainer.style.alignItems = 'center';
                nameContainer.style.gap = '8px';
                nameContainer.style.minHeight = '40px';
                
                // Add ID badge for creatures
                if (data.type === 'creature' || data.type === 'monster') {
                    const idBadge = document.createElement('div');
                    idBadge.className = 'creature-id-badge';
                    idBadge.textContent = data.id || '';
                    idBadge.title = `Monster ID: ${data.id || 'N/A'}`;
                    
                    // Style the badge
                    idBadge.style.width = '24px';
                    idBadge.style.height = '24px';
                    idBadge.style.borderRadius = '50%';
                    idBadge.style.backgroundColor = '#364051'; // Red circle
                    idBadge.style.color = 'white';
                    idBadge.style.display = 'flex';
                    idBadge.style.alignItems = 'center';
                    idBadge.style.justifyContent = 'center';
                    idBadge.style.fontSize = '12px';
                    idBadge.style.fontWeight = 'bold';
                    idBadge.style.cursor = 'pointer';
                    idBadge.style.flexShrink = '0';
                    idBadge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                    
                    // Make badge editable on click
                    idBadge.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const currentId = data.id || '';
                        window.showNumberPrompt(currentId, (newId) => {
                            // Check if ID is already taken
                            const isTaken = window.encounterTableData.some(row => 
                                (row.type === 'creature' || row.type === 'monster') && 
                                row.id == newId && 
                                row.id !== data.id
                            );
                            
                            if (isTaken) {
                                alert(`ID ${newId} is already in use by another creature!`);
                                return;
                            }
                            
                            // Update the data
                            const rowIndex = window.encounterTableData.findIndex(item => 
                                item.id === data.id && item.name === data.name
                            );
                            
                            if (rowIndex !== -1) {
                                window.encounterTableData[rowIndex].id = newId;
                                data.id = newId;
                                idBadge.textContent = newId;
                                idBadge.title = `Monster ID: ${newId}`;
                            }
                        });
                    });
                    
                    nameContainer.appendChild(idBadge);
                }
                
                // Create the name content
                if (data.type === 'creature' || data.type === 'monster') {
                    const link = document.createElement('a');
                    link.className = 'lazy-preview-link';
                    const creatureSlug = data.sourceKey.replaceAll(' ', '-').toLowerCase();
                    link.href = `creature?name=${creatureSlug}`;
                    link.setAttribute('data-url', `creature?name=${creatureSlug}`);
                    link.setAttribute('data-text', toPrettyListName(creatureSlug));
                    link.textContent = toPrettyListName(data.sourceKey);
                    link.style.color = textColor;
                    link.style.textDecoration = 'none';
                    link.style.fontSize = '15px';
                    link.style.cursor = 'pointer';
                    //link.style.flexGrow = '1';
                    
                    nameContainer.appendChild(link);
                } else {
                    const nameText = document.createElement('span');
                    nameText.textContent = data.name;
                    nameText.style.color = textColor;
                    //nameText.style.flexGrow = '1';
                    nameContainer.appendChild(nameText);
                }
                
                cell.textContent = '';
                cell.appendChild(nameContainer);
                cell.style.padding = '8px';
                
                // Add tooltip on hover
                let tooltipTimeout;
                nameContainer.addEventListener('mouseenter', (event) => {
                    // Get current row data
                    const row = nameContainer.closest('tr');
                    const rowIdCell = row.querySelector('td[data-key="id"]');
                    const rowNameCell = row.querySelector('td[data-key="name"]');
                    
                    if (!rowIdCell || !rowNameCell) return;
                    
                    const rowId = rowIdCell.textContent.trim();
                    const rowName = rowNameCell.textContent.trim();
                    
                    // Find the data
                    const rowData = window.encounterTableData.find(item => {
                        if (item.type === 'monster' || item.type === 'creature') {
                            return String(item.id) === rowId && item.name === rowName;
                        }
                        return item.name === rowName;
                    });
                    
                    if (rowData && rowData.notes && rowData.notes.trim() !== '') {
                        tooltipTimeout = setTimeout(() => {
                            showTooltip(event.clientX + 10, event.clientY + 10, rowData.notes);
                        }, 500);
                    }
                });
                
                nameContainer.addEventListener('mouseleave', () => {
                    clearTimeout(tooltipTimeout);
                    const existingTooltip = document.querySelector('.tooltip');
                    if (existingTooltip) {
                        document.body.removeChild(existingTooltip);
                    }
                });
                
                nameContainer.addEventListener('mousemove', (event) => {
                    const existingTooltip = document.querySelector('.tooltip');
                    if (existingTooltip && data.notes && data.notes.trim() !== '') {
                        existingTooltip.style.left = (event.clientX + 10) + 'px';
                        existingTooltip.style.top = (event.clientY + 10) + 'px';
                    }
                });
                
                cell.textContent = '';
                cell.appendChild(nameContainer);
            } else if (column.key === 'hp') {
                updateCellWithHpBar(cell, data.hp, data.maxHp, data.tempHp, 'black');
            } else if (column.key === 'conditions') {
                // Add fresh event listeners
                cell.addEventListener('click', function conditionsClickHandler(e) {
                    console.log('Clicked on conditions cell');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Get fresh data from the stored reference
                    const currentConditions = cell._conditionsData || parseConditions(data.conditions || '');
                    
                    showConditionAddModal(currentConditions, (selectedCondition, turns) => {
                        console.log('Adding condition:', selectedCondition, 'for turns:', turns);
                        console.log('Current conditions:', currentConditions);
                        // Create a new array to avoid mutation issues
                        const updatedConditions = [...currentConditions];
                        
                        // Check if condition already exists
                        const existingIndex = updatedConditions.findIndex(c => c.name === selectedCondition.name);
                        
                        if (existingIndex >= 0) {
                            // Update existing condition (replace, don't add new)
                            updatedConditions[existingIndex].turns = turns;
                        } else {
                            console.log('Pushing new condition');
                            // Add new condition
                            updatedConditions.push({
                                name: selectedCondition.name,
                                turns: turns,
                                icon: selectedCondition.icon,
                                color: selectedCondition.color
                            });
                        }
                        
                        // Update the data model
                        const conditionsStr = stringifyConditions(updatedConditions);
                        console.log('Updated conditions:', updatedConditions);
                        data.conditions = conditionsStr;
                        
                        // Find and update in window.encounterTableData
                        const rowIndex = window.encounterTableData.findIndex(item => {
                            if (data.type === 'player') {
                                return item.name === data.name && item.type === 'player';
                            } else {
                                return item.id === data.id;
                            }
                        });
                        
                        if (rowIndex !== -1) {
                            window.encounterTableData[rowIndex].conditions = conditionsStr;
                            console.log('window.encounterTableData to:', window.encounterTableData);
                        }
                        
                        // Update the display
                        const displayContainer = cell;
                        console.log('Display container:', displayContainer);
                        if (displayContainer) {
                            updateConditionsDisplay(displayContainer, updatedConditions);
                        }
                        
                        // Update stored data
                        cell._conditionsData = updatedConditions;
                    });
                });
                
                cell.addEventListener('contextmenu', function conditionsContextMenuHandler(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const currentConditions = parseConditions(data.conditions || '');
                    
                    showConditionManageModal(currentConditions, (action, conditionName) => {
                        if (action === 'remove') {
                            console.log('Removing condition:', conditionName);
                            // Remove specific condition
                            const newConditions = currentConditions.filter(c => c.name !== conditionName);
                            
                            // Update the data
                            const conditionsStr = stringifyConditions(newConditions);
                            data.conditions = conditionsStr;
                            
                            const rowIndex = window.encounterTableData.findIndex(item => {
                                if (data.type === 'player') {
                                    return item.name === data.name && item.type === 'player';
                                } else {
                                    return item.id === data.id;
                                }
                            });
                            
                            if (rowIndex !== -1) {
                                window.encounterTableData[rowIndex].conditions = conditionsStr;
                            }
                            
                            // Update display
                            const displayContainer = cell;
                            if (displayContainer) {
                                updateConditionsDisplay(displayContainer, newConditions);
                            }
                            
                            // Update stored data
                            cell._conditionsData = newConditions;
                            
                        } else if (action === 'passTurn') {
                            console.log('Passing turn for all conditions');
                            // Decrease all condition timers by 1
                            const newConditions = currentConditions
                                .map(condition => ({
                                    ...condition,
                                    turns: condition.turns - 1
                                }))
                                .filter(condition => condition.turns > 0);
                            
                            // Update the data
                            const conditionsStr = stringifyConditions(newConditions);
                            data.conditions = conditionsStr;
                            
                            const rowIndex = window.encounterTableData.findIndex(item => {
                                if (data.type === 'player') {
                                    return item.name === data.name && item.type === 'player';
                                } else {
                                    return item.id === data.id;
                                }
                            });
                            
                            if (rowIndex !== -1) {
                                window.encounterTableData[rowIndex].conditions = conditionsStr;
                            }
                            
                            // Update display
                            const displayContainer = cell;
                            if (displayContainer) {
                                updateConditionsDisplay(displayContainer, newConditions);
                            }
                            
                            // Update stored data
                            cell._conditionsData = newConditions;
                        }
                    });
                });
            }
            row.appendChild(cell);
        });
        // Add edit button cell
    const editCell = document.createElement('td');
    const editButton = document.createElement('button');
    editButton.className = 'edit-button';
    editButton.innerHTML = '✎'; // Pencil icon
    editButton.title = 'Click for actions, right-click to edit notes';

    // Left click - show context menu
    editButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const rowIndex = window.encounterTableData.findIndex(item => {
            return item.id === data.id;
        });
        if (rowIndex === -1) return;
        
        showContextMenu(event.clientX, event.clientY, 
            ['Damage', 'Heal', 'Add Temp HP', '---', 'Destroy'], 
            (option) => {
                console.log('Selected option (1):', option);
                if (option === 'Damage') {
                    showDamageModal(0, window.encounterTableData[rowIndex], (damageAmount) => {
                        const updatedStats = applyDamage(window.encounterTableData[rowIndex], damageAmount);
                        window.encounterTableData[rowIndex].tempHp = updatedStats.tempHp;
                        window.encounterTableData[rowIndex].hp = updatedStats.hp;
                        renderTable();
                    });
                } else if (option === 'Heal') {
                    showHealingModal(0, (healAmount) => {
                        const updatedStats = applyHealing(window.encounterTableData[rowIndex], healAmount);
                        window.encounterTableData[rowIndex].hp = updatedStats.hp;
                        renderTable();
                    });
                } else if (option === 'Add Temp HP') {
                    showTempHpModal(window.encounterTableData[rowIndex].tempHp || '0', (tempHpAmount) => {
                    console.log('Temp HP amount entered (1):', tempHpAmount);
                    window.encounterTableData[rowIndex].tempHp = tempHpAmount.toString();
                    
                    const row = editButton.closest('tr');
                    if (row) {
                        console.log('row...');
                        const hpCell = row.querySelector('td[data-key="hp"]');
                        console.log(hpCell._rowData);
                        if (hpCell && hpCell._rowData) {
                            hpCell._rowData.tempHp = tempHpAmount.toString();
                            updateCellWithHpBar(
                                hpCell,
                                hpCell._rowData.hp,
                                hpCell._rowData.maxHp,
                                hpCell._rowData.tempHp,
                                tempHpAmount.toString(),
                                hpCell._textColor || 'white'
                            );
                        }
                    }
                });
                } else if (option === 'Destroy') {
                    if (confirm(`Are you sure you want to remove ${data.name}?`)) {
                        window.encounterTableData.splice(rowIndex, 1);
                        renderTable();
                    }
                }
            }
        );
    });

    // Right click - edit notes
    editButton.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const rowIndex = window.encounterTableData.findIndex(item => item.id === data.id);
        if (rowIndex === -1) return;
        
        showNotesModal(window.encounterTableData[rowIndex].notes || '', (newNotes) => {
            window.encounterTableData[rowIndex].notes = newNotes;
            // Update the notes cell
            const row = editButton.closest('tr');
            if (row) {
                const notesCell = row.querySelector('td[data-key="notes"]');
                if (notesCell) {
                    notesCell.textContent = newNotes || '';
                }
            }
        });
    });

    editCell.appendChild(editButton);
    row.appendChild(editCell);
        
        tbody.appendChild(row);

        let rowTooltipTimeout;
        row.addEventListener('mouseenter', (event) => {
            if (data.notes && data.notes.trim() !== '') {
                rowTooltipTimeout = setTimeout(() => {
                    showTooltip(event.clientX + 10, event.clientY + 10, data.notes);
                }, 500);
            }
        });

        row.addEventListener('mouseleave', () => {
            clearTimeout(rowTooltipTimeout);
            const existingTooltip = document.querySelector('.tooltip');
            if (existingTooltip) {
                document.body.removeChild(existingTooltip);
            }
        });

        row.addEventListener('mousemove', (event) => {
            const existingTooltip = document.querySelector('.tooltip');
            if (existingTooltip && data.notes && data.notes.trim() !== '') {
                existingTooltip.style.left = (event.clientX + 10) + 'px';
                existingTooltip.style.top = (event.clientY + 10) + 'px';
            }
        });
    }
    
    // Function to render the entire table
    function renderTable() {
        // First, sort the table by initiative
        sortTableData(window.encounterTableData);
        
        // Then ensure creature IDs are unique
        ensureCreatureIds();
        
        tbody.innerHTML = '';
        window.encounterTableData.forEach((rowData) => {
            addRowToDOM(rowData);
        });
    }
    
    // Store renderTable globally
    window.encounterTableRender = renderTable;
    
    // Create control buttons
    const controls = document.createElement('div');
    controls.className = 'table-controls';
    controls.style.cssText = `
        margin-bottom: 15px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    `;
    
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All';
    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all rows?')) {
            window.encounterTableData = [];
            renderTable();
        }
    });
    
    const sortButton = document.createElement('button');
    sortButton.textContent = 'Sort by Initiative';
    sortButton.addEventListener('click', () => {
        sortTableData(window.encounterTableData);
        renderTable();
    });
    
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'Reload from Source';
    reloadButton.addEventListener('click', () => {
        if (confirm('This will replace current table with player and monster data. Continue?')) {
            window.encounterTableData = initializeTableData();
            renderTable();
            alert('Table reloaded from source data!');
        }
    });

    // Add to your table controls section in convertToEncounterTable:
    const passAllTurnsButton = document.createElement('button');
    passAllTurnsButton.textContent = 'Pass All Turns';
    passAllTurnsButton.addEventListener('click', () => {
        let anyConditionsUpdated = false;
        
        window.encounterTableData.forEach((rowData, index) => {
            if (rowData.conditions && rowData.conditions.trim() !== '') {
                const currentConditions = parseConditions(rowData.conditions);
                const newConditions = currentConditions
                    .map(condition => ({
                        ...condition,
                        turns: condition.turns - 1
                    }))
                    .filter(condition => condition.turns > 0);
                
                if (newConditions.length !== currentConditions.length) {
                    anyConditionsUpdated = true;
                    window.encounterTableData[index].conditions = stringifyConditions(newConditions);
                }
            }
        });
        
        if (anyConditionsUpdated) {
            renderTable();
            popup.show('Turn passed for all creatures!');
        } else {
            popup.show('No conditions to update');
        }
    });

    // Add to your controls container:
    controls.appendChild(passAllTurnsButton);
    controls.appendChild(sortButton);
    controls.appendChild(reloadButton);
    controls.appendChild(clearButton);
    
    // Initial render
    renderTable();
    
    // Assemble everything
    tableContainer.appendChild(controls);
    tableContainer.appendChild(table);
    element.appendChild(tableContainer);
}
function setIconShieldForAc(cell, data, textColor) {
    // Create container for icon with text overlay
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.width = '50px'; // Fixed width for consistency
    container.style.height = '50px';
    container.style.cursor = 'pointer';
    
    // Create shield icon
    const shieldIcon = document.createElement('img');
    shieldIcon.src = `https://img.icons8.com/sf-black-filled/64/${customDarkGrey.replace('#', '')}/shield.png`;
    shieldIcon.alt = 'shield';
    shieldIcon.width = 50;
    shieldIcon.height = 50;
    shieldIcon.style.position = 'absolute';
    shieldIcon.style.zIndex = '1';
    
    // Create AC number overlay
    const acText = document.createElement('div');
    acText.textContent = data.ac || '10';
    acText.style.position = 'absolute';
    acText.style.zIndex = '2';
    acText.style.color = 'white';
    acText.style.fontWeight = 'bold';
    acText.style.fontSize = '16px';
    //acText.style.textShadow = '0 0 3px rgba(0,0,0,0.8)';
    acText.style.display = 'flex';
    acText.style.alignItems = 'center';
    acText.style.justifyContent = 'center';
    acText.style.width = '100%';
    acText.style.height = '100%';
    
    // Add hover effect
    container.addEventListener('mouseenter', () => {
        shieldIcon.style.filter = 'brightness(1.2) drop-shadow(0 0 3px rgba(255,255,255,0.5))';
        acText.style.fontSize = '18px'; // Slightly enlarge on hover
    });
    
    container.addEventListener('mouseleave', () => {
        shieldIcon.style.filter = 'brightness(1)';
        acText.style.fontSize = '16px';
    });
    
    // Add click handler for editing
    container.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent row click
        const currentValue = acText.textContent;
        window.showNumberPrompt(currentValue, (newValue) => {
            // Update the data model
            const rowIndex = window.encounterTableData.findIndex(item => {
                if (data.type === 'player') {
                    return item.name === data.name && item.type === 'player';
                } else {
                    return item.id === data.id;
                }
            });
            
            if (rowIndex !== -1) {
                window.encounterTableData[rowIndex].ac = newValue;
                data.ac = newValue; // Update local reference
                acText.textContent = newValue;
            }
        });
    });
    
    container.appendChild(shieldIcon);
    container.appendChild(acText);
    
    // Clear cell and add container
    cell.textContent = '';
    cell.appendChild(container);
    cell.style.textAlign = 'center';
    cell.style.padding = '8px';
}
function setInitiative(element, name, id, dexterity) {
    // Parse dexterity correctly (it might be a string like "14 (modifier)")
    let dexValue = dexterity;
    if (typeof dexterity === 'string') {
        // Extract just the number if it's in format "14 (+2)"
        const match = dexterity.match(/\d+/);
        if (match) dexValue = parseInt(match[0]);
    }
    
    const dexMod = Math.floor((parseInt(dexValue) - 10) / 2);
    const roll = Math.floor(Math.random() * 20) + 1;
    const initiative = roll + dexMod;
    
    element.textContent = initiative;
    
    // Update the table data - find by ID AND name to be more specific
    const rowIndex = window.encounterTableData.findIndex(row => 
        row.name === name && row.id == id
    );
    
    if (rowIndex !== -1) {
        window.encounterTableData[rowIndex].initiative = initiative;
    } else {
        console.error(`Could not find row with name: ${name}, id: ${id}`);
    }
    
    // Sort the table
    sortTableData(window.encounterTableData);
    
    // Re-render the table
    if (window.encounterTableRender) {
        window.encounterTableRender();
    } else {
        console.error('renderTable function not found');
    }
}

// Optional: Add CSS styles for the table
function addEncounterTableStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .encounter-table-container {
            width: 100%;
            overflow-x: auto;
        }
        
        .encounter-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .encounter-table th {
            background-color: #4a5568;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid rgb(54, 64, 81);
        }
        
        .encounter-table td {
            padding: 12px;
            border: 1px solid rgb(54, 64, 81);
        }
        
        .encounter-table td.editable-cell {
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .encounter-table tr:not(.color-row):nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .encounter-table tr:not(.color-row):hover {
            background-color: #f5f5f5;
        }
        
        .table-controls button {
            padding: 8px 16px;
            background-color: #4a5568;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        
        .table-controls button:hover {
            background-color: #2d3748;
        }
        
        .number-prompt-modal button,
        .text-prompt-modal button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .number-prompt-modal button:first-child,
        .text-prompt-modal button:first-child {
            background-color: #e2e8f0;
        }
        
        .number-prompt-modal button:last-child,
        .text-prompt-modal button:last-child {
            background-color: #4a5568;
            color: white;
        }
    `;
    style.textContent += `
        /* Row coloring - must be more specific than existing rules */
        .encounter-table tr.player-row {
            background-color: var(--player-color, #4a5568) !important;
        }
        
        .encounter-table tr.monster-row,
        .encounter-table tr.creature-row {
            background-color: #dc2626 !important;
        }
        
        .encounter-table tr.custom-row {
            background-color: #6b7280 !important;
        }
        
        /* Override the existing :nth-child rules for colored rows */
        .encounter-table tr.player-row:nth-child(even),
        .encounter-table tr.monster-row:nth-child(even),
        .encounter-table tr.creature-row:nth-child(even),
        .encounter-table tr.custom-row:nth-child(even) {
            background-color: inherit !important;
        }
        
        .encounter-table tr.player-row:nth-child(odd),
        .encounter-table tr.monster-row:nth-child(odd),
        .encounter-table tr.creature-row:nth-child(odd),
        .encounter-table tr.custom-row:nth-child(odd) {
            background-color: inherit !important;
        }
        
        /* Override hover effect for colored rows */
        .encounter-table tr.player-row:hover,
        .encounter-table tr.monster-row:hover,
        .encounter-table tr.creature-row:hover,
        .encounter-table tr.custom-row:hover {
            background-color: inherit !important;
            filter: brightness(1.1) !important;
        }
        
        /* Alternating pattern using overlay */
        .encounter-table tr.color-row::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }
        
        .encounter-table tr.color-row:nth-child(even)::before {
            background-color: rgba(255, 255, 255, 0.15);
        }
        
        .encounter-table tr.color-row:nth-child(odd)::before {
            background-color: rgba(0, 0, 0, 0.15);
        }
        
        /* Make sure cell content is above the overlay */
        .encounter-table tr.color-row td {
            position: relative;
            z-index: 2;
        }
    `;
    style.textContent += `
        /* Edit button styles */
        .encounter-table .edit-button {
            background: transparent;
            color: white;
            border: none;
            border-radius: 4px;
            width: 32px;
            height: 32px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }
        
        .encounter-table .edit-button:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        
        /* Context menu styles */
        .context-menu {
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            min-width: 150px;
        }
        
        .context-menu-item {
            padding: 8px 12px;
            cursor: pointer;
            color: #333;
            transition: background-color 0.2s;
        }
        
        .context-menu-item:hover {
            background-color: #f0f0f0;
        }
        
        .context-menu-divider {
            height: 1px;
            background-color: #ddd;
            margin: 4px 0;
        }
        
        /* Tooltip styles */
        .tooltip {
            position: fixed;
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            max-width: 300px;
            z-index: 1001;
            pointer-events: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
    `;
    document.head.appendChild(style);
}
// Show context menu at cursor position
function showContextMenu(x, y, options, callback) {
    // Remove any existing context menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        document.body.removeChild(existingMenu);
    }
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    options.forEach((option, index) => {
        if (option === '---') {
            const divider = document.createElement('div');
            divider.className = 'context-menu-divider';
            menu.appendChild(divider);
        } else {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.textContent = option;
            item.addEventListener('click', () => {
                if (document.body.contains(menu)) {
                    document.body.removeChild(menu);
                }
                callback(option);
            });
            menu.appendChild(item);
        }
    });
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    const closeMenu = (e) => {
        if (menu && document.body.contains(menu) && !menu.contains(e.target)) {
            document.body.removeChild(menu);
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 10);
}

// Show tooltip
function showTooltip(x, y, text) {
    // Remove any existing tooltip
    const existingTooltip = document.querySelector('.tooltip');
    if (existingTooltip) {
        document.body.removeChild(existingTooltip);
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    
    document.body.appendChild(tooltip);
    
    return tooltip;
}

// Apply damage to a creature/player (with temp HP support)
function applyDamage(rowData, damageAmount) {
    let remainingDamage = parseInt(damageAmount);
    let newTempHp = parseInt(rowData.tempHp) || 0;
    let newHp = parseInt(rowData.hp) || 0;
    
    // Apply to temp HP first
    if (newTempHp > 0) {
        if (remainingDamage >= newTempHp) {
            remainingDamage -= newTempHp;
            newTempHp = 0;
        } else {
            newTempHp -= remainingDamage;
            remainingDamage = 0;
        }
    }
    
    // Apply remaining damage to HP
    if (remainingDamage > 0) {
        newHp = Math.max(0, newHp - remainingDamage);
    }
    
    return {
        tempHp: newTempHp.toString(),
        hp: newHp.toString()
    };
}

// Apply healing to a creature/player (temp HP not affected)
function applyHealing(rowData, healAmount) {
    let currentHp = parseInt(rowData.hp) || 0;
    let maxHp = parseInt(rowData.maxHp) || 0;
    let heal = parseInt(healAmount);
    
    // Heal but don't exceed max HP (temp HP doesn't count toward max)
    const newHp = Math.min(maxHp, currentHp + heal);
    
    return {
        hp: newHp.toString()
    };
}

// Show damage modal
function showDamageModal(currentValue, creatureInfo, callback) {
    const modal = document.createElement('div');
    modal.className = 'damage-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-width: 300px;
    `;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentValue;
    input.min = '0';
    input.style.cssText = `
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        font-size: 16px;
        box-sizing: border-box;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Apply Damage';
    confirmButton.style.backgroundColor = '#dc2626';
    confirmButton.style.color = 'white';
    confirmButton.addEventListener('click', () => {
        const value = parseInt(input.value);
        if (!isNaN(value) && value >= 0) {
            callback(value);
        }
        if(creatureInfo.whenDamagedReminder){
            if (creatureInfo.whenDamagedReminder.includes('['))
                popup.show(creatureInfo.whenDamagedReminder.split(']')[0].split('[')[1].trim() + ' ' + colorText(creatureInfo.whenDamagedReminder.split(']')[1].trim(), 'white'), 10);
            else
                popup.show(creatureInfo.whenDamagedReminder);
        }
        document.body.removeChild(modal);
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const value = parseInt(input.value);
            if (!isNaN(value) && value >= 0) {
                callback(value);
            }
            document.body.removeChild(modal);
        }
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    
    modalContent.appendChild(document.createTextNode('Enter damage amount:'));
    modalContent.appendChild(input);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    input.focus();
    input.select();
    
    return modal;
}

// Show healing modal (similar to damage but with different text)
function showHealingModal(currentValue, callback) {
    const modal = document.createElement('div');
    modal.className = 'healing-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-width: 300px;
    `;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentValue;
    input.min = '0';
    input.style.cssText = `
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        font-size: 16px;
        box-sizing: border-box;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Apply Healing';
    confirmButton.style.backgroundColor = '#10b981';
    confirmButton.style.color = 'white';
    confirmButton.addEventListener('click', () => {
        const value = parseInt(input.value);
        if (!isNaN(value) && value >= 0) {
            callback(value);
        }
        document.body.removeChild(modal);
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const value = parseInt(input.value);
            if (!isNaN(value) && value >= 0) {
                callback(value);
            }
            document.body.removeChild(modal);
        }
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    
    modalContent.appendChild(document.createTextNode('Enter healing amount:'));
    modalContent.appendChild(input);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    input.focus();
    input.select();
    
    return modal;
}

// Show notes modal
function showNotesModal(currentNotes, callback) {
    const modal = document.createElement('div');
    modal.className = 'notes-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-width: 400px;
        max-width: 600px;
    `;
    
    const textarea = document.createElement('textarea');
    textarea.value = currentNotes || '';
    textarea.style.cssText = `
        width: 100%;
        height: 150px;
        padding: 10px;
        margin: 10px 0;
        font-size: 16px;
        box-sizing: border-box;
        resize: vertical;
        font-family: inherit;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Save Notes';
    confirmButton.style.backgroundColor = '#4a5568';
    confirmButton.style.color = 'white';
    confirmButton.addEventListener('click', () => {
        callback(textarea.value);
        document.body.removeChild(modal);
    });
    
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            callback(textarea.value);
            document.body.removeChild(modal);
        }
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    
    modalContent.appendChild(document.createTextNode('Enter notes:'));
    modalContent.appendChild(textarea);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    textarea.focus();
    textarea.select();
    
    return modal;
}
const customDarkGrey = '#364051'; // Custom dark grey color
// Enhanced HP progress bar with temp HP support
function createHpProgressBar(currentHp, maxHp, tempHp, textColor) {
    if (!currentHp || !maxHp) {
        currentHp = currentHp || '0';
        maxHp = maxHp || '0';
    }
    
    const current = parseInt(currentHp);
    const max = parseInt(maxHp);
    const temp = parseInt(tempHp) || 0;
    
    if (isNaN(current) || isNaN(max) || max <= 0) {
        return createSimpleHpDisplay(currentHp, maxHp, tempHp, textColor);
    }
    
    // Calculate percentages
    const currentPercentage = Math.min(100, Math.round((current / max) * 100));
    const tempPercentage = temp > 0 ? Math.min(100, Math.round((temp / max) * 100)) : 0;
    const lostPercentage = Math.max(0, 100 - currentPercentage - tempPercentage);
    
    // Determine bar color for current HP
    let barColor;
    let isCritical = false;
    let rangePerColor = 14.28; // Approximately 100/7
    
    if (currentPercentage <= rangePerColor * 1) {
        barColor = '#dc2626'; // Red
        isCritical = true;
    } else if (currentPercentage <= rangePerColor * 2) {
        barColor = '#eb4d1e'; // Orange
    } else if (currentPercentage <= rangePerColor * 3) {
        barColor = '#f97316'; // Orange
    } else if (currentPercentage <= rangePerColor * 4) {
        barColor = '#f2930f'; // Dark Yellow
    } else if (currentPercentage <= rangePerColor * 5) {
        barColor = '#eab308'; // Yellow
    } else if (currentPercentage <= rangePerColor * 6) {
        barColor = '#86bc33'; // Light Green
    } else {
        barColor = '#22c55e'; // Green
    }
    
    // Create container
    const container = document.createElement('div');
    container.className = `hp-cell-container ${isCritical ? 'hp-critical' : ''}`;
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '40px';
    container.style.overflow = 'hidden';
    container.style.borderRadius = '4px';
    
    // Create background for lost HP (grey)
    if (lostPercentage > 0) {
        const lostBackground = document.createElement('div');
        lostBackground.className = 'hp-lost-background';
        lostBackground.style.position = 'absolute';
        lostBackground.style.top = '0';
        lostBackground.style.left = '0';
        lostBackground.style.width = '100%';
        lostBackground.style.height = '100%';
        lostBackground.style.backgroundColor = '#4a5568'; // Dark grey
        lostBackground.style.opacity = '0.7';
        lostBackground.style.zIndex = '1';
        container.appendChild(lostBackground);
    }
    
    // Create foreground for current HP (colored)
    if (currentPercentage > 0) {
        const foreground = document.createElement('div');
        foreground.className = 'hp-foreground';
        foreground.style.position = 'absolute';
        foreground.style.top = '0';
        foreground.style.left = '0';
        foreground.style.width = `${currentPercentage}%`;
        foreground.style.height = '100%';
        foreground.style.backgroundColor = barColor;
        foreground.style.zIndex = '2';
        foreground.style.boxShadow = 'inset 0 0 10px rgba(255,255,255,0.2)';
        container.appendChild(foreground);
    }
    
    // Create temp HP overlay (yellow)
    if (tempPercentage > 0) {
        const tempOverlay = document.createElement('div');
        tempOverlay.className = 'hp-temp-overlay';
        tempOverlay.style.position = 'absolute';
        tempOverlay.style.top = '0';
        tempOverlay.style.left = `${currentPercentage}%`;
        tempOverlay.style.width = `${tempPercentage}%`;
        tempOverlay.style.height = '100%';
        tempOverlay.style.backgroundColor = '#eab308'; // Yellow
        tempOverlay.style.opacity = '0.8';
        tempOverlay.style.zIndex = '3';
        tempOverlay.style.boxShadow = 'inset 0 0 10px rgba(255,255,255,0.3)';
        container.appendChild(tempOverlay);
        
        // Add pattern to temp HP section
        const tempPattern = document.createElement('div');
        tempPattern.style.position = 'absolute';
        tempPattern.style.top = '0';
        tempPattern.style.left = '0';
        tempPattern.style.width = '100%';
        tempPattern.style.height = '100%';
        tempPattern.style.backgroundImage = 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)';
        tempOverlay.appendChild(tempPattern);
    }
    
    // Create HP text (current/max+temp)
    const hpText = document.createElement('div');
    hpText.className = 'hp-text';
    
    // Format text based on temp HP
    let displayText;
    if (temp > 0) {
        displayText = `${currentHp}/${maxHp}+${temp}`;
    } else {
        displayText = `${currentHp}/${maxHp}`;
    }
    
    hpText.textContent = displayText;
    hpText.style.color = 'white';
    hpText.style.position = 'absolute';
    hpText.style.top = '50%';
    hpText.style.left = '50%';
    hpText.style.transform = 'translate(-50%, -50%)';
    hpText.style.width = '100%';
    hpText.style.textAlign = 'center';
    hpText.style.padding = '2px';
    hpText.style.fontWeight = 'bold';
    hpText.style.textShadow = '0 0 3px rgba(0,0,0,0.8)';
    hpText.style.zIndex = '4';
    
    // Create tooltip with detailed info
    let tooltipText = `${currentHp}/${maxHp} HP`;
    if (temp > 0) {
        tooltipText += ` + ${temp} temporary HP`;
        const totalWithTemp = current + temp;
        const totalPercentage = Math.round((totalWithTemp / max) * 100);
        tooltipText += `\nTotal: ${totalWithTemp}/${max} (${totalPercentage}%)`;
    } else {
        const percentage = Math.round((current / max) * 100);
        tooltipText += ` (${percentage}%)`;
    }
    hpText.title = tooltipText;
    
    container.appendChild(hpText);
    
    // Add temp HP indicator badge
    if (temp > 0) {
        const tempBadge = document.createElement('div');
        tempBadge.className = 'hp-temp-badge';
        tempBadge.textContent = `+${temp}`;
        tempBadge.style.position = 'absolute';
        tempBadge.style.top = '2px';
        tempBadge.style.right = '2px';
        tempBadge.style.backgroundColor = 'rgba(234, 179, 8, 0.9)'; // Yellow
        tempBadge.style.color = 'black';
        tempBadge.style.fontSize = '10px';
        tempBadge.style.fontWeight = 'bold';
        tempBadge.style.padding = '1px 4px';
        tempBadge.style.borderRadius = '3px';
        tempBadge.style.zIndex = '5';
        tempBadge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
        container.appendChild(tempBadge);
    }
    
    return container;
}

// Update the simple display function
function createSimpleHpDisplay(currentHp, maxHp, tempHp, textColor) {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    
    let displayText = `${currentHp}/${maxHp}`;
    if (tempHp && parseInt(tempHp) > 0) {
        displayText += `+${tempHp}`;
    }
    
    const hpText = document.createElement('div');
    hpText.textContent = displayText;
    hpText.style.color = textColor;
    hpText.style.fontWeight = 'bold';
    
    container.appendChild(hpText);
    return container;
}
function getHpStatusDescription(percentage) {
    if(percentage <= 10.0) return 'Al borde de la muerte';
    else if(percentage <= 30.0) return 'Severamente herido';
    else if(percentage <= 50.0) return 'Muy herido';
    else if(percentage <= 80.0) return 'Herido';
    else if(percentage < 100.0) return 'Levemente herido';
    return 'Intacto';
}
// Helper function to update cell with HP bar
function updateCellWithHpBar(cell, hp, maxHp, tempHp, textColor) {
    cell.innerHTML = ''; // Clear
    console.log('updateCellWithHpBar called with:', {hp, maxHp, tempHp, textColor});
    const hpDisplay = createHpProgressBar(hp, maxHp, tempHp, textColor);
    cell.appendChild(hpDisplay);
}
// HP edit handler factory
function createHpEditHandler(data, cell, textColor) {
    return () => {
        const currentValue = data.hp;
        window.showNumberPrompt(currentValue, (newValue) => {
            const rowIndex = window.encounterTableData.findIndex(item => {
                if (data.type === 'player') {
                    return item.name === data.name && item.type === 'player';
                } else {
                    return item.id === data.id;
                }
            });
            
            if (rowIndex !== -1) {
                window.encounterTableData[rowIndex].hp = newValue;
                data.hp = newValue;
                updateCellWithHpBar(cell, newValue, data.maxHp, textColor);
            }
        });
    };
}
// Export the function for manual use
window.convertToEncounterTable = convertToEncounterTable;
window.addRowToDOM = addRowToDOM; // Make it available globally
