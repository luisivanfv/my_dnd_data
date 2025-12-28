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
        initLazyPreviews();
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
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
};

async function loadLocations() {
    Array.from(document.getElementsByClassName('location')).forEach(async (element) => {
        const locationSlug = getUrlParameter('name');
        if(!locationSlug) return;
        const locationData = JSON.parse(localStorage.getItem(`locations_${locationSlug}.json`));
        console.log(locationData);
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
            const name = toUpper(getUrlParameter('name').replaceAll('-', ' '));
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
                        ${getImagePreview(window.githubRoot + 'images/monsters/' + creatureSearched + ".jpeg", toUpper(creatureSearched.replaceAll('-', ' ')), null, '26px')}
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
        console.log(searchData);
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

// The onclick function you requested
function selectedInSearchBar(selectedValue) {
  console.log('selectedInSearchBar was triggered with value:', selectedValue);
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
function getPlayersObjects() {
}
// Also export the function for manual use
window.convertToSearchBar = convertToSearchBar;
window.selectedInSearchBar = selectedInSearchBar;
// ENCOUNTER TABLE

// Function to initialize data from localStorage players and monsters
function initializeTableData() {
    const tableForData = [];
    let idCounter = 1;
    
    console.log('Beginning');
    console.warn(tableForData.length);
    // Get player data from localStorage
    try {
        const playerData = JSON.parse(localStorage.getItem('players'));
        if (playerData && typeof playerData === 'object') {
            const playerKeys = Object.keys(playerData);
            for (let i = 0; i < playerKeys.length; i++) {
                const playerKey = playerKeys[i];
                const playerInfo = playerData[playerKey];
                console.log(playerKey);
                console.log(playerInfo);
                if (playerInfo && typeof playerInfo === 'object') {
                    tableForData.push({
                        id: idCounter++,
                        initiative: 0,
                        name: toUpper(playerInfo.name),
                        ac: playerInfo.ac || 10,
                        hp: playerInfo.maxHp || '0/0',
                        tempHp: '0',
                        conditions: '',
                        notes: '',
                        type: 'player',
                        sourceKey: playerKey
                    });
                }
            }
            console.log('Players loaded to table');
            console.warn(tableForData.length);
        }
    } catch (error) {
        console.error('Error loading player data:', error);
    }
    
    // Get monster data from localStorage (when available)
    try {
        const monsterData = JSON.parse(localStorage.getItem('monsters'));
        if (monsterData && typeof monsterData === 'object') {
            const monsterKeys = Object.keys(monsterData);
            for (let i = 0; i < monsterKeys.length; i++) {
                const monsterKey = monsterKeys[i];
                const monsterInfo = monsterData[monsterKey];
                
                if (monsterInfo && typeof monsterInfo === 'object') {
                    tableForData.push({
                        id: idCounter++,
                        initiative: 0,
                        name: monsterKey.charAt(0).toUpperCase() + monsterKey.slice(1),
                        ac: monsterInfo.ac || 10,
                        hp: monsterInfo.hp || '0',
                        maxHp: monsterInfo.hp || '0',
                        tempHp: '0',
                        conditions: '',
                        notes: '',
                        type: 'monster',
                        sourceKey: monsterKey
                    });
                }
            }
            console.log('Monsters loaded to table');
            console.warn(tableForData.length);
        }
    } catch (error) {
        console.error('Error loading monster data:', error);
    }
    
    // Save this initialized data to localStorage (encounterData) for persistence
    console.error(tableForData);
    tableForData.forEach((item) => {
        console.log(item);
    });
    return tableForData;
}
function convertToEncounterTable() {
  // Get all elements with the class "to-encounter-table"
  const elements = document.querySelectorAll('.to-encounter-table');
  
  elements.forEach(element => {
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
    
    const headers = ['ID', 'I', 'Name', 'AC', 'HP', 'Max HP', 'Temp HP', 'Conditions', 'Notes'];
    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    
    // Initialize table data from playerData and monsterData
    let tableData = [];
    
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
        // Make a copy of tableData to sort
        const sortedData = [...tableData];
        
        // Sort by initiative (highest first)
        sortedData.sort((a, b) => {
            const initA = parseInt(a.initiative) || 0;
            const initB = parseInt(b.initiative) || 0;
            return initB - initA; // Higher initiative first
        });
        
        // Update IDs based on new order
        sortedData.forEach((row, index) => {
            row.id = index + 1;
        });
        
        // Replace tableData with sorted version
        tableData.length = 0; // Clear the array
        tableData.push(...sortedData); // Add sorted data back
        
        // Re-render with sorted data
        renderTable();
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
    }
    
    // Function to create a text prompt
    function showTextPrompt(currentValue, callback) {
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
      `;
      
      const input = document.createElement('input');
      input.type = 'text';
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
        callback(input.value);
        document.body.removeChild(modal);
      });
      
      // Allow Enter key to confirm
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          callback(input.value);
          document.body.removeChild(modal);
        }
      });
      
      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
      
      modalContent.appendChild(document.createTextNode('Enter text:'));
      modalContent.appendChild(input);
      modalContent.appendChild(buttonContainer);
      modal.appendChild(modalContent);
      
      document.body.appendChild(modal);
      input.focus();
      input.select();
    }
    
    // Function to add a new row
    // Function to add a new row to the DOM (does NOT add to tableData)
function addRowToDOM(data = null, index = null) {
  const row = document.createElement('tr');
  
  // Define which columns are editable and their types
  const columns = [
    { key: 'id', editable: true, type: 'number' },
    { key: 'initiative', editable: true, type: 'number' },
    { key: 'name', editable: false, type: 'text' },
    { key: 'ac', editable: true, type: 'number' },
    { key: 'hp', editable: false, type: 'text' },
    { key: 'maxHp', editable: false, type: 'text' },
    { key: 'tempHp', editable: false, type: 'text' },
    { key: 'conditions', editable: false, type: 'text' },
    { key: 'notes', editable: false, type: 'text' }
  ];
  
  columns.forEach((column, cellIndex) => {
    const cell = document.createElement('td');
    cell.dataset.key = column.key;
    cell.dataset.rowIndex = index; // Store the original index
    
    // Set cell content
    let cellValue = '';
    if (data && data[column.key] !== undefined) {
      cellValue = data[column.key];
    }
    
    cell.textContent = cellValue;
    
    // Only make certain cells editable
    if (column.editable) {
      cell.style.cursor = 'pointer';
      cell.classList.add('editable-cell');
      
      // In addRowToDOM function:
    row.dataset.rowId = data.id; // Store the ID on the row

    // In the click handler:
    cell.addEventListener('click', () => {
        const currentValue = cell.textContent;
        if (column.type === 'number') {
            showNumberPrompt(currentValue, (newValue) => {
            cell.textContent = newValue;
            // Find the row in tableData by ID
            const rowId = parseInt(row.dataset.rowId);
            const rowIndex = tableData.findIndex(item => item.id === rowId);
            
            if (rowIndex !== -1) {
                tableData[rowIndex][column.key] = newValue;
            }
            });
        }
    });
    } else {
      cell.style.cursor = 'default';
    }
    
    row.appendChild(cell);
  });
  
  // Add delete button cell
  const deleteCell = document.createElement('td');
  const deleteButton = document.createElement('button');
  deleteButton.textContent = '×';
  deleteButton.style.cssText = `
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
  `;
  deleteButton.addEventListener('click', () => {
    const rowIndex = parseInt(row.querySelector('td').dataset.rowIndex);
    if (!isNaN(rowIndex) && rowIndex >= 0) {
      tableData.splice(rowIndex, 1);
      renderTable(); // Re-render after deletion
    }
  });
  deleteCell.appendChild(deleteButton);
  row.appendChild(deleteCell);
  
  // Insert at specific position or append
  if (index !== null && index >= 0 && index < tbody.children.length) {
    tbody.insertBefore(row, tbody.children[index]);
  } else {
    tbody.appendChild(row);
  }
}

// Function to render the entire table
function renderTable() {
  tbody.innerHTML = '';
  
  // Render each row from tableData
  tableData.forEach((rowData, index) => {
    addRowToDOM(rowData, index);
  });
}
    
    // Function to update table data
    function updateTableData(rowIndex, key, value) {
        if (rowIndex >= 0 && rowIndex < tableData.length) {
            if (!tableData[rowIndex]) {
            tableData[rowIndex] = {};
            }
            tableData[rowIndex][key] = value;
        }
    }
    
    // Function to render the entire table
    function renderTable() {
        tbody.innerHTML = '';
        const dataToRender = [...tableData];
        console.log('renderTable');
        tableData.forEach((item) => {
            console.log(item);
        });
        console.log('------');
        dataToRender.forEach((item) => {
            addRowToDOM(item);
        });
    }
    
    // Function to reload from source data
    function reloadFromSourceData() {
        console.log('>>> 1');
        tableData = initializeTableData();
        console.log('<B>');
        renderTable();
    }
    
    // Create control buttons
    const controls = document.createElement('div');
    controls.className = 'table-controls';
    controls.style.cssText = `
      margin-bottom: 15px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    `;
    
    const addButton = document.createElement('button');
addButton.textContent = 'Add Row';
addButton.addEventListener('click', () => {
  // Add to tableData array
  tableData.push({
    id: tableData.length + 1,
    initiative: 0,
    name: `Creature ${tableData.length + 1}`,
    ac: 10,
    hp: '0',
    maxHp: '0',
    tempHp: '0',
    conditions: '',
    notes: '',
    type: 'custom'
  });
  
  // Re-render
  renderTable();
});
    
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All';
    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all rows?')) {
            tableData = [];
            console.log('<C>');
            renderTable();
        }
    });
    
    const sortButton = document.createElement('button');
    sortButton.textContent = 'Sort by Initiative';
    sortButton.addEventListener('click', () => {
        // Make a copy of tableData to sort
        const sortedData = [...tableData];
        
        // Sort by initiative (highest first)
        sortedData.sort((a, b) => {
            const initA = parseInt(a.initiative) || 0;
            const initB = parseInt(b.initiative) || 0;
            return initB - initA; // Higher initiative first
        });
        
        // Update IDs based on new order
        sortedData.forEach((row, index) => {
            row.id = index + 1;
        });
        
        // Replace tableData with sorted version
        tableData.length = 0; // Clear the array
        tableData.push(...sortedData); // Add sorted data back
        
        // Re-render with sorted data
        renderTable();
    });
    
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'Reload from Source';
    reloadButton.addEventListener('click', () => {
      if (confirm('This will replace current table with player and monster data. Continue?')) {
        reloadFromSourceData();
        alert('Table reloaded from source data!');
      }
    });
    
    controls.appendChild(addButton);
    controls.appendChild(sortButton);
    controls.appendChild(reloadButton);
    controls.appendChild(clearButton);
    
    // Initialize and render table data
    tableData = initializeTableData();
    renderTable();
    
    // Assemble everything
    tableContainer.appendChild(controls);
    tableContainer.appendChild(table);
    element.appendChild(tableContainer);
  });
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
      border: 1px solid #ddd;
    }
    
    .encounter-table td {
      padding: 12px;
      border: 1px solid #ddd;
    }
    
    .encounter-table td.editable-cell {
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .encounter-table td.editable-cell:hover {
      background-color: #e0f7fa;
    }
    
    .encounter-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    .encounter-table tr:hover {
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
  document.head.appendChild(style);
}

// Export the function for manual use
window.convertToEncounterTable = convertToEncounterTable;