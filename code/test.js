//console.log('🎉 TEST SCRIPT LOADED AND EXECUTING!', new Date().toISOString());

// Create visible element
var testMarker = document.createElement('div');
testMarker.id = 'test-script-marker';
testMarker.style.cssText = 'position: fixed; top: 50px; left: 10px; background: purple; color: white; padding: 10px; z-index: 99998; font-weight: bold; border-radius: 5px;';
testMarker.textContent = 'TEST SCRIPT WORKING - ' + new Date().toLocaleTimeString();
document.body.appendChild(testMarker);

if (!window.githubRoot) 
    window.githubRoot = 'https://cdn.jsdelivr.net/gh/luisivanfv/my_dnd_data@main/';
// Expose a simple function
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
        /*await loadSpells();
        await loadCharacters();
        await loadEncounters();
        await loadLocations();
        await loadSearchBoxes();
        await loadWikiLists();
        await loadLookers();
        await renameWikisWithNames();
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');*/
};
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
    if(roll == 1)
        popup.show(colorText('Nat 1', 'red'));
    else if(roll == 20)
        popup.show('Nat 20!');
    else if(mod != 0) {
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
function toUpper(str) {
	return str
		.toLowerCase()
		.split(' ')
		.map(function(word) {
			return word[0].toUpperCase() + word.substr(1);
		})
		.join(' ');
}
async function getKeywordsFromFolder(folderName) {
    return (await getFilenames(folderName)).map(file => file.replace(/\.json$/, '').replaceAll('-', ' '));
}
function keywordToUrl(txt, color, url, fontSize) {
    if (!url) return color ? `<span style="color:${color}">${txt}</span>` : txt;
    return getImagePreview(url, txt, color, fontSize);
}
async function loadStatblocks() {
    Array.from(document.getElementsByClassName('statblock')).forEach(async (element) => {
        let creatureSearched = element.id.toString().split('_statblock')[0].replaceAll('_', ' ');
        if(creatureSearched == 'creature')
            creatureSearched = getUrlParameter('name');
        else
            return;
        const creatureInfo = await getJson(`statblocks/${creatureSearched}`);
        const allReplacements = await buildAllReplacements(true, true, true, true, true, 'black', keywordSizeInStatblock);
        if (!creatureInfo) return;
        element.outerHTML = `
            <div id="global-image-preview" class="global-image-preview">
                <img src="" alt="" style="max-width: 300px; max-height: 200px; display: block;">
            </div>
            <div id="statblock_${creatureSearched}" class="stat-block wide">
                <hr class="orange-border" />
                <div class="section-left">
                    <div class="creature-heading">
                        ${getImagePreview(window.githubRoot + 'images/monsters/' + creatureSearched + ".jpeg", toUpper(creatureSearched.replace('-', ' ')), null, '26px')}
                        <h2 style="font-size: 15px;">${await enrichText(creatureInfo.creatureType, allReplacements, { fontColor: 'black' })}</h2>
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
async function getSoundboardForCreature(sounds) {
    if (!sounds) return '';
    let html = '';
    await fetchMapIfNotSet('icons');
    Array.from(sounds).forEach((sound) => {
        let iconData = window.icons.get(sound.icon);
        console.log('ASDF:');
        console.log(sound.icon);
        console.log(iconData);
        console.log(window.icons);
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
    const enrichedText = await enrichText(txt, replacements, options);
    return `<div class="property-line">
        <h4>${title} </h4>${enrichedText}
    </div>`;
}
function playSoundIfPossible(soundUrl) {
    window.event.preventDefault();
    AudioManager.playSound(`${window.githubRoot}sound_effects/${soundUrl}.mp3`, {volume: 0.5});
}
async function enrichText(txt, replacements, options = {}) {
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
        const richActionDescription = await enrichText(action_description, replacements, options);
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