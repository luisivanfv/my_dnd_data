const websiteRoot = 'https://blindingdarkness.obsidianportal.com';const mapKeys = ['colorReplacements', 'keywordReplacements'];
const txtSize = '16px';
const lookerTxtSize = '16px';
const actionTitleTxtSize = '14px';
const characters = null;
const colors = null;

const DataManager = (function() {
    const data = {
        colors: new Map()
    };
    let isLoaded = false;
    const events = new EventTarget();
    
    async function loadAllData() {
        const urls = Object.fromEntries(
            mapKeys.map(key => [key, `${githubRoot}${key}.json?t=${Date.now()}`])
        );
        try {
            const promises = Object.entries(urls).map(async ([key, url]) => {
                try {
                    const response = await fetch(url, {cache: 'no-store'});
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const jsonData = await response.json();
                    data[key] = new Map(Object.entries(jsonData));
                    console.log(`✓ ${key}: ${data[key].size} entries`);
                } catch (error) {
                    console.warn(`⚠ ${key}: Using empty Map (${error.message})`);
                    data[key] = new Map();
                }
            });
            await Promise.all(promises);
            isLoaded = true;
            events.dispatchEvent(new CustomEvent('dataLoaded', { detail: data }));
        } catch (error) {
            console.error('❌ Error loading data:', error);
        }
    }
    loadAllData();
    return {
        get: (key) => data[key] || new Map(),
        getAll: () => data,
        isLoaded: () => isLoaded,
        waitForLoad: () => {
            return new Promise((resolve) => {
                if (isLoaded)
                    resolve(data);
                else
                    events.addEventListener('dataLoaded', (e) => {
                        resolve(e.detail || data);
                    }, { once: true });
            });
        },
        onLoad: (callback) => {
            if (isLoaded)
                callback(data);
            else
                events.addEventListener('dataLoaded', (e) => {
                    callback(e.detail || data);
                }, { once: true });
        }
    };
})();
window.DataManager = DataManager;
async function getMap(key) {
    try {
        const data = await DataManager.waitForLoad();
        if (!data || !data.hasOwnProperty(key)) {
            console.warn(`Key "${key}" not found in DataManager. Available keys:`, Object.keys(data));
            return new Map();
        }
        const map = data[key];
        if (!(map instanceof Map)) {
            console.warn(`Key "${key}" is not a Map, it's:`, typeof map);
            if (map && typeof map === 'object' && !Array.isArray(map))
                return new Map(Object.entries(map));
            return new Map();
        }
        return map;
    } catch (error) {
        console.error(`Error getting map for key "${key}":`, error);
        return new Map();
    }
}
async function getAllFilesFromGitHubFolder(folderPath, format) {
    const apiUrl = `https://api.github.com/repos/luisivanfv/my_dnd_data/contents/${folderPath}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        const files = await response.json();
        const jsonFiles = files.filter(file => 
            file.name.endsWith(format) && file.type === 'file'
        );
        return jsonFiles.map(file => file.name.replace(format, ''));
    } catch (error) {
        console.error('Error fetching file list:', error);
        return [];
    }
}
async function fetchFolderDataSequentially() {
    try {
        const folderToConstant = new Map();
        //folderToConstant.set('statblocks//.json', {constantName: 'monsterList', isBinary: false});
        folderToConstant.set('images/monsters//.jpeg', {constantName: 'monsterImages', isBinary: true});
        //folderToConstant.set('spells//.json', {constantName: 'spells', isBinary: false});
        for(const [key, value] of folderToConstant) {
            const [folder, format] = key.split('//');
            const itemNames = await getAllFilesFromGitHubFolder(folder, format);
            const itemMap = new Map();
            for (const itemName of itemNames)
                try {
                    const itemUrl = `${githubRoot}${folder}/${itemName}${format}`;
                    const itemResponse = await fetch(itemUrl);
                    if (itemResponse.ok) {
                        if(value.isBinary) {
                            const blob = await itemResponse.blob();
                            const objectUrl = URL.createObjectURL(blob);
                            itemMap.set(itemName, {
                                blob: blob,
                                url: objectUrl,
                                name: itemName
                            });
                        } else {
                            itemMap.set(itemName, await itemResponse.json());
                        }
                    } else {
                        console.warn(`Failed to load ${itemName}: ${itemResponse.status}`);
                    }
                } catch (error) {
                    console.error(`Error loading ${itemName}${format}:`, error);
                }
            window[value.constantName] = itemMap;
        }
    } catch (error) {
        console.error('Error in fetchFolderDataSequentially:', error);
        throw error;
    }
}
async function fetchIfNotSet(key) {
    if(!window[key])
        window[key] = await getJson(key);
    return window[key];
}
async function fetchMapIfNotSet(key) {
    if(!window[key])
        window[key] = await getJsonMap(key);
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
async function getColorsForCharacter(name) {
    name = name.trim().toLowerCase().replace('\'', '');
    await fetchIfNotSet('characters');
    await fetchMapIfNotSet('colors');
    return [window.colors.get(window.characters.get(name).split('//')[2]), 
            window.colors.get(window.characters.get(name).split('//')[3])];
}
function toSlug(name) {
    return name.toString().trim().toLowerCase().replaceAll(' ', '_');
}
function sortEncounterTable() {
    Array.from(document.querySelectorAll('#sortable_table')).forEach((table) => {
        let rowsArray = [];
        Array.from(table.rows).forEach((row) => {
            if(row.rowIndex > 1 && Array.from(row.cells).length > 0) {
                rowsArray.push([
                    row.cells[0].innerHTML.trim(), 
                    row.outerHTML, 
                    row.rowIndex
                ]);
            }
        });
        rowsArray.sort(function(a, b) {
            return b[0] - a[0];
        });
        let oldTitleRow = table.rows[0].outerHTML;
        let oldHiddenRow = table.rows[1].outerHTML;
        $('#sortable_table tr').remove();
        let titleRow = table.insertRow(0);
        titleRow.outerHTML = oldTitleRow;
        let hiddenRow = table.insertRow(1);
        hiddenRow.outerHTML = oldHiddenRow;
        rowsArray.forEach((row) => {
            let newRow = table.insertRow(table.rows.length);
            newRow.outerHTML = row[1];
        });
    });
    addTableRightClickControls();
}
function getCharacterDisplayName(slug) {
    if(slug == 'said') return "Sa'id Alikh";
    let words = slug.replaceAll('_', ' ').split(' ');
    let name = '';
    words.forEach((word) => {
        name += (capitalizeFirstLetter(word) + ' ');
    });
    return name.trim();
}
function colorText(txt, color) {
    return `<span style="color: ${color}">${txt}</span>`;
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
function toDisplayName(str) {
    return capitalizeFirstLetters(str.replaceAll('_', ' ').replaceAll('-', ' ').trim());
}
async function dataToHtml(data, format, number, creaturesStats) {
    if(!number) number = 1;
    let identifier = format == 'pcEncounterRow' ? toSlug(data) : (number > 1 ? data + '_' + number.toString() : data);
    let tag = format == 'pcEncounterRow' ? 'pcTag' : 'hostileTag';
    let stats = format == 'pcEncounterRow' ? null : creaturesStats.get(toSlug(data));
    let numDexMod = format == 'pcEncounterRow' ? null : modToNumber(stats.split('//')[2]);
    let initiativeOnClick = format == 'pcEncounterRow' ? 'askForValue(this);' : 'askForInitiative(this, '+numDexMod+');';
    await fetchMapIfNotSet('colors');
    let backgroundTdColor = window.colors.get('gainsboro');
    let linkColor = window.colors.get('zinnwaldite');
    let armorClassOnClick = format == 'pcEncounterRow' ? 'askForValue(this);' : '';
    let displayName = format == 'pcEncounterRow' ? getCharacterDisplayName(toSlug(data)) : toDisplayName(data);
    let url = format == 'pcEncounterRow' ? getUrlForCharacter(data) : getUrlForCreature(data);
    let numberCreatureOnClick = "numberCreature(this)";
    let initialCreatureNumber = format == 'pcEncounterRow' ? number.toString() : '#';
    let hpFormula = format == 'pcEncounterRow' ? '' : stats.split('//')[1];
    let totalHpOnClick = format == 'pcEncounterRow' ? 'askForValue(this);' : "askForHp(this, '"+hpFormula+"')";
    return `
        <tr>
            <td id="initiative__${identifier}" class="nav_sort_td table_initiative_cell inactive_cell ${tag}" 
                onclick="${initiativeOnClick}" style="background: ${backgroundTdColor};">0
            </td>
            <td id="armor_class__${identifier}" class="nav_sort_td table_ac_cell inactive_cell ${tag}" 
                style="background: ${backgroundTdColor};" onclick="${armorClassOnClick}">
            </td>
            <td id="hostile_link__${identifier}" class="table_link_cell inactive_cell ${tag}" 
                style="background: ${backgroundTdColor};">
                <a href="${url}" 
                   class="lazy-preview-link"
                   data-url="${url}"
                   data-text="${displayName.replace(/"/g, '&quot;')}"
                   style="color: ${linkColor}; font-size: ${txtSize}; cursor: pointer;">
                    ${displayName}
                </a>
            </td>
            <td id="number__${identifier}" class="nav_sort_td table_tag_cell inactive_cell ${tag}" 
                onclick="${numberCreatureOnClick}" style="background: ${backgroundTdColor};">${initialCreatureNumber}
            </td>
            <td id="total_hp__${identifier}" class="nav_sort_td table_total_cell inactive_cell ${tag}" 
                onclick="${totalHpOnClick}" style="background: ${backgroundTdColor};">
            </td>
            <td id="remaining_hp__${identifier}" class="nav_sort_td table_remaining_cell inactive_cell ${tag}" 
                style="background: ${backgroundTdColor};">
            </td>
            <td id="temp_hp__${identifier}" class="nav_sort_td table_temp_cell inactive_cell ${tag}" 
                onclick="askForValue(this);" style="background: ${backgroundTdColor};">0
            </td>
            <td id="remaining_percentage__${identifier}" class="nav_sort_td table_percentage_cell inactive_cell ${tag}" 
                style="background: ${backgroundTdColor};">
            </td>
            <td id="damage_button__${identifier}" class="nav_sort_td table_damage_cell inactive_cell ${tag}" 
                onclick="heal(this);" style="background: ${backgroundTdColor};">
            </td>
            <td id="remove_button__${identifier}" class="nav_sort_td table_remove_cell inactive_cell ${tag}" 
                onclick="removeCreature(this);" style="background: ${backgroundTdColor};">
            </td>
            <td id="conditions_button__${identifier}" class="nav_sort_td inactive_cell ${tag} editable-condition" 
                style="background: ${backgroundTdColor};">
            </td>
            <td id="notes_button__${identifier}" class="nav_sort_td table_notes_cell inactive_cell ${tag}" 
                onclick="askForValue(this);" style="background: ${backgroundTdColor};">
            </td>
        </tr>`;
}
function playSoundIfPossible(soundUrl) {
    window.event.preventDefault();
    AudioManager.playSound(`${githubRoot}sound_effects/${soundUrl}.mp3`, {volume: 0.5});
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
const keywordColorInStatblock = '#997300';
const keywordSizeInStatblock = '14px';
async function addSectionIfExists(txt, replacements, title, options) {
    if(!txt || txt.trim() == '') return '';
    const enrichedText = await enrichText(txt, replacements, options);
    return `<div class="property-line">
        <h4>${title} </h4>${enrichedText}
    </div>`;
}
async function toResistanceOrImmunityField(txt, title) {
    if(!txt || txt.trim() == '') return '';
    txt = txt.replaceAll(',', '');
    return `<div class="property-line">
        <h4>${title} </h4>${await addDamageTypeIcons(txt)}
    </div>`;
}
function getUrlForCreature(creature) {
    return `${websiteRoot}/wikis/${creature.trim().toLowerCase().replace(' ', '-')}`;
}
function getUrlForCharacter(character) {
    if(character.trim().toLowerCase() == 'said') return `${websiteRoot}/characters/sa-id-alikh`;
    return `${websiteRoot}/characters/${toSlug(character)}`;
}
function modToNumber(mod) {
    if(mod.includes('+')) return parseInt(mod.split('+')[1].trim());
    if(mod.includes('-')) return parseInt(mod.split('-')[1].trim()) * -1;
    return 0;
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
function numberCreature(element) {
    element.innerHTML = prompt('Tag?');
}
function getSizeDescription(hp) {
    if(hp < 20) return 'Frágil';
    else if(hp < 40) return 'Mediano';
    else if(hp < 80) return 'Robusto';
    else if(hp < 130) return 'Fuerte';
    else if(hp < 200) return 'Muy fuerte';
    return 'Mítico';
}
function getHpTooltipText(percentage) {
    if(percentage <= 10.0) return 'Al borde de la muerte';
    else if(percentage <= 30.0) return 'Severamente herido';
    else if(percentage <= 50.0) return 'Muy herido';
    else if(percentage <= 80.0) return 'Herido';
    else if(percentage < 100.0) return 'Levemente herido';
    return 'Intacto';
}
function getPropertyAskTxt(element) {
    if(element.classList.contains('table_initiative_cell')) return 'Set initiative';
    if(element.classList.contains('table_total_cell')) return 'Set HP';
    if(element.classList.contains('table_ac_cell')) return 'Set AC';
    if(element.classList.contains('table_remaining_cell')) return 'Set remaining HP';
    if(element.classList.contains('table_temp_cell')) return 'Set temp HP';
    if(element.classList.contains('table_damage_cell')) return 'Damage amount';
    return 'Set value';
}
function updateNotes(element) {
    let notes = element.innerHTML ? element.innerHTML.trim() : '';
    let result = prompt('Update notes:', notes);
    if(result !== null && result !== undefined) element.innerHTML = result;
}
function askForValue(element) {
    if(element.classList.contains(`table_notes_cell`))
        updateNotes(element);
    else {
        let newValue = prompt(getPropertyAskTxt(element));
        if(newValue) {
            element.innerHTML = newValue;
            if(element.classList.contains(`table_total_cell`))
                element.innerHTML = `<span title="${getSizeDescription(parseInt(newValue))}">${element.innerHTML}</span>`;
            else if(element.classList.contains(`table_initiative_cell`))
                sortEncounterTable();
        }
    }
}
async function askForHp(element, formula) {
    formula = formula.trim().replaceAll(' ', '');
    let numOfDie = parseInt(formula.split('d')[0]);
    let dieSize = 0;
    let extra = 0;
    let acceptedResult = null;
    let total = 0;
    let msg = '';
    while(!acceptedResult) {
        total = 0;
        if(formula.includes('+')) {
            dieSize = parseInt(formula.split('d')[1].split('+')[0]);
            extra = parseInt(formula.split('d')[1].split('+')[1]);
        } else if(formula.includes('-')) {
            dieSize = parseInt(formula.split('d')[1].split('-')[0]);
            extra = parseInt(formula.split('d')[1].split('-')[1]) * -1;
        } else {
            dieSize = parseInt(formula.split('d')[1]);
            extra = 0;
        }
        for(let i=0;i<numOfDie;i++) total += rollDie(dieSize);
        total += extra;
        msg = formula + ' = ' + total.toString();
        if(confirm(msg + '?') == true) acceptedResult = total;
    }
    let elementId = element.id;
    let creatureName = elementId.split('total_hp__')[1];
    document.getElementById('remaining_hp__' + creatureName).innerHTML = acceptedResult.toString();
    document.getElementById('remaining_percentage__' + creatureName).innerHTML = '100%';
    let sizeDescription = getSizeDescription(parseInt(acceptedResult));
    element.innerHTML = '<span title="' + sizeDescription + '">' + acceptedResult.toString() + '</span>';
    if(element.classList.contains('inactive_cell')) await setCreature(element, true);
    refreshHpPercentage(element);
}
function decreaseOrRemoveNote(element) {
    let str = '';
    let note = element.innerHTML ? element.innerHTML.trim() : '';
    for(let i=note.length;i>0;i--) {
        if(!isNaN(note[i])) str += note[i];
        if(str != '' && isNaN(note[i])) break;
    }
    if(str != '') {
        str = str.split('').reverse().join('').trim();
        let previousNumberSize = str.length;
        let number = parseInt(str) - 1;
        if(number == 0) element.innerHTML = '';
        else element.innerHTML = `${note.substring(0, note.length - previousNumberSize)}${number}`;
    } else
        element.innerHTML = '';
}
function heal(element) {
    let elementId = element.id;
    let creatureId = elementId.split('damage_button__')[1];
    let ammount = null;
    let cancelledOrEnteredNumber = false;
    let healingInput;
    while(!cancelledOrEnteredNumber) {
        healingInput = prompt('How much healing?');
        if(!isNaN(healingInput)) {
            ammount = parseInt(healingInput);
            cancelledOrEnteredNumber = true;
        } else if(healingInput == null)
            cancelledOrEnteredNumber = true;
    }
    if(!isNaN(healingInput)) {
        let hpElement = document.getElementById('total_hp__' + creatureId);
        let remainingHpElement = document.getElementById('remaining_hp__' + creatureId);
        let hpPercentageElement = document.getElementById('remaining_percentage__' + creatureId);
        let tempHpElement = document.getElementById('temp_hp__' + creatureId);
        let totalHp = hpElement.innerHTML.includes('<span') ? parseInt(hpElement.innerHTML.split('>')[1].split('<')[0].trim()) : parseInt(hpElement.innerHTML);
        let hp = parseInt(remainingHpElement.innerHTML);
        let tempHp = parseInt(tempHpElement.innerHTML);
        hp = Math.min(hp + ammount, totalHp);
        remainingHpElement.innerHTML = hp.toString();
        tempHpElement.innerHTML = tempHp.toString();
        hpPercentageElement.innerHTML = (parseFloat(hp) / parseFloat(totalHp) * 100.0).toString() + '%';
        refreshHpPercentage(element);
    }
}
async function damage(element) {
    let elementId = element.id;
    let creatureId = elementId.split('damage_button__')[1];
    let ammount = null;
    let cancelledOrEnteredNumber = false;
    while(!cancelledOrEnteredNumber) {
        let healingInput = prompt('How much damage?');
        if(!isNaN(healingInput) && healingInput != null) {
            ammount = parseInt(healingInput);
            cancelledOrEnteredNumber = true;
        } else if(healingInput == null)
            cancelledOrEnteredNumber = true;
    }
    if(ammount != null) {
        let hpElement = document.getElementById('total_hp__' + creatureId);
        let remainingHpElement = document.getElementById('remaining_hp__' + creatureId);
        let hpPercentageElement = document.getElementById('remaining_percentage__' + creatureId);
        let tempHpElement = document.getElementById('temp_hp__' + creatureId);
        let totalHp = hpElement.innerHTML.includes('<span') ? parseInt(hpElement.innerHTML.split('>')[1].split('<')[0].trim()) : parseInt(hpElement.innerHTML);
        let hp = parseInt(remainingHpElement.innerHTML.trim());
        let tempHp = parseInt(tempHpElement.innerHTML);
        if(tempHp == 0)
            hp = Math.max(hp - ammount, 0);
        else if (tempHp >= ammount)
            tempHp -= ammount;
        else {
            hp -= (ammount - tempHp);
            tempHp = 0;
        }
        remainingHpElement.innerHTML = hp.toString();
        tempHpElement.innerHTML = tempHp.toString();
        hpPercentageElement.innerHTML = (parseFloat(hp) / parseFloat(totalHp) * 100.0).toString() + '%';
        if(hp == 0) await setCreature(element, false);
        refreshHpPercentage(element);
    }
}
function rollDie(dieSize) {
    return Math.floor(Math.random() * dieSize) + 1;
}
function askForInitiative(element, mod) {
    let acceptedResult = null;
    while(!acceptedResult) {
        let roll = rollDie(20);
        let msg = '';
        let total = roll;
        if(roll == 1)
            msg = 'nat 1';
        else if(roll == 20)
            msg = 'nat 20!';
        else {
            if(mod != 0) {
                let symbol = mod > 0 ? '+' : '-';
                msg = roll.toString() + ' '+symbol+' ' + Math.abs(mod).toString() + ' = ' + Math.max((roll + mod), 1).toString();
                total = Math.max(roll + mod, 1);
            } else
                msg = roll.toString();
        }
        if(confirm(msg + '?') == true) acceptedResult = total;
    }
    element.innerHTML = acceptedResult.toString();
    sortEncounterTable(element);
}
function addSavingThrowField(title, value, modifier) {
    return `<div class="ability-${title.toLowerCase()}">
        <h3 style="font-weight: bold;" oncontextmenu="makeSavingThrow('${title}', '${modifier}');" onclick="makeSavingThrow('${title}', '${modifier}'); ">${title}</h3>
        <p>${value} (${modifier})</p>
    </div>`;
}
function getThrowFromString(str) {
    return str.replaceAll(/(\r\n|\n|\r)/gm, "").split('(')[1].split(')')[0].replaceAll('+','').trim();
}
async function loadLocations() {
    Array.from(document.getElementsByClassName('location')).forEach(async (element) => {
        const locationSlug = getUrlParameter('name');
        if(!locationSlug) return;
        const locationData = await getJson(`locations/${locationSlug}`);
        console.log(locationData);
        html = `<div id="${locationSlug}" class="location">
            <span style="color: white">${await enrichText(locationData.description, { fontColor: specialTextColor })}</span>
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
async function loadSpells() {
    Array.from(document.getElementsByClassName('spell')).forEach(async (element) => {
        let spellSearched = element.id.toString().split('_spell')[0].replace('_', ' ');
        if(spellSearched == 'spell')
            spellSearched = getUrlParameter('name');
        else
            return;
        const spellInfo = await getJson(`spells/${spellSearched}`);
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
            ${await enrichText(spellInfo.description, { fontColor: iconColor, addSpellUrls: false })}
            <hr>
            <a href="/wikis/spells" class="wiki-page-link">< Spells</a>
        </div>`;
    });
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
async function getAllCreatures() {
    let creatures = [];
    /*for (const [key, value] of window.monsterList) creatures.push(key);
    window.players.forEach((player) => {
        creatures.push(toSlug(player));
    });*/
    return creatures;
}
async function loadSearchBoxes() {
    let creatures = await getAllCreatures();
    await fetchMapIfNotSet('colors');
    Array.from(document.querySelectorAll('.turnToSearchBox')).forEach((element) => {
        element.outerHTML = `
        <div id="searchfield">
            <form>    
                <input id="search" role="combobox" type="text" class="biginput" autocomplete="off" aria-owns="res" 
                    aria-autocomplete="both" placeholder="Search" style="background: ${window.colors.get('medium jungle green')}; color: ${window.colors.get('gainsboro')};">
            </form>
        </div>
        <div id="search-autocomplete" class="autocomplete-suggestions"></div>`;
        $("#search").on("input", function(event) {
            this.value = capitalizeFirstLetters(this.value);
            doSearch(creatures);
        });
    });
}
function doSearch(list) {
    let ids = [];
    list.forEach((item) => {
        ids.push(capitalizeFirstLetters(item.replaceAll('_', ' ')));
    });
    var searchElement = document.getElementById("search");
    var query = searchElement.value;
    searchElement.removeAttribute("aria-activedescendant");
    if (searchElement.value.length >= 1) {
        var results = $.grep(ids, function(item) {
            return item.search(RegExp("^" + query, "i")) != -1;
        });
        if (results.length >= 1) {
            $("#res").remove();
            $('#announce').empty();
            $(".autocomplete-suggestions").show();
            $(".autocomplete-suggestions").append('<div id="res" role="listbox" tabindex="-1"></div>');
            counter = 1;
        }
        for (term in results)
            if (counter <= 5) {
                $("#res").append("<div role='option' tabindex='-1' class='autocomplete-suggestion' id='suggestion-" + counter + "' onclick='addCreature(this);'>" + results[term] + "</div>");
                counter = counter + 1;
            }
        var number = $("#res").children('[role="option"]').length;
        if (number >= 1) $("#announce").text(+number + " suggestions found" + ", to navigate use up and down arrows");
    } else {
        $("#res").remove();
        $('#announce').empty();
        $(".autocomplete-suggestions").hide();
    }
    $("#res").on("click", "div", function() {
        $("#search").val($(this).text());
        $("#res").remove();
        $('#announce').empty();
        $(".autocomplete-suggestions").hide();
        counter = 1;
    });
}
function isPlayer(creatureSlug) {
    return window.players.includes(creatureSlug);
}
async function addCreature(element) {
    let creatureName = element.innerHTML;
    element.innerHTML = '';
    Array.from(document.querySelectorAll(`#sortable_table`)).forEach(async (table) => {
        let existingCreaturesOfThisType = 1;
        Array.from(table.rows).forEach((row) => {
            if(row.rowIndex > 1 && Array.from(row.cells).length > 0) {
                if(row.cells[0].id.split('initiative__')[1].trim().split('_')[0].trim() == creatureName)
                    existingCreaturesOfThisType++;
            }
        });
        let newRow = table.insertRow(table.rows.length);
        let creatureType = isPlayer(creatureName) ? 'pc' : 'hostile';
        let encounterRowType = creatureType == 'pc' ? 'pcEncounterRow' : 'hostileEncounterRow';
        newRow.outerHTML = await dataToHtml(creatureName, encounterRowType, existingCreaturesOfThisType, window.creatureStats);
    });
    addTableRightClickControls();
}
function removeCreature(element) {
    if(confirm(`Delete ${removeLineBreaks(element.parentNode.children[2].children[0].innerHTML.replaceAll('\t', ''))}?`))
        element.parentNode.remove();
}
async function loadEncounterTables() {
    Array.from(document.querySelectorAll('.turnToEncounterTable')).forEach(async (element) => {
        let encounterCreaturesTxt = '';
        let creatures = '';
        let pcs = '';
        let allCreatures = [];
        let names = [];
        let numbers = []
        await fetchMapIfNotSet('colors');
        let rowBgColor = window.colors.get('medium jungle green');
        let colBgColor = window.colors.get('gainsboro');
        let new_html = `
        <div>
            <span id="sort_status" aria-live="polite"></span>
            <table id="sortable_table" >
            <thead>
                <tr id="origin_row" style="display: none;">
                    <th>${element.outerHTML}</th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th>
                </tr>
                <tr style="background: ${rowBgColor}">
                    <th scope="col" id="th_a" aria-sort="ascending" data-name="Initiative" style="color: ${colBgColor};">
                        <span id="sp_a"> 
                            <b>!</b>
                        </span>
                    </th>
                    <th id="th_b" scope="col" class="long" aria-sort="none"><span id="sp_b" style="color: ${colBgColor};">AC</span></th>
                    <th id="th_c" scope="col" class="long" aria-sort="none"><span id="sp_c" style="color: ${colBgColor};">Creature</span></th>
                    <th id="th_d" scope="col" class="long" aria-sort="none"><span id="sp_d" style="color: ${colBgColor};">#</span></th>
                    <th id="th_e" scope="col" class="long" aria-sort="none"><span id="sp_e" style="color: ${colBgColor};">HP total</span></th>
                    <th id="th_f" scope="col" class="long" aria-sort="none"><span id="sp_f" style="color: ${colBgColor};">HP</span></th>
                    <th id="th_g" scope="col" class="long" aria-sort="none"><span id="sp_g" style="color: ${colBgColor};">Temp</span></th>
                    <th id="th_h" scope="col" class="long" aria-sort="none"><span id="sp_h" style="color: ${colBgColor};">HP%</span></th>
                    <th id="th_i" scope="col" aria-sort="none"><span id="sp_i" style="color: ${colBgColor};">+</span></th>
                    <th id="th_j" scope="col" aria-sort="none"><span id="sp_j" style="color: ${colBgColor};">-</span></th>
                    <th id="th_k" scope="col" aria-sort="none"><span id="sp_k" style="color: ${colBgColor};">Conditions</span></th>
                    <th id="th_l" scope="col" aria-sort="none"><span id="sp_k" style="color: ${colBgColor};">Notes</span></th>
                </tr>
            </thead>
            <tbody>`;
        if(element.innerHTML.toString().trim() !== '') {
            encounterCreaturesTxt = element.innerHTML.split(';')[0].trim();
            pcsTxt = element.innerHTML.split(';')[1].trim();
            creatures = encounterCreaturesTxt.split(',');
            pcs = pcsTxt.split(',');
            creatures.forEach((creature) => { 
                let currentNumber;
                if(names.includes(creature)) {
                    numbers[names.indexOf(creature)]++;
                    currentNumber = numbers[names.indexOf(creature)];
                } else {
                    names.push(creature);
                    numbers.push(1);
                    currentNumber = 1;
                }
                allCreatures.push([creature, 'hostile', currentNumber]); 
            });
            pcs.forEach((creature) => { allCreatures.push([creature, 'pc', 0]); });
            allCreatures.forEach(async (creature) => {
                if(creature[1] == 'pc') {
                    new_html += await dataToHtml(toSlug(creature[0]), 'pcEncounterRow', creature[2], window.creatureStats);
                } else if(creature[1] == 'hostile') {
                    new_html += await dataToHtml(dict[creature[0]], 'hostileEncounterRow', creature[2], window.creatureStats);
                }
            });
        }
        element.outerHTML = new_html + `</tbody></table></div>`;
        addTableRightClickControls();
    });
}
function loadEncounter(creaturesSlug) {
    let table = document.getElementById('sortable_table');
    Array.from(creaturesSlug.split(',')).forEach(async (creatureName) => {
        let numberOfClones = 1;
        if(creatureName.includes('=')) {
            numberOfClones = parseInt(creatureName.split('=')[1].trim());
            creatureName = creatureName.split('=')[0];
        } else
            creatureName = creatureName.trim();
        let existingCreaturesOfThisType = 1;
        Array.from(table.rows).forEach((row) => {
            if(row.rowIndex > 1)
                if(row.cells[0].id.split('initiative__')[1].trim().split('_')[0].trim() == creatureName)
                    existingCreaturesOfThisType++;
        });
        if(creatureName != '') {
            let creatureType = isPlayer(toSlug(creatureName)) ? 'pc' : 'hostile';
            let encounterRowType = creatureType == 'pc' ? 'pcEncounterRow' : 'hostileEncounterRow';
            if(creatureName == 'players')
                window.players.forEach(async (player) => {
                    table.insertRow(table.rows.length);
                    table.insertRow(table.rows.length).outerHTML = await dataToHtml(player, 'pcEncounterRow', 1, window.creatureStats);
                });
            else
                for(let i=0;i<numberOfClones;i++) {
                    let newRow = table.insertRow(table.rows.length);
                    newRow.outerHTML = await dataToHtml(creatureName, encounterRowType, existingCreaturesOfThisType, window.creatureStats);
                    existingCreaturesOfThisType++;
                }
        }
    });
    addTableRightClickControls();
}
function loadCustomAccordions() {
    var acc = document.getElementsByClassName("accordion2");
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.display === "block")
                panel.style.display = "none";
            else
                panel.style.display = "block";
        });
    }
}
function clearTable() {
    let confirmation = confirm('Clear the table?');
    if(confirmation) {
        let table = document.getElementById('sortable_table');
        let oldTitleRow = table.rows[0].outerHTML;
        let oldHiddenRow = table.rows[1].outerHTML;
        $('#sortable_table tr').remove();
        let titleRow = table.insertRow(0);
        titleRow.outerHTML = oldTitleRow;
        let hiddenRow = table.insertRow(1);
        hiddenRow.outerHTML = oldHiddenRow;
    }
}
function loadEncounterLoaders() {
    Array.from(document.querySelectorAll('.encounter_loader')).forEach((loader) => {
        let creaturesSlug = loader.innerHTML.split(';')[0].trim();
        let encounterName = loader.innerHTML.split(';')[1].trim();
        loader.outerHTML = `<a class="encounterLoader" onclick="loadEncounter('${creaturesSlug}')">${encounterName}</a>`;
    });
}
function addTableRightClickControls() {
    document.querySelectorAll(`.table_initiative_cell, .table_total_cell, .table_ac_cell, .table_remaining_cell, .table_temp_cell`).forEach((element) => {
        element.oncontextmenu = function () {
            askForValue(this);refreshHpPercentage(this);return false;
        };
    });
    document.querySelectorAll(`.table_link_cell`).forEach((element) => {
        element.oncontextmenu = function () {
            switchCreatureState(this);return false;
        };
    });
    document.querySelectorAll(`.table_damage_cell`).forEach((element) => {
        element.oncontextmenu = function () {
            damage(this);return false;
        };
    });
    document.querySelectorAll(`.table_remove_cell`).forEach((element) => {
        element.oncontextmenu = function () {
            clearTable();return false;
        };
    });
    document.querySelectorAll(`.table_notes_cell`).forEach((element) => {
        element.oncontextmenu = function () {
            decreaseOrRemoveNote(this);return false;
        };
    });
}
function refreshHpPercentage(element) {
    try {
        let creatureId = element.id.split('__')[1];
        let totalHpElement = document.getElementById('total_hp__' + creatureId);
        let remainingHpElement = document.getElementById('remaining_hp__' + creatureId);
        let remainingPercentageElement = document.getElementById('remaining_percentage__' + creatureId);
        let totalHp = totalHpElement.innerHTML.includes('<span') ? parseFloat(totalHpElement.innerHTML.split('>')[1].split('<')[0].trim()) : parseFloat(totalHpElement.innerHTML.trim());
        let remainingHp = parseFloat(remainingHpElement.innerHTML);
        let hpTooltipText = getHpTooltipText(remainingHp / totalHp * 100.0);
        if(!isNaN(remainingHp / totalHp * 100.0)) {
            remainingPercentageElement.innerHTML = '<span title="' + hpTooltipText + '">' + (remainingHp / totalHp * 100.0).toFixed(2).toString() + '%</span>';
            if((remainingHp / totalHp * 100.0) > 0 && element.classList.contains('inactive_cell'))
                switchCreatureState(element);
        }
    } catch(e) {
        console.warn('error when refreshing hp');
    }
}
async function setCreature(element, state) {
    let creature = element.id.split('__')[1];
    let creatureName = creature.includes('_') ? creature.split('_')[0].trim() : creature.trim();
    let creatureType = element.classList.contains('hostileTag') ? 'hostile' : (element.classList.contains('pcTag') ? 'pc' : 'unknown');
    await fetchMapIfNotSet('colors');
    let new_color = creatureType == 'hostile' ? window.colors.get('bubble gum') : await getColorsForCharacter(creatureName)[0];
    let font_color = creatureType == 'hostile' ? window.colors.get('bulgarian rose') : await getColorsForCharacter(creatureName)[1];
    Array.from(element.parentNode.children).forEach((element) => {
        element.style.background = new_color;
        element.style.color = font_color;
        if(Array.from(element.children).length > 0) element.children[0].style.color = font_color;
        if(!state) element.classList.add('inactive_cell');
        else element.classList.remove('inactive_cell');
    });
}
async function switchCreatureState(element) {
    let creatureType = element.classList.contains('hostileTag') ? 'hostile' : (element.classList.contains('pcTag') ? 'pc' : 'unknown');
    let active = !element.classList.contains('inactive_cell');
    let creatureName = element.id.split('__')[1].trim();
    await fetchMapIfNotSet('colors');
    let new_color = window.colors.get('gainsboro');
    let font_color = window.colors.get('dark jungle green');
    if(!active) {
        if(creatureType == 'hostile') {
            if(window.characters.has(toSlug(element.children[0].innerHTML.trim()))) {
                if(window.characters.get(toSlug(element.children[0].innerHTML.trim())).includes('//')) {
                    new_color = await getColorsForCharacter(toSlug(element.children[0].innerHTML.trim()))[0];
                    font_color = await getColorsForCharacter(toSlug(element.children[0].innerHTML.trim()))[1];
                }
            } else {
                new_color = window.colors.get('bubble gum');
                font_color = window.colors.get('bulgarian rose');
            }
        } else {
            new_color = await getColorsForCharacter(creatureName)[0];
            font_color = await getColorsForCharacter(creatureName)[1];
        }
    }
    Array.from(element.parentNode.children).forEach((element) => {
        element.style.background = new_color;
        element.style.color = font_color;
        if(Array.from(element.children).length > 0) element.children[0].style.color = font_color;
        if(active) element.classList.add('inactive_cell');
        else element.classList.remove('inactive_cell');
    });
}
function loadPageBackgrounds() {
    Array.from(document.getElementsByClassName('page-background')).forEach((element) => {
        element.style.backgroundImage = `url("https://i.pinimg.com/originals/ea/97/ef/ea97ef1a0002ed47e29e3532de801781.jpg")`;
    });
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
let previewTimeout;
let currentPreviewUrl = '';
if (!Element.prototype.matches)
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        if (!document.documentElement.contains(el)) return null;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
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
        const containerRect = container.getBoundingClientRect();
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
function hideLazyPreview() {
    const container = document.getElementById('global-preview-container');
    container.style.display = 'none';
}
function keywordToUrl(txt, color, url, fontSize) {
    if (!url) return color ? `<span style="color:${color}">${txt}</span>` : txt;
    return getImagePreview(url, txt, color, fontSize);
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function positionImagePreviewOnce(preview, mouseX, mouseY) {
    const previewWidth = 800; // Approximate width
    const previewHeight = 800; // Approximate height
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let left = mouseX + 20;
    let top = mouseY + 20;
    if (left + previewWidth > windowWidth)
        left = mouseX - previewWidth - 20;
    if (top + previewHeight > windowHeight)
        top = mouseY - previewHeight - 20;
    preview.style.left = left + 'px';
    preview.style.top = top + 'px';
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
function hideImagePreview(id) {
    const preview = document.getElementById(id);
    if (preview)
        preview.style.display = 'none';
}
function is_numeric(str){
    return /^\d+$/.test(str);
}
function replaceFormulasWithLinks(text, options = {}) {
    return text.replace(/\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/g, (match) => {
        return addDieModalCaller(match, options);
    });
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function capitalizeFirstLetters(string) {
    return string.split(' ').map(word => capitalizeFirstLetter(word)).join(' ');
}
function addDieModalCaller(str, options = {}) {
    const {
        fontColor = 'darkred',
        fontSize = txtSize
    } = options;
    return `<a onclick="toggleModal(this)" style="cursor: pointer; color: ${fontColor}; font-size: ${fontSize};">${str}</a>`;
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
const toggleModal = (element) => {
    if(element && !element.innerHTML.trim().startsWith('<'))
        updateModalText(element.innerHTML);
};
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
function removeLineBreaks(str) {
    return str.replaceAll(/(\r\n|\n|\r)/gm, "");
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
document.addEventListener('mousemove', (event) => {
    if (event.target.closest('.image-preview-link')) {
        window.lastImagePreviewEvent = event;
    }
    window.lastPreviewMouseEvent = event;
});
document.addEventListener("DOMContentLoaded", async function(event) { 
    
});
///////////////////////
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

async function initializeEverything() {
    try {
        document.body.classList.add('loading');
        initLazyPreviews();
        // ... ALL your initialization function calls ...
        try {
        document.body.classList.add('loading');
        initLazyPreviews();
        await Promise.all(
            mapKeys.map(async (key) => {
                window[key] = await getMap(key);
            })
        );
        Array.from(document.getElementsByClassName('text_to_beautify')).forEach(async (element) => {
            element.outerHTML = await enrichText(element.outerHTML, { fontColor: "#FFD700" });
        });
        await loadEncounterTables();
        loadEncounterLoaders();
        loadCustomAccordions();
        loadPageBackgrounds();
        await recolor();
        await fetchFolderDataSequentially();
        await loadStatblocks();
        await loadSpells();
        await loadCharacters();
        await loadEncounters();
        await loadLocations();
        await loadSearchBoxes();
        await loadWikiLists();
        await loadLookers();
        await renameWikisWithNames();
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
    } catch (error) {
        console.error('Failed to initialize: ', error);
    }
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
    } catch (error) {
        console.error('Failed to initialize: ', error);
    }
}

// Check document state and initialize appropriately
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initializeEverything);
} else {
    // Document already loaded, run immediately
    await initializeEverything();
}