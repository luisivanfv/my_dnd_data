function calculateD20PlusModifier(modifier) {
    let d20result = Math.floor(Math.random() * 21);
    let modifierStr = modifier < 0 ? "-" : "+";
    if (d20result == 1)
        popup.show(colorText('Nat 1', 'red'));
    else if (d20result == 20)
        popup.show('Nat 20');
    else {
        if(modifierStr == "-") {
            popup.show(`${colorText(`${d20result.toString()} ${modifierStr} ${(modifier * -1).toString()} = `, 'white')}${Math.max((d20result + modifier), 1).toString()}`)
        }
        else {
            popup.show(`${colorText(`${d20result.toString()} ${modifierStr} = `)}${(d20result + modifier).toString()}`);
        }
    }
}

const savingThrowFields= document.getElementsByClassName("turn_to_saving_throw");

for(let i=0;i<savingThrowFields.length;i++) {
    let savingThrowField = savingThrowFields[i];
    let dataFields = savingThrowField.innerHTML.split(",");
    let savingThrowFieldId = savingThrowField.id;
    let new_html =  '<button id="'+savingThrowFieldId +'_button" type="button" onclick="calculateD20PlusModifier('+dataFields[1]+')">'+dataFields[0]+'</button>';

    savingThrowField.innerHTML= new_html ;
}

const toHitFields= document.getElementsByClassName("turn_to_hit");

for(let i=0;i<savingThrowFields.length;i++) {
    let toHitField= toHitFields[i];
    let dataFields = toHitField.innerHTML.split(",");
    let toHitFieldId = toHitField.id;
    let new_html =  '<button id="'+toHitFieldId +'_button" type="button" onclick="calculateD20PlusModifier('+dataFields[1]+')">'+dataFields[0]+'</button>';

    toHitField.innerHTML= new_html ;
}

// 1,1.1,1.1.1,1.1.2,1.2,1.2.1,1.3
/*
1
  1.1
    1.1.1
    1.1.2
  1.2
    1.2.1
  1.3
*/


	const divs_to_convert = document.getElementsByClassName('convert_to_nested_accordion');
	
	for(let i=0;i<divs_to_convert.length;i++) {
		let div_to_convert_id = divs_to_convert[i].id;
		let new_html = getAccordionHtml(div_to_convert_id, divs_to_convert[i].innerHTML);
		document.getElementById(div_to_convert_id).outerHTML = new_html;
	}

