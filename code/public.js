const websiteRoot = 'https://blindingdarkness.obsidianportal.com';const mapKeys = ['colorReplacements', 'keywordReplacements'];
//const githubRoot = 'https://raw.githubusercontent.com/luisivanfv/my_dnd_data/main/';
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
});