function getPieceLevel(piece) {
	return (piece.match(/[.]/g) || []).length + 1;
}
// 1[Nombre de misión],1.1[Submisión 1],1.1.1[Subsubmisión 1],1.1.2[Subsubmisión 2],1.2[Submisión 2],1.2.1[Subsubmisión 3],1.3[Submisión 3]
/*
1$Nombre de misión,
  1.1[Submisión 1],
	1.1.1[Subsubmisión 1],
	1.1.2[Subsubmisión 2],
  1.2[Submisión 2],
	1.2.1[Subsubmisión 3],
  1.3[Submisión 3],
*/
function getAccordionHtml(accordion_id, structure_string) {
	const big_pieces = structure_string.replace(/(\r\n|\n|\r)/gm, "").split("#");
	let result_html = '';
	let current_piece = null;
	let previous_piece = null;
	let number_list = [];
	let name_list = [];
	let content_list = [];
	for(let i =0;i<big_pieces.length;i++) {
		number_list.push(big_pieces[i].split('{')[0]);
		name_list.push(big_pieces[i].split('{')[1]);
		content_list.push(big_pieces[i].split('{')[2]);
	}
	cleanAndPrintArray('number_list', number_list);
	cleanAndPrintArray('name_list', name_list);
	cleanAndPrintArray('content_list', content_list);
	open_close_array = getOpenCloseArray(getLevelsArray(number_list));
	let open_counter = 0;
	for(let i=0;i<open_close_array.length;i++) {
		if(open_close_array[i] == 'o') {
			result_html += `
				<div class="accordion ui-accordion ui-widget ui-helper-reset" role="tablist">
					<h3 class="ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all" 
					role="tab" id="ui-accordion-1-header-0" 
					aria-controls="ui-accordion-1-panel-0" 
					aria-selected="false" 
					tabindex="0">
					<span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"></span>`+name_list[open_counter]+`</h3>
					<div class="content">
						`+content_list[open_counter];
			open_counter++;
		}
		else {
			result_html += `</div></div>`;
		}
	}
	return result_html;
}
function toSavingThrowField(mod) { // UPGRADE
	return '(' + mod + ')';
}
function getOpenCloseArray(levels_array){
	if(levels_array.length < 1)
		return [];
	else if (levels_array.length == 1)
		return ['o','c'];
	let open_close_array = ['o'];
	let current_level = levels_array[0];
	for(let i=1;i<levels_array.length;i++){
		if(levels_array[i] > current_level) {
			open_close_array.push('o');
		}
		else if(levels_array[i] == current_level) {
			open_close_array.push('c');
			open_close_array.push('o');
		}
		else {
			open_close_array.push('c');
			open_close_array.push('c');
			open_close_array.push('o');
		}
		current_level = levels_array[i];
	}
	for(let i=0;i<current_level;i++)
		open_close_array.push('c');
	return open_close_array;
}
function getLevelsArray(number_list) {
	let levels_array = [];
	for(let i=0;i<number_list.length; i++) {
		levels_array.push(getPieceLevel(number_list[i]));
	}
	return levels_array;
}
function playSound(url) {
    const audio = new Audio(url);
    audio.play().catch(error => {
        console.error("Audio playback failed:", error);
    });
}
// Audio manager with better error handling and features
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
$(".accordion").accordion({
    header: "> h3:not(.item)",
    heightStyle: "content",
    active: false,
    collapsible: true
});
function toUpper(str) {
	return str
		.toLowerCase()
		.split(' ')
		.map(function(word) {
			return word[0].toUpperCase() + word.substr(1);
		})
		.join(' ');
}
const soundIconSize = '30';
const iconSize = '26';
const smallIconSize = '17';
const specialTextColor = 'FAB005';
const iconColor = '8B0000';
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
function replaceIcons(txt, replacements) {
    const escapedKeys = Object.keys(replacements).map(key => 
        key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const pattern = new RegExp(escapedKeys.join('|'), 'g');
    return txt.replace(pattern, match => replacements[match]);
}
const secondsPopupShown = 5;
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

// Create singleton instance
const popup = new PopupManager();
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
const damageTypes = ['Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic', 'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder'];
const damageTypeIconSize = "20";
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
function addSpellComponentIcons(txt) {
    txt = txt.replaceAll(', ', '   ');
    const replacements = {
        'V': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/sf-black-filled/64/${specialTextColor}/medium-volume.png" alt="medium-volume"/>`,
        'S': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/pastel-glyph/64/${specialTextColor}/hand--v3.png" alt="hand--v3"/>`,
        'M': `<img width="${iconSize}" height="${iconSize}" src="https://img.icons8.com/ios-filled/50/${specialTextColor}/diamond--v1.png" alt="diamond--v1"/>`
    };
    return replaceIcons(txt, replacements);
}
async function getJson(url) {
    const response = await fetch(`${githubRoot}${url}.json?t=${Date.now()}`);
    return await response.json();
}
async function getJsonMap(url) {
    const response = await fetch(`${githubRoot}${url}.json?t=${Date.now()}`);
    const jsonObject = await response.json()
    return new Map(Object.entries(jsonObject));
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
        let array = await getFilenames(`${element.id}`);
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
async function renameWikisWithNames() {
    if(getUrlParameter('name'))
        Array.from(document.getElementsByClassName('wiki-page-name')).forEach((element) => {
            const name = toUpper(getUrlParameter('name').replaceAll('-', ' '));
            element.innerHTML = name;
            document.title = name;
        });
}
async function getKeywordsFromFolder(folderName) {
    return (await getFilenames(folderName)).map(file => file.replace(/\.json$/, '').replaceAll('-', ' '));
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
async function loadEncounters() {
    Array.from(document.getElementsByClassName('encounter')).forEach(async (element) => {
        const replacements = await buildAllReplacements(addWikiUrls, addSpellUrls, addCreatureUrls, addLocationUrls, addCharacterUrls, fontColor, fontSize);
        const encounterSlug = getUrlParameter('name');
        if(!encounterSlug) return;
        const encounterData = await getJson(`encounters/${encounterSlug}`);
        console.log(encounterData);
        html = `<div id="${encounterSlug}" class="encounter">
            <span style="color: white">${await enrichText(encounterData.description, replacements, { fontColor: specialTextColor })}</span>`;
        html += `</div>`;
        element.outerHTML = html;
    });
}
async function loadCharacters() {
    Array.from(document.getElementsByClassName('character')).forEach(async (element) => {
        const replacements = await buildAllReplacements(addWikiUrls, addSpellUrls, addCreatureUrls, addLocationUrls, addCharacterUrls, fontColor, fontSize);
        const characterSlug = getUrlParameter('name');
        if(!characterSlug) return;
        const characterData = await getJson(`characters/${characterSlug}`);
        console.log(characterData);
        html = `<div id="${characterSlug}" class="character">
            <span style="color: white">${await enrichText(characterData.description, replacements, { fontColor: specialTextColor })}</span>`;
        html += `</div>`;
        element.outerHTML = html;
    });
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
                        ${getImagePreview(githubRoot + 'images/monsters/' + creatureSearched + ".jpeg", toUpper(creatureSearched.replace('-', ' ')), null, '26px')}
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
async function generateReplacements(addWikiUrls, addSpellUrls, addCreatureUrls, addLocationUrls, addCharacterUrls, fontColor, fontSize) {
    if(addWikiUrls) {
        const keywords = await fetchIfNotSet('keywords');
        for (const [keyword, url] of Object.entries(keywords)) {
            allEntries.push(
                [keyword, keywordToUrl(keyword, fontColor, url, fontSize)],
                [toUpper(keyword), keywordToUrl(toUpper(keyword), fontColor, url, fontSize)]
            );
        }
    }
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
async function enrichText(txt, replacements, options = {}) {
    const {
        styleText = true,
        addDieRolls = true,
        addToHit = true,
        addWikiUrls = true,
        addSpellUrls = true,
        addCreatureUrls = true,
        addLocationUrls = true,
        addCharacterUrls = true,
        fontColor = '#ffffff',
        fontSize = '16px'
    } = options;
    if(styleText) txt = addTextStyling(txt);
    if(addDieRolls) txt = replaceFormulasWithLinks(txt, { fontColor, fontSize });
    if(addToHit) txt = addToHitFormulas(txt, { fontColor, fontSize });
    return replaceIcons(txt, replacements);
}
function toCreatureLooker(name) {
    const slug = `creature?name=${name.replaceAll(' ', '-')}`;
    return keywordToUrl(toUpper(name), 'black', slug, '14px');
}
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

function adjustImageDisplay(img) {
    // This ensures the image maintains its aspect ratio
    // The CSS already handles this with object-fit: contain
    // and max-width/max-height: 100%
    
    // Optional: You can add logic here to adjust positioning
    // if you want the image centered differently
    img.style.objectFit = 'contain';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
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

function hideImagePreview(id) {
    const preview = document.getElementById(id);
    if (preview) {
        preview.style.display = 'none';
        
        // Remove event listeners to prevent memory leaks
        const newPreview = preview.cloneNode(true);
        preview.parentNode.replaceChild(newPreview, preview);
    }
}

function isMouseOverImageLink() {
    const hovered = document.querySelector(':hover');
    return hovered && hovered.classList.contains('image-preview-link');
}
window.imagePreviewState = {
    hoverTimer: null,
    hideTimer: null,
    currentPreviewId: null,
    isPreviewVisible: false
};
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