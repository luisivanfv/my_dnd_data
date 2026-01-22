const supabaseUrl = 'https://dqarsuykgopttxbfnjad.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxYXJzdXlrZ29wdHR4YmZuamFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDE1NDgsImV4cCI6MjA4NDQxNzU0OH0.QK2GKvx9jBcqesC59frTNhKWOi9G7wyHdR1U8raHRbU'; // Get from Supabase dashboard
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

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
let currentTurnCreatureId = null;
let isInitialLoad = true;
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
        await loadSoundBoard();
        await renameWikisWithNames();
        await loadCharacterSheets();
        addSearchBarStyles();
        convertToSearchBar();
        addEncounterTableStyles();
        convertToEncounterTable();
        initLazyPreviews();
        addInventorySortingStyles();
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
};
function getProficiencyBonusForLevel(level) {
    if(level < 5)
        return 2;
    if(level < 0)
        return 3;
    if(level < 13)
        return 4;
    if(level < 17)
        return 5;
    return 6;
}
function getBonusIn(skill, proficiencies) {
    let bonus = 0;
    proficiencies.forEach(proficiency => {
        if(skill == proficiency.skill)
            bonus = proficiency.bonus;
    });
    return bonus;
}
function getMod(ability) {
    return Math.floor((ability -10) / 2);
}
function getArmorClass(dexterity, inventory, itemList) {
    const dexMod = getMod(dexterity);
    let armorClass = 10 + dexMod;
    inventory.forEach(inventoryItem =>  {
        if (inventoryItem.equipped) {
            itemList.forEach(item => {
                if(inventoryItem.itemId === item.id)
                    if(item.wearableIn === 'torso')
                        armorClass = item.armorClass + Math.min(item.maxDexMod, dexMod);
            });
        }
    });
    return armorClass;
}
async function updateCharacterSheet() {
    const characterName = getUrlParameter('name');
    const character = (await queryDatabase('Players', { name: capitalizeFirstLetter(characterName) }, {}))[0];
    const sheet = await generateSheet(character);
    
    // Store the active tab before replacing
    const currentActiveTab = document.querySelector('.tab-button.active')?.dataset.tab || 'general';
    
    document.getElementById('character-sheet-container').innerHTML = '';
    document.getElementById('character-sheet-container').appendChild(sheet);
    
    // Restore the active tab
    const tabButton = document.querySelector(`.tab-button[data-tab="${currentActiveTab}"]`);
    if (tabButton) {
        tabButton.click();
    }
    
    // Setup sort button
    setTimeout(() => {
        setupSortButton(character.id);
    }, 100);
    
    // Re-setup inventory item event listeners
    if (window.inventoryMenu) {
        console.log('Re-setting up inventory events after sheet update');
        setTimeout(() => {
            window.inventoryMenu.setupInventoryItems();
        }, 100);
    }
}
window.updateCharacterSheet = updateCharacterSheet;
window.getUrlParameter = getUrlParameter;
window.capitalizeFirstLetter = capitalizeFirstLetter;
window.queryDatabase = queryDatabase;
async function loadActiveTabToStorage(playerId, tabName) {
    await updateById('Players', playerId, { activeTab: tabName });
}
async function generateSheet(character) {
    const proficiencyBonus = getProficiencyBonusForLevel(character.level)
    const characterSkillProficienciesRows = await queryDatabase(
        'Proficiencies',
        { player_id: character.id, skill_id: { operator: 'gt', value: 0 } },
        { orderBy: { column: 'id', ascending: false }}
    );
    const skills = await queryDatabase('Skills', {}, {});
    const characterSkillProficiencies = [];
    characterSkillProficienciesRows.forEach(async item => {
        skills.forEach(skill => {
            if(item.skill_id === skill.id)
                characterSkillProficiencies.push({ skill: skill.name, bonus: item.isExpertise ? proficiencyBonus * 2 : proficiencyBonus });
        });
    });
    const skillNames = [];
    skills.forEach(skill => {
        skillNames.push(skill.name);
    });
    let acrobaticsBonus = getBonusIn('Acrobacia', characterSkillProficiencies);
    let animalHandlingBonus = getBonusIn('Manejo Animal', characterSkillProficiencies);
    let arcanaBonus = getBonusIn('Arcana', characterSkillProficiencies);
    let athleticsBonus = getBonusIn('Atleticismo', characterSkillProficiencies);
    let deceptionBonus = getBonusIn('Engaño', characterSkillProficiencies);
    let historyBonus = getBonusIn('Historia', characterSkillProficiencies);
    let insightBonus = getBonusIn('Entendimiento', characterSkillProficiencies);
    let intimidationBonus = getBonusIn('Intimidación', characterSkillProficiencies);
    let investigationBonus = getBonusIn('Investigación', characterSkillProficiencies);
    let medicineBonus = getBonusIn('Medicina', characterSkillProficiencies);
    let natureBonus = getBonusIn('Naturaleza', characterSkillProficiencies);
    let perceptionBonus = getBonusIn('Percepción', characterSkillProficiencies);
    let performanceBonus = getBonusIn('Actuación', characterSkillProficiencies);
    let persuasionBonus = getBonusIn('Persuasión', characterSkillProficiencies);
    let religionBonus = getBonusIn('Religión', characterSkillProficiencies);
    let sleightOfHandBonus = getBonusIn('Truco de Manos', characterSkillProficiencies);
    let stealthBonus = getBonusIn('Sigilo', characterSkillProficiencies);
    let survivalBonus = getBonusIn('Supervivencia', characterSkillProficiencies);
    const acrobaticProficiency = acrobaticsBonus > 0;
    const animalHandlingProficiency = animalHandlingBonus > 0;
    const arcanaProficiency = arcanaBonus > 0;
    const athleticsProficiency = athleticsBonus > 0;
    const deceptionProficiency = deceptionBonus > 0;
    const historyProficiency = historyBonus > 0;
    const insightProficiency = insightBonus > 0;
    const intimidationProficiency = intimidationBonus > 0;
    const investigationProficiency = investigationBonus > 0;
    const medicineProficiency = medicineBonus > 0;
    const natureProficiency = natureBonus > 0;
    const perceptionProficiency = perceptionBonus > 0;
    const performanceProficiency = performanceBonus > 0;
    const persuasionProficiency = persuasionBonus > 0;
    const religionProficiency = religionBonus > 0;
    const sleightOfHandProficiency = sleightOfHandBonus > 0;
    const stealthProficiency = stealthBonus > 0;
    const survivalProficiency = survivalBonus > 0;
    const strProficiencyBonus = character.strProficiency ? proficiencyBonus : 0;
    const dexProficiencyBonus = character.dexProficiency ? proficiencyBonus : 0;
    const conProficiencyBonus = character.conProficiency ? proficiencyBonus : 0;
    const intProficiencyBonus = character.intProficiency ? proficiencyBonus : 0;
    const wisProficiencyBonus = character.wisProficiency ? proficiencyBonus : 0;
    const chaProficiencyBonus = character.chaProficiency ? proficiencyBonus : 0;
    acrobaticsBonus += getMod(character.dex);
    animalHandlingBonus += getMod(character.wis);
    arcanaBonus += getMod(character.int);
    athleticsBonus += getMod(character.str);
    deceptionBonus += getMod(character.cha);
    historyBonus += getMod(character.int);
    insightBonus += getMod(character.wis);
    intimidationBonus += getMod(character.cha);
    investigationBonus += getMod(character.int);
    medicineBonus += getMod(character.wis);
    natureBonus += getMod(character.int);
    perceptionBonus += getMod(character.wis);
    performanceBonus += getMod(character.cha);
    persuasionBonus += getMod(character.cha);
    religionBonus += getMod(character.int);
    sleightOfHandBonus += getMod(character.dex);
    stealthBonus += getMod(character.dex);
    survivalBonus += getMod(character.wis);
    const characterInventory = await queryDatabase('Inventories', { playerId: character.id}, {});
    window.inventory = characterInventory;
    const itemList = await queryDatabase('Items', {}, {});
    const itemTypes = await queryDatabase('ItemTypes', {}, {});
    const actions = await queryDatabase('Actions', {}, {});
    const inventory = [];
    characterInventory.forEach(inventoryItem => {
        itemList.forEach(item => {
            if(inventoryItem.itemId == item.id) {
                const itemToPush = {
                    ...item,
                    quantity: inventoryItem.quantity,
                    equipped: inventoryItem.equipped
                };
                itemTypes.forEach(itemType => {
                    if(item.itemTypeId == itemType.id) {
                        itemToPush['iconUrl'] = itemType.icon.split('??')[0];
                        itemToPush['iconAlt'] = itemType.icon.split('??')[1];
                        itemToPush['itemType'] = itemType.description;
                        itemToPush['modifierUsed'] = itemType.modifierUsed;
                    }
                });
                const itemActions = [];
                actions.forEach(action => {
                    if(action.requiredItemId == item.id) {
                        itemActions.push({
                            name: action.name,
                            description: action.description,
                            costsAction: action.costsAction,
                            costsBonusAction: action.costsBonusAction,
                            costsReaction: action.costsReaction,
                            costsMovement: action.movement,
                            damageCalculation: action.damageCalculation,
                            damageType: action.damageType
                        });
                    }
                });
                itemToPush['actions'] = itemActions;
                inventory.push(itemToPush);
            }
        });
    });
    console.warn('Initial inventory:');
    console.log(inventory);
    console.warn('--------------------');
    return createCharacterSheet({
        id: character.id,
        allItems: itemList,
        inventory: inventory,
        activeTab: character.activeTab,
        name: character.name,
        race: character.race,
        class: character.class,
        level: character.level,
        background: '',
        alignment: 'Neutral',
        experience: 0,
        gold: character.gold,
        // Ability scores
        strength: character.str,
        dexterity: character.dex,
        constitution: character.con,
        intelligence: character.int,
        wisdom: character.wis,
        charisma: character.cha,
        // Saving throws
        strSavingThrows: getMod(character.str) + strProficiencyBonus,
        dexSavingThrows: getMod(character.dex) + dexProficiencyBonus,
        conSavingThrows: getMod(character.con) + conProficiencyBonus,
        intSavingThrows: getMod(character.int) + intProficiencyBonus,
        wisSavingThrows: getMod(character.wis) + wisProficiencyBonus,
        chaSavingThrows: getMod(character.cha) + chaProficiencyBonus,
        strProficiency: strProficiencyBonus > 0,
        dexProficiency: dexProficiencyBonus > 0,
        conProficiency: conProficiencyBonus > 0,
        intProficiency: intProficiencyBonus > 0,
        wisProficiency: wisProficiencyBonus > 0,
        chaProficiency: chaProficiencyBonus > 0,
        proficiencyBonus: getProficiencyBonusForLevel(character.level),
        // Colors
        color: character.color,
        secondaryColor: character.secondaryColor,
        textColor: character.textColor,
        secondaryTextColor: character.secondaryTextColor,
        darkColor: character.darkColor,
        // Skills with proficiency
        skills: {
            acrobatics: { value: acrobaticsBonus, proficient: acrobaticProficiency },
            animalHandling: { value: animalHandlingBonus, proficient: animalHandlingProficiency },
            arcana: { value: arcanaBonus, proficient: arcanaProficiency },
            athletics: { value: athleticsBonus, proficient: athleticsProficiency },
            deception: { value: deceptionBonus, proficient: deceptionProficiency },
            history: { value: historyBonus, proficient: historyProficiency },
            insight: { value: insightBonus, proficient: insightProficiency },
            intimidation: { value: intimidationBonus, proficient: intimidationProficiency },
            investigation: { value: investigationBonus, proficient: investigationProficiency },
            medicine: { value: medicineBonus, proficient: medicineProficiency },
            nature: { value: natureBonus, proficient: natureProficiency },
            perception: { value: perceptionBonus, proficient: perceptionProficiency },
            performance: { value: performanceBonus, proficient: performanceProficiency },
            persuasion: { value: persuasionBonus, proficient: persuasionProficiency },
            religion: { value: religionBonus, proficient: religionProficiency },
            sleightOfHand: { value: sleightOfHandBonus, proficient: sleightOfHandProficiency },
            stealth: { value: stealthBonus, proficient: stealthProficiency },
            survival: { value: survivalBonus, proficient: survivalProficiency }
        },
        
        // Combat stats
        maxHP: character.maxHp,
        currentHP: character.hp,
        tempHP: 0,
        armorClass: getArmorClass(character.dex, characterInventory, itemList),
        initiative: getMod(character.dex),
        speed: character.speed,
        
        // Features & abilities
        features: [],
        spells: [],
        
        // Notes
        notes: '',
        backstory: '',
        
        // Appearance
        appearance: '',
        personality: '',
        ideals: '',
        bonds: '',
        flaws: ''
    });
}
async function loadCharacterSheets() {
    const characterSheetContainer = document.getElementById('character-sheet-container');
    if (!characterSheetContainer)
        return;
    const characterName = getUrlParameter('name');
    const character = (await queryDatabase('Players', { name: capitalizeFirstLetter(characterName) }, {}))[0];
    const sheet = await generateSheet(character);
    characterSheetContainer.innerHTML = '';
    characterSheetContainer.appendChild(sheet);
    document.getElementsByClassName('character-header')[0].style.background = character.color;
    document.getElementsByClassName('tabs')[0].style.background = character.secondaryColor;
    document.getElementsByClassName('tab-content-container')[0].style.background = character.secondaryColor;
    
    // Setup inventory item event listeners
    if (window.inventoryMenu) {
        console.log('Setting up inventory events after sheet load');
        
        // Wait for DOM to be fully rendered
        setTimeout(() => {
            window.inventoryMenu.setupInventoryItems();
            
            // Test that events are working
            setTimeout(() => {
                console.log('Testing inventory events...');
                const items = document.querySelectorAll('.inventory-item');
                console.log(`Inventory items ready: ${items.length}`);
            }, 200);
        }, 100);
    }
}
async function updateById(table, id, updates) {
    try {
        // Use the already initialized supabaseClient
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            throw new Error('Supabase client not initialized');
        }
        
        const { data, error } = await window.supabaseClient
            .from(table)
            .update(updates)
            .eq('id', id)
            .select();
        
        if (error) {
            console.error(`Supabase error updating ${table}:`, error);
            throw error;
        }
        
        console.log(`Successfully updated ${table} id ${id}:`, data);
        return data?.[0] || null;
        
    } catch (error) {
        console.error(`Error updating ${table} id ${id}:`, error);
        throw error;
    }
}
function getDisplayNameForDamageType(damageType, uppercase) {
    if(damageType == 'acid')
        return uppercase ? 'Ácido' : 'ácido';
    if(damageType == 'bludgeoning')
        return uppercase ? 'Aplastante' : 'aplastante';
    if(damageType == 'cold')
        return uppercase ? 'Frío' : 'frío';
    if(damageType == 'fire')
        return uppercase ? 'de Fuego' : 'de fuego';
    if(damageType == 'force')
        return uppercase ? 'de Fuerza' : 'de fuerza';
    if(damageType == 'lightning')
        return uppercase ? 'Eléctrico' : 'eléctrico';
    if(damageType == 'necrotic')
        return uppercase ? 'Necrótico' : 'necrótico';
    if(damageType == 'piercing')
        return uppercase ? 'Punzante' : 'punzante';
    if(damageType == 'poison')
        return uppercase ? 'de Veneno' : 'de veneno';
    if(damageType == 'psychic')
        return uppercase ? 'Psíquico' : 'psíquico';
    if(damageType == 'radiant')
        return uppercase ? 'Radiante' : 'radiante';
    if(damageType == 'slashing')
        return uppercase ? 'Cortante' : 'cortante';
    if(damageType == 'thunder')
        return uppercase ? 'de Trueno' : 'de trueno';
    return damageType;
}
function createMenu(thisOutside, activeItem) {
    thisOutside.menuElement = document.createElement('div');
    thisOutside.menuElement.className = 'inventory-item-menu';
    const backgroundColor = window.character ? window.character.color : 'lightgrey';
    const textColor = window.character ? window.character.textColor : 'black';
    thisOutside.menuElement.style.cssText = `
        position: fixed;
        background: ${backgroundColor};
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        display: none;
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 0.3s ease, transform 0.3s ease;
        min-width: 250px;
        overflow: hidden;
    `;
    console.warn(thisOutside.menuElement.style.cssText);
    
    // Menu header
    /*const menuHeader = document.createElement('div');
    menuHeader.className = 'menu-header';
    menuHeader.style.cssText = `
        padding: 16px;
        border-bottom: 1px solid #eee;
        font-weight: 600;
        color: #333;
        text-align: center;
    `;
    menuHeader.textContent = 'Item Actions';
    thisOutside.menuElement.appendChild(menuHeader);*/
    
    // Menu items container
    const menuItems = document.createElement('div');
    menuItems.className = 'menu-items';
    menuItems.style.cssText = `
        max-height: 300px;
        overflow-y: auto;
    `;
    
    // Menu items
    const menuOptions = [];
    if (activeItem) {
        if(activeItem.actions.length > 0)
            menuOptions.push({ id: 'use', text: 'Usar', icon: '', color: '' });
        if(activeItem.equippable)
            menuOptions.push({ id: 'equip', text: 'Equipar', icon: '', color: '' });
    } else {
        menuOptions.push({ id: 'use', text: 'Usar', icon: '', color: '' });
        menuOptions.push({ id: 'equip', text: 'Equipar', icon: '', color: '' });
    }
    menuOptions.push({ id: 'info', text: 'Información', icon: '', color: '' });
    menuOptions.push({ id: 'delete', text: 'Eliminar', icon: '', color: '' });
    menuOptions.forEach(option => {
        const menuItem = document.createElement('button');
        menuItem.className = 'menu-item';
        menuItem.dataset.action = option.id;
        menuItem.style.cssText = `
            display: flex;
            align-items: center;
            width: 100%;
            padding: 16px;
            border: none;
            background: transparent;
            text-align: left;
            font-size: 16px;
            color: ${textColor};
            transition: background-color 0.2s;
            border-bottom: 1px solid #f5f5f5;
        `;
        
        menuItem.innerHTML = `
            <span class="menu-item-icon" style="font-size: 20px; margin-right: 12px; color: ${option.color}">
                ${option.icon}
            </span>
            <span class="menu-item-text">${option.text}</span>
        `;
        
        menuItem.addEventListener('click', () => thisOutside.handleMenuAction(option.id));
        menuItems.appendChild(menuItem);
    });
    
    thisOutside.menuElement.appendChild(menuItems);
}
async function setCharacterToWindow() {
    console.log('Starting character setting');
    const characterSheetContainer = document.getElementById('character-sheet-container');
    if (!characterSheetContainer)
        return;
    if(getUrlParameter('name') )
        window.character = await queryDatabase('Players', { name: capitalizeFirstLetter(getUrlParameter('name')) })[0];
    console.log('Ending character setting');
}
async function getCurrentCharacter() {
    const characterSheetContainer = document.getElementById('character-sheet-container');
    if (!characterSheetContainer)
        return;
    if(getUrlParameter('name') ) {
        console.log('getCurrentCharacter...');
        return await queryDatabase('Players', { name: capitalizeFirstLetter(getUrlParameter('name')) })[0];
    }
}
async function sortInventory(inventory, sortingStyle = 'default') {
    console.log('Sorting inventory with style:', sortingStyle);
    console.log('Inventory items:', inventory);
    
    // Check if inventory is valid
    if (!inventory || !Array.isArray(inventory)) {
        console.error('Invalid inventory:', inventory);
        return [];
    }
    
    // Filter out any invalid items
    const validInventory = inventory.filter(item => {
        if (!item) return false;
        if (!item.name) {
            console.warn('Item missing name property:', item);
            return false;
        }
        return true;
    });
    
    console.log('Valid items:', validInventory.length, 'out of', inventory.length);
    
    // Fetch necessary data for sorting
    const itemTypes = await queryDatabase('ItemTypes', {}, {});
    const itemCategories = await queryDatabase('ItemCategories', {}, {});
    
    // Create lookup maps for quick access
    const itemTypeMap = new Map();
    itemTypes.forEach(type => {
        itemTypeMap.set(type.id, type);
    });
    
    const categoryMap = new Map();
    itemCategories.forEach(category => {
        categoryMap.set(category.id, {
            priority: category.priority,
            displayName: category.displayName
        });
    });
    console.warn('itemTypeMap');
    console.warn(itemTypeMap);
    console.warn('categoryMap');
    console.warn(categoryMap);
    
    // Helper to get category priority for an item
    const getCategoryPriority = (item) => {
        if (!item || !item.itemTypeId) return 999;
        const itemType = itemTypeMap.get(item.itemTypeId);
        if (!itemType) return 999;
        const category = categoryMap.get(itemType.categoryId);
        return category ? category.priority : 999;
    };
    
    // Helper to get category display name for an item
    const getCategoryDisplayName = (item) => {
        console.log('>>>>>>>>>>>>');
        console.log('item');
        console.log(item);
        if (!item || !item.itemTypeId) return 'Other';
        const itemType = itemTypeMap.get(item.itemTypeId);
        console.log('itemType');
        console.log(itemType);
        if (!itemType) return 'Other';
        const category = categoryMap.get(itemType.categoryId);
        console.log('category');
        console.log(category);
        console.log('>>>>>>>>>>>>');
        return category ? category.displayName : 'Other';
    };
    
    // Sort based on the selected style
    switch(sortingStyle) {
        case 'price':
            return validInventory.sort((a, b) => {
                // Ensure we have valid items
                if (!a || !b) return 0;
                
                // Handle items without price (sort to bottom)
                const priceA = (a.avgPrice !== null && a.avgPrice !== undefined) ? a.avgPrice : Infinity;
                const priceB = (b.avgPrice !== null && b.avgPrice !== undefined) ? b.avgPrice : Infinity;
                
                // If both have no price, sort by name
                if (priceA === Infinity && priceB === Infinity) {
                    return (a.name || '').localeCompare(b.name || '');
                }
                
                // If only one has no price, it goes to bottom
                if (priceA === Infinity) return 1;
                if (priceB === Infinity) return -1;
                
                // Sort by price, then by name
                if (priceA !== priceB) {
                    return priceA - priceB;
                }
                return (a.name || '').localeCompare(b.name || '');
            });
            
        case 'weight':
            return validInventory.sort((a, b) => {
                // Ensure we have valid items
                if (!a || !b) return 0;
                
                // Handle items without weight (sort to bottom)
                const weightA = (a.weight !== null && a.weight !== undefined) ? a.weight : Infinity;
                const weightB = (b.weight !== null && b.weight !== undefined) ? b.weight : Infinity;
                
                // If both have no weight, sort by name
                if (weightA === Infinity && weightB === Infinity) {
                    return (a.name || '').localeCompare(b.name || '');
                }
                
                // If only one has no weight, it goes to bottom
                if (weightA === Infinity) return 1;
                if (weightB === Infinity) return -1;
                
                // Sort by weight, then by name
                if (weightA !== weightB) {
                    return weightA - weightB;
                }
                return (a.name || '').localeCompare(b.name || '');
            });
            
        case 'default':
        default:
            // Group items by category first
            const groupedByCategory = {};
            validInventory.forEach(item => {
                if (!item) return;
                const categoryName = getCategoryDisplayName(item);
                if (!groupedByCategory[categoryName]) {
                    groupedByCategory[categoryName] = [];
                }
                groupedByCategory[categoryName].push(item);
            });
            
            console.log('Grouped by category:', groupedByCategory);
            
            // Get unique categories with their priorities
            const categories = Object.keys(groupedByCategory).map(categoryName => ({
                name: categoryName,
                priority: Math.min(...groupedByCategory[categoryName].map(item => getCategoryPriority(item)))
            }));
            
            // Sort categories by priority
            categories.sort((a, b) => a.priority - b.priority);
            
            console.log('Sorted categories:', categories);
            
            // Sort items within each category and flatten
            const sortedInventory = [];
            categories.forEach(category => {
                const categoryItems = groupedByCategory[category.name];
                console.log(`Sorting category "${category.name}" with items:`, categoryItems);
                
                // Sort within category: equipped first, then by name
                categoryItems.sort((a, b) => {
                    // Ensure we have valid items
                    if (!a || !b) return 0;
                    
                    // First by equipped status (equipped comes first)
                    const equippedA = Boolean(a.equipped);
                    const equippedB = Boolean(b.equipped);
                    if (equippedA !== equippedB) {
                        return equippedA ? -1 : 1;
                    }
                    // Then by name
                    return (a.name || '').localeCompare(b.name || '');
                });
                
                console.log(`Sorted items for "${category.name}":`, categoryItems);
                // Add to final array
                sortedInventory.push(...categoryItems);
            });
            
            console.log('Final sorted inventory:', sortedInventory);
            return sortedInventory;
    }
}
class InventoryItemMenu {
    constructor() {
        this.activeItem = null;
        this.menuElement = null;
        this.backdrop = null;
        this.touchTimer = null;
        this.touchStartPosition = null;
        this.isMenuVisible = false;
        
        this.init();
    }
    
    init() {
        this.createMenuElements();
        this.bindEvents();
        this.addMutationObserver(); // Add this line
        
        // Also set up events immediately
        setTimeout(() => {
            this.setupInventoryItems();
        }, 500);
    }

    addMutationObserver() {
        // Stop existing observer
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // Watch for changes to the character sheet container
        const sheetContainer = document.getElementById('character-sheet-container');
        if (!sheetContainer) return;
        
        this.mutationObserver = new MutationObserver((mutations) => {
            let shouldReattach = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // Check if inventory items were added/removed
                    const addedNodes = Array.from(mutation.addedNodes);
                    for (const node of addedNodes) {
                        if (node.nodeType === 1 && 
                            (node.classList.contains('inventory-item') || 
                            node.querySelector('.inventory-item'))) {
                            shouldReattach = true;
                            break;
                        }
                    }
                }
            }
            
            if (shouldReattach) {
                console.log('DOM changed, re-attaching inventory events');
                setTimeout(() => {
                    this.setupInventoryItems();
                }, 50);
            }
        });
        
        // Start observing
        this.mutationObserver.observe(sheetContainer, {
            childList: true,
            subtree: true
        });
        
        console.log('Mutation observer started');
    }
    
    createMenuElements() {
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'menu-backdrop';
        this.backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Create menu
        createMenu(this, null);
        
        // Add to DOM
        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.menuElement);
        
        // Add CSS for touch feedback
        this.addStyles();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .menu-item:active {
                background-color: #f8f9fa;
            }
            
            .menu-item:last-child {
                border-bottom: none;
            }
            
            /* Touch feedback for inventory items */
            .inventory-item:active {
                background-color: #f0f0f0;
                transition: background-color 0.1s;
            }
            
            .inventory-item.long-press-active {
                transform: scale(0.98);
                transition: all 0.2s;
            }
            
            /* Modal styles */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .modal-overlay.active {
                opacity: 1;
            }
            
            .modal-content {
                background: white;
                border-radius: 16px;
                max-width: 400px;
                width: 100%;
                max-height: 80vh;
                overflow: hidden;
                transform: translateY(20px);
                transition: transform 0.3s;
            }
            
            .modal-overlay.active .modal-content {
                transform: translateY(0);
            }
            
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                font-weight: 600;
                font-size: 18px;
                color: #333;
            }
            
            .modal-body {
                padding: 20px;
                color: #666;
                line-height: 1.6;
                max-height: 50vh;
                overflow-y: auto;
            }
            
            .modal-footer {
                padding: 20px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            .modal-button {
                padding: 10px 20px;
                border-radius: 8px;
                border: none;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .modal-button.primary {
                background: #3498db;
                color: white;
            }
            
            .modal-button.primary:active {
                background: #2980b9;
            }
            
            .modal-button.secondary {
                background: #f8f9fa;
                color: #666;
            }
            
            .modal-button.secondary:active {
                background: #e9ecef;
            }
            
            /* Use modal specific */
            .use-option {
                padding: 15px;
                border: 1px solid #eee;
                border-radius: 8px;
                margin-bottom: 10px;
                background: #f8f9fa;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .use-option:active {
                background: #e9ecef;
                transform: translateY(2px);
            }
            
            .use-option-title {
                font-weight: 600;
                margin-bottom: 5px;
                color: #333;
            }
            
            .use-option-description {
                font-size: 14px;
                color: #666;
            }
            
            /* Delete confirmation */
            .delete-icon {
                font-size: 48px;
                text-align: center;
                margin: 20px 0;
                color: #e74c3c;
            }
            
            .delete-warning {
                text-align: center;
                color: #e74c3c;
                font-weight: 500;
                margin: 10px 0;
            }
            
            /* Responsive */
            @media (max-width: 480px) {
                .inventory-item-menu {
                    min-width: 200px;
                    max-width: 90vw;
                }
                
                .modal-content {
                    max-width: 90vw;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    bindEvents() {
        // Close menu when clicking backdrop
        this.backdrop.addEventListener('click', () => this.hideMenu());
        
        // Close menu with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuVisible) {
                this.hideMenu();
            }
        });
        
        // Bind to inventory items (delegated)
        document.addEventListener('DOMContentLoaded', () => {
            this.setupInventoryItems();
        });
    }
    
    setupInventoryItems() {
        console.log('Setting up inventory item event listeners...');
        
        // Use a single event listener on the character sheet container
        // This will survive DOM replacements
        const sheetContainer = document.getElementById('character-sheet-container');
        if (!sheetContainer) {
            console.log('Character sheet container not found');
            return;
        }
        
        // Remove existing listeners if any
        sheetContainer.removeEventListener('click', this.handleSheetClick);
        sheetContainer.removeEventListener('touchstart', this.handleSheetTouchStart);
        sheetContainer.removeEventListener('touchend', this.handleSheetTouchEnd);
        sheetContainer.removeEventListener('touchend', this.handleSheetMouseDown);
        sheetContainer.removeEventListener('touchend', this.handleSheetMouseUp);
        
        // Create bound handlers
        this.handleSheetClick = this.handleSheetClick.bind(this);
        this.handleSheetTouchStart = this.handleSheetTouchStart.bind(this);
        this.handleSheetTouchEnd = this.handleSheetTouchEnd.bind(this);
        this.handleSheetMouseDown = this.handleSheetMouseDown.bind(this);
        this.handleSheetMouseUp = this.handleSheetMouseUp.bind(this);
        
        // Add new listeners
        sheetContainer.addEventListener('click', this.handleSheetClick);
        sheetContainer.addEventListener('touchstart', this.handleSheetTouchStart, { passive: false });
        sheetContainer.addEventListener('touchend', this.handleSheetTouchEnd);
        sheetContainer.addEventListener('onmousedown', this.handleSheetMouseDown);
        sheetContainer.addEventListener('onmouseup', this.handleSheetMouseUp);
        
        console.log('Event listeners attached to sheet container');
    }

    handleSheetClick(e) {
        const itemElement = e.target.closest('.inventory-item');
        if (itemElement) {
            console.log('Inventory item clicked via delegation');
            this.handleClick(e, itemElement);
        }
    }

    handleSheetTouchStart(e) {
        const itemElement = e.target.closest('.inventory-item');
        if (itemElement) {
            console.log('Inventory item touch start via delegation');
            this.handleTouchStart(e, itemElement);
        }
    }

    handleSheetMouseDown(e) {
        const itemElement = e.target.closest('.inventory-item');
        if (itemElement) {
            console.log('Inventory item touch start via delegation');
            this.handleClickStart(e, itemElement);
        }
    }

    handleSheetTouchEnd(e) {
        const itemElement = e.target.closest('.inventory-item');
        if (itemElement) {
            console.log('Inventory item touch end via delegation');
            this.handleTouchEnd(e, itemElement);
        }
    }

    handleSheetMouseUp(e) {
        const itemElement = e.target.closest('.inventory-item');
        if (itemElement) {
            console.log('Inventory item touch end via delegation');
            this.handleMouseUp(e, itemElement);
        }
    }
    updateMenuOptions(itemData) {
        // Get the menu items container
        const menuItems = this.menuElement.querySelector('.menu-items');
        if (!menuItems) return;
        
        // Clear existing options
        menuItems.innerHTML = '';
        
        // Create new options based on item
        const menuOptions = [];
        if (itemData && itemData.actions && itemData.actions.length > 0) {
            menuOptions.push({ id: 'use', text: 'Usar', icon: '', color: '' });
        }
        if (itemData && itemData.equipable) {
            menuOptions.push({ id: 'equip', text: 'Equipar', icon: '', color: '' });
        }
        menuOptions.push({ id: 'info', text: 'Información', icon: '', color: '' });
        menuOptions.push({ id: 'delete', text: 'Eliminar', icon: '', color: '' });
        
        // Add options to menu
        menuOptions.forEach(option => {
            const menuItem = document.createElement('button');
            menuItem.className = 'menu-item';
            menuItem.dataset.action = option.id;
            menuItem.style.cssText = `
                display: flex;
                align-items: center;
                width: 100%;
                padding: 16px;
                border: none;
                background: transparent;
                text-align: left;
                font-size: 16px;
                color: #333;
                transition: background-color 0.2s;
                border-bottom: 1px solid #f5f5f5;
            `;
            
            menuItem.innerHTML = `
                <span class="menu-item-icon" style="font-size: 20px; margin-right: 12px; color: ${option.color}">
                    ${option.icon}
                </span>
                <span class="menu-item-text">${option.text}</span>
            `;
            
            menuItem.addEventListener('click', async () => await this.handleMenuAction(option.id));
            menuItems.appendChild(menuItem);
        });
    }
    handleDoubleTap(e, itemElement) {
        const itemData = this.getItemData(itemElement);
        //this.toggleEquip(itemData);
        this.activeItem = itemData;
        console.log('Item data SET for double tap:', itemData);
        this.updateMenuOptions(itemData);
        this.showMenu(e);
    }
    handleClick(e, itemElement) {
        const currentTime = new Date().getTime();
        this.activeItem = {
            element: itemElement,
            data: this.getItemData(itemElement)
        };
        
        // For desktop, check for double click
        const clickLength = currentTime - this.lastTapTime;
        if (clickLength < 300 && clickLength > 0) {
            this.handleDoubleTap(e, itemElement);
        }
        this.lastTapTime = currentTime;
    }
    handleClickStart(e, itemElement) {
        if (!itemElement) {
            console.log('No inventory item found');
            return;
        }
        e.preventDefault();
        this.touchStartPosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        
        this.activeItem = {
            element: itemElement,
            data: this.getItemData(itemElement)
        };
        // Add visual feedback
        itemElement.classList.add('long-press-active');
        
        console.log('Added long-press-active class');
        // Start timer for long press
        this.touchTimer = setTimeout(() => {
            this.showMenu(e.touches[0]);
        }, 500); // 500ms for long press
    
        console.log('Touch start handler completed');
    }
    handleTouchStart(e, itemElement) {
        console.log('Touch start event triggered');
        console.log('Target:', e.target);
        console.log('Closest inventory item:', itemElement);
        
        if (!itemElement) {
            console.log('No inventory item found');
            return;
        }
        e.preventDefault();
        this.touchStartPosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        
        /*this.activeItem = {
            element: itemElement,
            data: this.getItemData(itemElement)
        };*/
        this.activeItem = this.getItemData(itemElement);
        window.activeItem = {
            element: itemElement,
            data: this.getItemData(itemElement)
        };
        
        console.log('Active item set:', this.activeItem);
        // Add visual feedback
        itemElement.classList.add('long-press-active');
        
        console.log('Added long-press-active class');
        // Start timer for long press
        this.touchTimer = setTimeout(() => {
            this.updateMenuOptions(this.activeItem);
            this.showMenu(e.touches[0]);
        }, 500); // 500ms for long press
    
        console.log('Touch start handler completed');
    }
    
    handleTouchEnd(e, itemElement) {
        this.cancelLongPress();
    }
    handleMouseUp(e, itemElement) {
        this.cancelLongPress();
    }
    
    handleMouseDown(e, itemElement) {
        this.activeItem = {
            element: itemElement,
            data: this.getItemData(itemElement)
        };
        
        itemElement.classList.add('long-press-active');
        
        this.touchTimer = setTimeout(() => {
            this.showMenu(e);
        }, 500);
    }
    
    handleMouseUp(e, itemElement) {
        this.cancelLongPress();
    }
    
    cancelLongPress() {
        if (this.touchTimer) {
            clearTimeout(this.touchTimer);
            this.touchTimer = null;
        }
        
        if (this.activeItem && this.activeItem.element) {
            this.activeItem.element.classList.remove('long-press-active');
        }
        
        this.touchStartPosition = null;
    }
    
    getItemData(itemElement) {
        // Extract item data from element attributes or dataset
        const data = {
            id: itemElement.dataset.itemId || null,
            name: itemElement.dataset.itemName || itemElement.querySelector('.item-name')?.textContent || 'Unknown Item',
            quantity: parseInt(itemElement.dataset.itemQuantity) || 1,
            type: itemElement.dataset.itemType || 'item',
            // Add more properties as needed
            ...JSON.parse(itemElement.dataset.itemData || '{}')
        };
        
        // Make sure equipped is parsed correctly (it might be a string "true"/"false")
        if (itemElement.dataset.equipped !== undefined) {
            data.equipped = itemElement.dataset.equipped === 'true' || 
                            itemElement.dataset.equipped === true;
        }
        
        return data;
    }
    
    showMenu(event) {
        if (!this.activeItem) return;
        
        // Clear timer
        this.cancelLongPress();
        
        // Calculate position
        const menuWidth = 250;
        const menuHeight = 280;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = event.clientX - (menuWidth / 2);
        let top = event.clientY - (menuHeight / 2);
        
        // Keep menu within viewport
        left = Math.max(10, Math.min(left, viewportWidth - menuWidth - 10));
        top = Math.max(10, Math.min(top, viewportHeight - menuHeight - 10));
        
        // Update menu position
        this.menuElement.style.left = left + 'px';
        this.menuElement.style.top = top + 'px';
        
        // Show menu
        this.backdrop.style.display = 'block';
        this.menuElement.style.display = 'block';
        
        // Trigger animations
        requestAnimationFrame(() => {
            this.backdrop.style.opacity = '1';
            this.menuElement.style.opacity = '1';
            this.menuElement.style.transform = 'scale(1)';
        });
        
        this.isMenuVisible = true;
        
        // Add haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    hideMenu() {
        this.backdrop.style.opacity = '0';
        this.menuElement.style.opacity = '0';
        this.menuElement.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            this.backdrop.style.display = 'none';
            this.menuElement.style.display = 'none';
        }, 300);
        
        this.isMenuVisible = false;
        this.activeItem = null;
    }
    
    async handleMenuAction(action) {
        if (!this.activeItem) {
            this.hideMenu();
            return;
        }
        
        switch(action) {
            case 'use':
                this.showUseModal();
                break;
            case 'equip':
                await this.toggleEquip();
                break;
            case 'info':
                this.showInfoModal();
                break;
            case 'delete':
                this.showDeleteModal();
                break;
        }
    }
    
    showUseModal() {
        const item = this.activeItem;
        const modal = this.createModal('use', item);
        
        // Add use options
        const useOptions = item.actions;
        const proficiencyBonus = getProficiencyBonusForLevel(window.character.level); 
        // We are asuming they have proficiency
        // and I will remember to subtract - 4 - proficiencyBonus if they don't for some reason
        let toHitModifier = 0;
        let addedDamageThroughModifier = 0;
        console.log('window.character: ', window.character);
        const dexMod = getMod(window.character.dexterity);
        const strMod = getMod(window.character.strength);
        console.log('dexMod: ', dexMod);
        console.log('strMod: ', strMod);
        console.log('item.finesse: ', item.finesse);
        console.log('proficiencyBonus: ', proficiencyBonus);
        console.log('item.modifierUsed: ', item.modifierUsed);
        if(item.modifierUsed == 'str') {
            toHitModifier = item.finesse ? Math.max(dexMod, strMod) + proficiencyBonus : strMod + proficiencyBonus;
            addedDamageThroughModifier = item.finesse ? Math.max(dexMod, strMod) : strMod;
        } else {
            toHitModifier = dexMod + proficiencyBonus;
            addedDamageThroughModifier = dexMod;
        }
        console.log('toHitModifier: ', toHitModifier);
        console.log('addedDamageThroughModifier: ', addedDamageThroughModifier);
        
        if (useOptions.length === 0) {
            const noUses = document.createElement('div');
            noUses.className = 'modal-body';
            noUses.style.textAlign = 'center';
            noUses.innerHTML = `
                <p></p>
            `;
            modal.content.querySelector('.modal-body').appendChild(noUses);
        } else {
            const useOptionsContainer = document.createElement('div');
            useOptionsContainer.className = 'use-options';
            
            useOptions.forEach((option, index) => {
                const useOption = document.createElement('div');
                const dicePortion = 
                    option.damageCalculation.includes('+') 
                    ? option.damageCalculation.split('+')[0].trim()
                    : (option.damageCalculation.includes('-')
                        ? option.damageCalculation.split('-')[0].trim()
                        : option.damageCalculation);
                let extraPortion =
                    option.damageCalculation.includes('+')
                    ? option.damageCalculation.split('+')[1].trim()
                    : (option.damageCalculation.includes('-')
                        ? '-' + option.damageCalculation.split('-')[1].trim()
                        : '0');
                extraPortion = parseInt(extraPortion) + addedDamageThroughModifier;
                const updatedDamageCalculation = `${dicePortion} ${extraPortion > 0 ? `+ ${extraPortion}` : extraPortion}`;
                const damageTypeName = getDisplayNameForDamageType(option.damageType, false);
                useOption.className = 'use-option';
                useOption.style.background = window.character.color;
                useOption.innerHTML = `
                    <div class="use-option-title" style="color: ${window.character.textColor};">${option.name || 'Usar'}</div>
                    ${option.damageCalculation ? `<div style="color: ${window.character.textColor};">+${toHitModifier} para atacar</div>` : ``}
                    ${option.damageCalculation ? `<div style="color: ${window.character.textColor};">${updatedDamageCalculation} de daño ${damageTypeName}</div>` : ``}
                    ${option.description ? `<div class="use-option-description" style="color: ${window.character.secondaryTextColor};">${option.description}</div>` : ''}
                `;
                
                /*useOption.addEventListener('click', () => {
                    this.handleUseItem(option);
                    this.closeModal(modal);
                });*/
                
                useOptionsContainer.appendChild(useOption);
            });
            
            modal.content.querySelector('.modal-body').appendChild(useOptionsContainer);
        }
        
        this.showModal(modal);
    }
    
    getDefaultUseOptions(item) {
        // Default use options based on item type
        const options = [];
        
        switch(item.type) {
            case 'potion':
            case 'consumable':
                options.push({
                    name: 'Consume',
                    description: 'Use this item',
                    action: 'consume'
                });
                break;
            case 'weapon':
                options.push({
                    name: 'Attack',
                    description: 'Use as a weapon',
                    action: 'attack'
                });
                break;
            case 'armor':
            case 'clothing':
                options.push({
                    name: 'Wear',
                    description: 'Put this item on',
                    action: 'wear'
                });
                break;
            default:
                // Empty array - no default uses
        }
        
        return options;
    }
    
    async toggleEquip() {
        const item = this.activeItem;
        console.log(`Toggling equip for: ${item.name}`);
        console.log(item);
        
        let idToGet = 0;
        window.inventory.forEach(invItem => {
            if(invItem.itemId == item.id)
                idToGet = invItem.id;
        });
        
        console.warn('item.id: ', item.id);
        console.warn('window.character.id: ', window.character.id);
        console.warn('idToGet: ', idToGet);
        const newEquipmentStatus = item.equipped ? false : true;
        console.warn('newEquipmentStatus: ', newEquipmentStatus);
        
        // 1. Update the database
        await updateById('Inventories', idToGet, { equipped: newEquipmentStatus });
        
        // 2. Query the updated row PROPERLY - await the promise
        const updatedItems = await queryDatabase('Inventories', { id: idToGet }, {});
        const updatedItem = updatedItems[0]; // queryDatabase returns an array
        
        if (updatedItem) {
            console.log(`After toggle:`, updatedItem);
            
            // 3. Update the window.inventory array to reflect the change
            const inventoryIndex = window.inventory.findIndex(invItem => invItem.id === idToGet);
            if (inventoryIndex !== -1) {
                window.inventory[inventoryIndex].equipped = updatedItem.equipped;
            }
            
            // 4. Update the character sheet to show the new equipped state
            await updateCharacterSheet();
            //this.showToast(`${item.name} ${updatedItem.equipped ? 'equipped' : 'unequipped'}`);
        } else {
            console.error('Could not retrieve updated item from database');
            this.showToast(`Error updating ${item.name}`, 'error');
        }
        
        // Hide the menu after action
        this.hideMenu();
    }
    
    showInfoModal() {
        const item = this.activeItem;
        console.log('FULL ITEM:');
        console.log(item);
        const modal = this.createModal('info', item);
        
        const infoContent = document.createElement('div');
        infoContent.className = 'modal-body';
        infoContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">
                <img width="60" height="60" 
                    src="${item.iconUrl.replace('customSize', '60').replace('customColor', window.character.textColor.replace('#', ''))}" alt="${item.iconAlt}"/>
                </div>
            </div>
            <div style="background: ${window.character.color}; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; color: ${window.character.secondaryTextColor}; text-align: center;">
                    ${item.description || 'No hay información de este objeto.'}
                </p>
            </div>
        `;
        
        modal.content.querySelector('.modal-body').appendChild(infoContent);
        this.showModal(modal);
    }
    
    showDeleteModal() {
        const item = this.activeItem;
        const modal = this.createModal('delete', item);
        
        const deleteContent = document.createElement('div');
        deleteContent.className = 'modal-body';
        deleteContent.innerHTML = `
        `;
        
        modal.content.querySelector('.modal-body').appendChild(deleteContent);
        
        // Custom footer with delete button
        const footer = modal.content.querySelector('.modal-footer');
        footer.innerHTML = '';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-button secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this.closeModal(modal));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'modal-button primary';
        deleteBtn.style.background = '#e74c3c';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            this.handleDeleteItem();
            this.closeModal(modal);
        });
        
        footer.appendChild(cancelBtn);
        footer.appendChild(deleteBtn);
        
        this.showModal(modal);
    }
    
    createModal(type, item) {
        console.log('> 1:');
        const modal = {
            overlay: document.createElement('div'),
            content: document.createElement('div')
        };
        
        modal.overlay.className = 'modal-overlay';
        
        modal.content.className = 'modal-content';
        modal.content.style.background = `${window.character.color}`;
        modal.content.innerHTML = `
            <div class="modal-header" style="color: ${window.character.textColor};">
                ${this.getModalTitle(type, item)}
            </div>
            <div class="modal-body" style="${window.character.secondaryTextColor};">
                <!-- Content will be added dynamically -->
            </div>
            <div class="modal-footer">
                <button class="modal-button primary close-modal" style="background: ${window.character.secondaryColor}; color: ${window.character.secondaryTextColor};">OK</button>
            </div>
        `;
        
        modal.overlay.appendChild(modal.content);
        document.body.appendChild(modal.overlay);
        
        // Add close button handler
        modal.content.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        // Close on backdrop click
        modal.overlay.addEventListener('click', (e) => {
            if (e.target === modal.overlay) {
                this.closeModal(modal);
            }
        });
        
        return modal;
    }
    
    getModalTitle(type, item) {
        switch(type) {
            case 'use': return `Usar ${item.name}`;
            case 'info': return `${item.name == item.itemType ? item.name : item.name + ' (' + item.itemType + ')'}`;
            case 'delete': return `¿Eliminar ${item.name}?`;
            default: return 'Acciones';
        }
    }
    
    showModal(modal) {
        requestAnimationFrame(() => {
            modal.overlay.classList.add('active');
        });
    }
    
    closeModal(modal) {
        modal.overlay.classList.remove('active');
        setTimeout(() => {
            if (modal.overlay.parentNode) {
                modal.overlay.remove();
            }
        }, 300);
    }
    
    handleUseItem(option) {
        const item = this.activeItem.data;
        console.log(`Using item: ${item.name} with option:`, option);
        
        // Placeholder - implement your use logic here
        this.showToast(`Used ${item.name}: ${option.name}`);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('itemUsed', {
            detail: { item, option }
        }));
    }
    
    handleDeleteItem() {
        const item = this.activeItem.data;
        console.log(`Deleting item: ${item.name}`);
        
        // Remove item from DOM
        if (this.activeItem.element && this.activeItem.element.parentNode) {
            this.activeItem.element.remove();
        }
        
        // Show confirmation
        this.showToast(`Deleted ${item.name}`, 'error');
        
        // Dispatch event for database update
        document.dispatchEvent(new CustomEvent('itemDeleted', {
            detail: { item }
        }));
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'item-toast';
        toast.textContent = message;
        
        const bgColor = type === 'error' ? '#e74c3c' : '#2ecc71';
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: ${bgColor};
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10001;
            opacity: 0;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
        
        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 2000);
    }
}

// Also call setupInventoryItems when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await setCharacterToWindow();
    if (window.inventoryMenu) {
        window.inventoryMenu.setupInventoryItems();
    }
});
// Function to handle sort button click
function setupSortButton(characterId) {
    const sortButton = document.getElementById('inventory-sort-button');
    if (!sortButton) return;
    
    sortButton.addEventListener('click', async () => {
        const currentSorting = sortButton.dataset.sorting;
        let nextSorting;
        
        // Cycle through sorting styles
        switch(currentSorting) {
            case 'default':
                nextSorting = 'price';
                break;
            case 'price':
                nextSorting = 'weight';
                break;
            case 'weight':
                nextSorting = 'default';
                break;
            default:
                nextSorting = 'default';
        }
        
        // Update button appearance
        sortButton.dataset.sorting = nextSorting;
        document.getElementById('sort-icon').textContent = getSortIcon(nextSorting);
        document.getElementById('sort-text').textContent = getSortText(nextSorting);
        
        // Save sorting preference to database
        try {
            await updateById('Players', characterId, { 
                currentInventorySorting: nextSorting 
            });
            
            // Update window.character to reflect the change
            if (window.character) {
                window.character.currentInventorySorting = nextSorting;
            }
            
            // Re-render the character sheet with new sorting
            await updateCharacterSheet();
            
        } catch (error) {
            console.error('Error updating sorting preference:', error);
            // Revert button state on error
            sortButton.dataset.sorting = currentSorting;
            document.getElementById('sort-icon').textContent = getSortIcon(currentSorting);
            document.getElementById('sort-text').textContent = getSortText(currentSorting);
        }
    });
}
function getSortIcon(sortingStyle) {
    switch(sortingStyle) {
        case 'default': return '📊'; // Chart icon for category sorting
        case 'price': return '💰'; // Money icon for price sorting
        case 'weight': return '⚖️'; // Scale icon for weight sorting
        default: return '📊';
    }
}

function getSortText(sortingStyle) {
    switch(sortingStyle) {
        case 'default': return 'Por categoría';
        case 'price': return 'Por precio';
        case 'weight': return 'Por peso';
        default: return 'Por categoría';
    }
}
async function createCharacterSheet(characterData) {
    window.character = characterData;
    // Default character structure
    const itemList = await queryDatabase('Items', {}, {});
    const defaults = {
        name: 'Unnamed Character',
        race: 'Unknown',
        class: 'Adventurer',
        level: 1,
        background: '',
        alignment: 'Neutral',
        experience: 0,
        
        // Ability scores
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        
        // Skills with proficiency
        skills: {
            acrobatics: { value: 0, proficient: false },
            animalHandling: { value: 0, proficient: false },
            arcana: { value: 0, proficient: false },
            athletics: { value: 0, proficient: false },
            deception: { value: 0, proficient: false },
            history: { value: 0, proficient: false },
            insight: { value: 0, proficient: false },
            intimidation: { value: 0, proficient: false },
            investigation: { value: 0, proficient: false },
            medicine: { value: 0, proficient: false },
            nature: { value: 0, proficient: false },
            perception: { value: 0, proficient: false },
            performance: { value: 0, proficient: false },
            persuasion: { value: 0, proficient: false },
            religion: { value: 0, proficient: false },
            sleightOfHand: { value: 0, proficient: false },
            stealth: { value: 0, proficient: false },
            survival: { value: 0, proficient: false }
        },
        
        // Combat stats
        maxHP: 10,
        currentHP: 10,
        tempHP: 0,
        armorClass: 10,
        initiative: 0,
        speed: 30,
        
        // Inventory
        inventory: [],
        currency: {
            cp: 0,
            sp: 0,
            ep: 0,
            gp: 0,
            pp: 0
        },
        
        // Features & abilities
        features: [],
        spells: [],
        
        // Notes
        notes: '',
        backstory: '',
        
        // Appearance
        appearance: '',
        personality: '',
        ideals: '',
        bonds: '',
        flaws: ''
    };
    
    // Merge with provided data
    const character = { ...defaults, ...characterData };
    
    // Calculate ability modifiers
    const calculateModifier = (score) => Math.floor((score - 10) / 2);
    
    // Calculate proficiency bonus
    const proficiencyBonus = Math.ceil(character.level / 4) + 1;
    
    const skillsAndNames = [
        { property: 'acrobatics', name: 'Acrobacia'},
        { property: 'performance', name: 'Actuación'},
        { property: 'arcana', name: 'Arcana'},
        { property: 'athletics', name: 'Atleticismo'},
        { property: 'animalHandling', name: 'Manejo Animal'},
        { property: 'deception', name: 'Engaño'},
        { property: 'insight', name: 'Entendimiento'},
        { property: 'history', name: 'Historia'},
        { property: 'intimidation', name: 'Intimidación'},
        { property: 'investigation', name: 'Investigación'},
        { property: 'medicine', name: 'Medicina'},
        { property: 'nature', name: 'Naturaleza'},
        { property: 'perception', name: 'Percepción'},
        { property: 'persuasion', name: 'Persuasión'},
        { property: 'religion', name: 'Religión'},
        { property: 'stealth', name: 'Sigilo'},
        { property: 'survival', name: 'Supervivencia'},
        { property: 'sleightOfHand', name: 'Truco de Manos'}
    ];
    let skillsHtml = '';
    skillsAndNames.forEach(item => {
        skillsHtml += `<div class="skill-item ${character.skills[item.property].proficient ? 'proficient' : ''}" style="background: ${character.color};">
            <div class="skill-checkbox">
                <input type="checkbox" ${character.skills[item.property].proficient ? 'checked' : ''} disabled>
            </div>
            <div class="skill-name" style="color: ${character.secondaryTextColor};">${item.name}</div>
            <div class="skill-mod" style="color: ${character.textColor};">${character.skills[item.property].value >= 0 ? '+' : ''}${character.skills[item.property].value}</div>
        </div>`;
    });
    // Create the character sheet HTML
    const activeTab = character.activeTab;
    // Get the current sorting style from character
    const currentSortingStyle = character.currentInventorySorting || 'default';
    
    // Sort the inventory
    const sortedInventory = await sortInventory(character.inventory, currentSortingStyle);
    
    // Group by category for display (only for default sorting)
    let inventoryHtml = '';
    
    if (currentSortingStyle === 'default') {
        // Group items by category for default sorting
        const itemTypes = await queryDatabase('ItemTypes', {}, {});
        const itemCategories = await queryDatabase('ItemCategories', {}, {});
        
        const itemTypeMap = new Map();
        itemTypes.forEach(type => {
            itemTypeMap.set(type.id, type);
        });
        
        const categoryMap = new Map();
        itemCategories.forEach(category => {
            categoryMap.set(category.id, {
                displayName: category.displayName,
                priority: category.priority
            });
        });
        
        // Helper to get category for an item
        const getCategoryForItem = (item) => {
            const itemType = itemTypeMap.get(item.itemTypeId);
            if (!itemType) return { displayName: 'Other', priority: 999 };
            const category = categoryMap.get(itemType.categoryId);
            return category || { displayName: 'Other', priority: 999 };
        };
        
        // Group items by category
        const itemsByCategory = {};
        sortedInventory.forEach(item => {
            const category = getCategoryForItem(item);
            if (!itemsByCategory[category.displayName]) {
                itemsByCategory[category.displayName] = {
                    items: [],
                    priority: category.priority
                };
            }
            itemsByCategory[category.displayName].items.push(item);
        });
        
        // Get categories sorted by priority
        const sortedCategories = Object.keys(itemsByCategory)
            .map(name => ({ name, ...itemsByCategory[name] }))
            .sort((a, b) => a.priority - b.priority);
        
        // Generate HTML with category headers
        inventoryHtml = sortedCategories.map(category => `
            <div class="category-section">
                <h4 class="category-header" style="color: ${character.textColor}; background: ${character.color}; padding: 5px; border-radius: 4px; margin: 10px 0 5px 0;">
                    ${category.name}
                </h4>
                ${category.items.map((item, index) => createInventoryItemHtml(item, character, index)).join('')}
            </div>
        `).join('');
    } else {
        // For price/weight sorting, no category headers
        inventoryHtml = sortedInventory.map((item, index) => 
            createInventoryItemHtml(item, character, index)
        ).join('');
    }
    
    // Helper function to create inventory item HTML
    function createInventoryItemHtml(item, character, index) {
        return `
            <div class="inventory-item" 
                data-item-id="${item.id}"
                data-item-name="${item.name}"
                data-item-quantity="${item.quantity}"
                data-equipped="${item.equipped}"
                data-item-data='${JSON.stringify(item)}'
                style="background: ${item.equipped ? character.secondaryColor : character.darkColor}; margin-bottom: 5px;">
                <div class="item-icon" style="margin-right: 10px;"><img width="20" height="20" src="${item.iconUrl.replace('customSize', '20').replace('customColor', character.textColor.replace('#', ''))}" alt="${item.iconAlt}"/></div>
                <div class="item-name" style="color: ${character.textColor};">${item.name || `Item ${index + 1}`}</div>
                ${item.quantity && item.quantity > 1 ? `<div class="item-quantity" style="background: ${character.color}; color: ${character.secondaryTextColor};">x${item.quantity}</div>` : ''}
                ${item.weight && item.quantity ? `<div class="item-weight" style="background: ${character.color}; color: ${character.textColor};">${(item.weight * item.quantity).toFixed(2)} kg</div>` : ''}
                ${item.avgPrice ? `<div class="item-price" style="background: ${character.color}; color: ${character.secondaryTextColor};">${item.avgPrice} <img width="12" height="12" src="https://img.icons8.com/glyph-neue/64/${character.textColor.replace('#', '')}/cheap-2.png" alt="gold"/></div>` : ''}
            </div>
        `;
    }
    let sheetHTML = `
        <div class="character-sheet mobile-sheet">
            <!-- Character header -->
            <div class="character-header" style="background: ${character.color};">
                <h1 class="character-name" style="color: ${character.textColor};">${character.name}</h1>
                <div class="character-subtitle">
                    <span class="character-race" style="color: ${character.secondaryTextColor};">${character.race}</span>
                    <span class="separator" style="color: ${character.secondaryTextColor};">•</span>
                    <span class="character-class" style="color: ${character.secondaryTextColor};">${character.class}</span>
                    <span class="separator" style="color: ${character.secondaryTextColor};">•</span>
                    <span style="color: ${character.secondaryTextColor};">Nivel ${character.level}</span>
                </div>
                <div class="quick-stats">
                    <div class="quick-stat">
                        <span class="stat-label" style="color: ${character.secondaryTextColor};">HP</span>
                        <span class="stat-value" style="color: ${character.textColor};">${character.currentHP}/${character.maxHP}</span>
                    </div>
                    <div class="quick-stat">
                        <span class="stat-label" style="color: ${character.secondaryTextColor};">AC</span>
                        <span class="stat-value" style="color: ${character.textColor};">${character.armorClass}</span>
                    </div>
                    <div class="quick-stat">
                        <span class="stat-label" style="color: ${character.secondaryTextColor};">Initiative</span>
                        <span class="stat-value" style="color: ${character.textColor};">${character.initiative >= 0 ? '+' : ''}${character.initiative}</span>
                    </div>
                    <div class="quick-stat">
                        <span class="stat-label" style="color: ${character.secondaryTextColor};">Speed</span>
                        <span class="stat-value" style="color: ${character.textColor};">${character.speed}</span>
                    </div>
                </div>
            </div>
            
            <!-- Tab navigation -->
            <div class="tabs-container">
                <div class="tabs" style="background: ${character.secondaryColor};">
                    <button onclick="loadActiveTabToStorage(${character.id}, 'general');" class="tab-button ${activeTab == 'general' ? 'active' : ''}" data-tab="general"><img width="30" height="30" src="https://img.icons8.com/sf-black-filled/64/${character.secondaryTextColor.replace('#', '')}/shield.png" alt="shield"/></button>
                    <button onclick="loadActiveTabToStorage(${character.id}, 'skills');" class="tab-button ${activeTab == 'skills' ? 'active' : ''}" data-tab="skills"><img width="30" height="30" src="https://img.icons8.com/sf-regular-filled/50/${character.secondaryTextColor.replace('#', '')}/light-on.png" alt="light-on"/></button>
                    <button onclick="loadActiveTabToStorage(${character.id}, 'inventory');" class="tab-button ${activeTab == 'inventory' ? 'active' : ''}" data-tab="inventory"><img width="30" height="30" src="https://img.icons8.com/glyph-neue/64/${character.secondaryTextColor.replace('#', '')}/bag-front-view.png" alt="bag-front-view"/></button>
                    <button onclick="loadActiveTabToStorage(${character.id}, 'notes');" class="tab-button ${activeTab == 'notes' ? 'active' : ''}" data-tab="notes"><img width="30" height="30" src="https://img.icons8.com/sf-black-filled/50/${character.secondaryTextColor.replace('#', '')}/create-new.png" alt="create-new"/></button>
                    <button onclick="loadActiveTabToStorage(${character.id}, 'wiki');" class="tab-button ${activeTab == 'wiki' ? 'active' : ''}" data-tab="wiki"><img width="30" height="30" src="https://img.icons8.com/ios-filled/50/${character.secondaryTextColor.replace('#', '')}/geography.png" alt="geography"/></button>
                </div>
            </div>
            
            <!-- Tab content -->
            <div class="tab-content-container" style="background: ${character.secondaryColor};">
                <!-- General Info Tab -->
                <div class="tab-content ${activeTab == 'general' ? 'active' : ''}" id="general-tab">
                    <div class="general-grid" style="background: ${character.secondaryColor};">
                        <!-- Ability Scores -->
                        <div class="ability-scores-section" style="background: ${character.color};">
                            <div class="ability-scores-grid">
                                ${['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(ability => {
                                    const score = character[ability];
                                    const mod = calculateModifier(score);
                                    return `
                                        <div class="ability-score" style="background: ${character.secondaryColor};">
                                            <div class="ability-name" style="color: ${character.textColor};">${ability.substring(0, 3).toUpperCase()}</div>
                                            <div class="ability-value" style="color: ${character.secondaryTextColor};">${score}</div>
                                            <div class="ability-mod" style="color: ${character.textColor};">${mod >= 0 ? '+' : ''}${mod}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        
                        <!-- Saving Throws -->
                        <div class="saving-throws-section" style="background: ${character.color};">
                            <div class="saving-throws">
                                <div class="saving-throw ${character.strProficiency ? 'proficient' : ''}" style="background: ${character.secondaryColor};">
                                    <span class="throw-name" style="color: ${character.secondaryTextColor};">STR</span>
                                    <span class="throw-mod" style="color: ${character.textColor};">${character.strSavingThrows >= 0 ? '+' : ''}${character.strSavingThrows}</span>
                                </div>
                                <div class="saving-throw ${character.dexProficiency ? 'proficient' : ''}" style="background: ${character.secondaryColor};">
                                    <span class="throw-name" style="color: ${character.secondaryTextColor};">DEX</span>
                                    <span class="throw-mod" style="color: ${character.textColor};">${character.dexSavingThrows >= 0 ? '+' : ''}${character.dexSavingThrows}</span>
                                </div>
                                <div class="saving-throw ${character.conProficiency ? 'proficient' : ''}" style="background: ${character.secondaryColor};">
                                    <span class="throw-name" style="color: ${character.secondaryTextColor};">CON</span>
                                    <span class="throw-mod" style="color: ${character.textColor};">${character.conSavingThrows >= 0 ? '+' : ''}${character.conSavingThrows}</span>
                                </div>
                                <div class="saving-throw ${character.intProficiency ? 'proficient' : ''}" style="background: ${character.secondaryColor};">
                                    <span class="throw-name" style="color: ${character.secondaryTextColor};">INT</span>
                                    <span class="throw-mod" style="color: ${character.textColor};">${character.intSavingThrows >= 0 ? '+' : ''}${character.intSavingThrows}</span>
                                </div>
                                <div class="saving-throw ${character.wisProficiency ? 'proficient' : ''}" style="background: ${character.secondaryColor};">
                                    <span class="throw-name" style="color: ${character.secondaryTextColor};">WIS</span>
                                    <span class="throw-mod" style="color: ${character.textColor};">${character.wisSavingThrows >= 0 ? '+' : ''}${character.wisSavingThrows}</span>
                                </div>
                                <div class="saving-throw ${character.chaProficiency ? 'proficient' : ''}" style="background: ${character.secondaryColor};">
                                    <span class="throw-name" style="color: ${character.secondaryTextColor};">CHA</span>
                                    <span class="throw-mod" style="color: ${character.textColor};">${character.chaSavingThrows >= 0 ? '+' : ''}${character.chaSavingThrows}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Skills Tab -->
                <div class="tab-content ${activeTab == 'skills' ? 'active' : ''}" id="skills-tab">
                    <div class="skills-section" style="background: ${character.secondaryColor};">
                        <div class="proficiency-info" style="background: ${character.color}; color: ${character.textColor};">
                            Proficiency Bonus: +${character.proficiencyBonus}
                        </div>
                        <div class="skills-list" style="color: ${character.textColor};">`
    sheetHTML += skillsHtml;
    sheetHTML +=`       </div>
                    </div>
                </div>
                
                <!-- Inventory Tab -->
                <div class="tab-content ${activeTab == 'inventory' ? 'active' : ''}" id="inventory-tab" style="background: ${character.secondaryColor};">
                    <div class="inventory-section">
                        <!-- Currency -->
                        <div class="currency-section" style="background: ${character.color};">
                            <h3 style="text-align: center; color: ${character.secondaryTextColor}">${character.gold} <img width="20" height="20" src="https://img.icons8.com/glyph-neue/64/${character.textColor.replace('#', '')}/cheap-2.png" alt="cheap-2"/></h3>
                        </div>
                        
                        <!-- Inventory Items with Sorting Button -->
                        <div class="items-section" style="background: ${character.color}; position: relative;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h3 style="color: ${character.textColor}; margin: 0;">Inventario</h3>
                                <button id="inventory-sort-button" class="sort-button" 
                                    data-sorting="${currentSortingStyle}"
                                    style="background: ${character.secondaryColor}; color: ${character.secondaryTextColor}; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 14px;">
                                    <span id="sort-icon">${getSortIcon(currentSortingStyle)}</span>
                                    <span id="sort-text">${getSortText(currentSortingStyle)}</span>
                                </button>
                            </div>
                            <div id="inventory-items-container">
                                ${inventoryHtml}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Notes Tab -->
                <div class="tab-content ${activeTab == 'notes' ? 'active' : ''}" id="notes-tab">
                    <div class="notes-section">
                        <div class="notes-category">
                            <h3>Backstory</h3>
                            <div class="notes-content">${character.backstory || 'No backstory recorded.'}</div>
                        </div>
                        
                        <div class="notes-category">
                            <h3>Appearance</h3>
                            <div class="notes-content">${character.appearance || 'No appearance description.'}</div>
                        </div>
                        
                        <div class="notes-category">
                            <h3>Personality Traits</h3>
                            <div class="notes-content">${character.personality || 'No personality traits recorded.'}</div>
                        </div>
                        
                        <div class="notes-category">
                            <h3>Ideals</h3>
                            <div class="notes-content">${character.ideals || 'No ideals recorded.'}</div>
                        </div>
                        
                        <div class="notes-category">
                            <h3>Bonds</h3>
                            <div class="notes-content">${character.bonds || 'No bonds recorded.'}</div>
                        </div>
                        
                        <div class="notes-category">
                            <h3>Flaws</h3>
                            <div class="notes-content">${character.flaws || 'No flaws recorded.'}</div>
                        </div>
                        
                        <div class="notes-category">
                            <h3>Additional Notes</h3>
                            <div class="notes-content">${character.notes || 'No additional notes.'}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Wiki Tab -->
                <div class="tab-content ${activeTab == 'wiki' ? 'active' : ''}" id="wiki-tab">
                    <div class="wiki-section">
                        <h3>Features & Abilities</h3>
                        ${character.features.length > 0 ? `
                            <div class="features-list">
                                ${character.features.map(feature => `
                                    <div class="feature-item">
                                        <h4 class="feature-name">${feature.name || 'Unnamed Feature'}</h4>
                                        <div class="feature-description">${feature.description || 'No description available.'}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">No features recorded</div>
                        `}
                        
                        <h3>Spells</h3>
                        ${character.spells.length > 0 ? `
                            <div class="spells-list">
                                ${character.spells.map(spell => `
                                    <div class="spell-item">
                                        <div class="spell-header">
                                            <span class="spell-name">${spell.name || 'Unnamed Spell'}</span>
                                            <span class="spell-level">${spell.level ? `Level ${spell.level}` : 'Cantrip'}</span>
                                        </div>
                                        <div class="spell-details">
                                            ${spell.school ? `<span class="spell-school">${spell.school}</span>` : ''}
                                            ${spell.components ? `<span class="spell-components">${spell.components}</span>` : ''}
                                        </div>
                                        <div class="spell-description">${spell.description || ''}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">No spells recorded</div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create container and inject HTML
    const container = document.createElement('div');
    container.innerHTML = sheetHTML;
    // Add tab switching functionality
    const tabButtons = container.querySelectorAll('.tab-button');
    const tabContents = container.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const tabId = button.getAttribute('data-tab');
            const correspondingContent = container.querySelector(`#${tabId}-tab`);
            if (correspondingContent) {
                correspondingContent.classList.add('active');
            }
        });
    });
    setTimeout(() => {
        setupSortButton(characterData.id);
    }, 100);
    return container;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function capitalizeFirstLetters(string) {
    return string.split(' ').map(word => capitalizeFirstLetter(word)).join(' ');
}
class DatabaseQueryBuilder {
    constructor(supabase) {
        this.supabase = supabase;
        this.query = null;
        this.table = null;
    }
    
    from(table) {
        this.table = table;
        this.query = this.supabase.from(table);
        return this;
    }
    
    select(columns = '*') {
        this.query = this.query.select(columns);
        return this;
    }
    
    where(column, operator = 'eq', value) {
        if (typeof column === 'object') {
            // Object syntax: {column: value} or {column: {operator: value}}
            Object.entries(column).forEach(([col, val]) => {
                if (typeof val === 'object' && val !== null && val.operator) {
                    this.applyOperator(col, val.operator, val.value);
                } else {
                    this.applyOperator(col, 'eq', val);
                }
            });
        } else if (Array.isArray(column)) {
            // Array of conditions
            column.forEach(condition => {
                if (condition && condition.column) {
                    this.applyOperator(
                        condition.column, 
                        condition.operator || 'eq', 
                        condition.value
                    );
                }
            });
        } else {
            // Simple column, operator, value
            this.applyOperator(column, operator, value);
        }
        return this;
    }
    
    applyOperator(column, operator, value) {
        if (value === undefined || value === null) return this;
        
        switch(operator.toLowerCase()) {
            case 'eq': this.query = this.query.eq(column, value); break;
            case 'neq': this.query = this.query.neq(column, value); break;
            case 'gt': this.query = this.query.gt(column, value); break;
            case 'gte': this.query = this.query.gte(column, value); break;
            case 'lt': this.query = this.query.lt(column, value); break;
            case 'lte': this.query = this.query.lte(column, value); break;
            case 'like': this.query = this.query.like(column, value); break;
            case 'ilike': this.query = this.query.ilike(column, value); break;
            case 'in': this.query = this.query.in(column, value); break;
            case 'is': this.query = this.query.is(column, value); break;
            case 'contains': this.query = this.query.contains(column, value); break;
            case 'cs': this.query = this.query.contains(column, value); break; // alias
            case 'cd': this.query = this.query.containedBy(column, value); break;
            case 'ov': this.query = this.query.overlaps(column, value); break;
            case 'sl': this.query = this.query.sl(column, value); break;
            case 'sr': this.query = this.query.sr(column, value); break;
            case 'nxr': this.query = this.query.nxr(column, value); break;
            case 'nxl': this.query = this.query.nxl(column, value); break;
            case 'adj': this.query = this.query.adj(column, value); break;
            case 'fts': this.query = this.query.textSearch(column, value); break;
            default: this.query = this.query.eq(column, value);
        }
        return this;
    }
    
    or(conditions) {
        if (this.query.or && conditions) {
            const orString = conditions.map(cond => {
                if (cond.column && cond.value !== undefined) {
                    return `${cond.column}.${cond.operator || 'eq'}.${cond.value}`;
                }
                return '';
            }).filter(Boolean).join(',');
            
            if (orString) this.query = this.query.or(orString);
        }
        return this;
    }
    
    limit(num) {
        this.query = this.query.limit(num);
        return this;
    }
    
    order(column, ascending = true) {
        this.query = this.query.order(column, { ascending });
        return this;
    }
    
    range(from, to) {
        this.query = this.query.range(from, to);
        return this;
    }
    
    async execute() {
        if (!this.query) throw new Error('Query not initialized');
        const { data, error } = await this.query;
        if (error) throw error;
        return data;
    }
}

// Usage wrapper
async function queryDatabase(table, filters = {}, options = {}) {
    if (!window.supabaseClient) {
        window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    }
    
    const builder = new DatabaseQueryBuilder(window.supabaseClient);
    
    builder.from(table).select(options.select || '*');
    
    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
        builder.where(filters);
    }
    
    // Apply options
    if (options.limit) builder.limit(options.limit);
    if (options.orderBy) {
        builder.order(options.orderBy.column, options.orderBy.ascending !== false);
    }
    if (options.range) {
        builder.range(options.range.from, options.range.to);
    }
    
    const result = await builder.execute();
    //console.warn(JSON.stringify(result));
    return options.returnJSON ? JSON.parse(JSON.stringify(result)) : result;
}
async function fetchCampaigns() {
    try {
        const { data, error, status, count } = await supabaseClient
            .from('Campaigns')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) {
            console.error('Detailed error:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }
        return data;
        
    } catch (error) {
        console.error('Catch block error:', error.message);
        console.error('Full error object:', error);
    }
}
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
// Add these functions to your script
function createTurnRadioButton(rowData) {
    const radioButton = document.createElement('div');
    radioButton.className = 'turn-radio-button';
    radioButton.dataset.creatureId = rowData.type === 'player' ? rowData.name : rowData.id;
    radioButton.dataset.rowType = rowData.type;
    
    // Set initial state - first row after sorting should be selected
    const isSelected = isInitialLoad && window.encounterTableData[0] === rowData;
    if (isSelected) {
        currentTurnCreatureId = radioButton.dataset.creatureId;
    }
    
    radioButton.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${isSelected ? '#eab308' : '#364051'};
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 0 5px rgba(0,0,0,0.3);
        transition: background-color 0.3s, transform 0.2s;
        flex-shrink: 0;
        margin-right: 10px;
    `;
    
    radioButton.title = isSelected ? 'Current turn (click to end turn)' : 'Click to start this creature\'s turn';
    
    radioButton.addEventListener('click', (e) => {
        e.stopPropagation();
        handleTurnButtonClick(radioButton, rowData);
    });
    
    radioButton.addEventListener('mouseenter', () => {
        if (!radioButton.classList.contains('selected')) {
            radioButton.style.transform = 'scale(1.1)';
            radioButton.style.boxShadow = '0 0 8px rgba(234, 179, 8, 0.5)';
        }
    });
    
    radioButton.addEventListener('mouseleave', () => {
        if (!radioButton.classList.contains('selected')) {
            radioButton.style.transform = 'scale(1)';
            radioButton.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
        }
    });
    
    if (isSelected) {
        radioButton.classList.add('selected');
        handleCreatureTurnStart(rowData);
    }
    
    return radioButton;
}

function handleTurnButtonClick(radioButton, rowData) {
    const creatureId = radioButton.dataset.creatureId;
    console.log('Creature ID clicked:', creatureId);
    // Remove current-turn class from all rows
    document.querySelectorAll('.encounter-table tr').forEach(row => {
        row.classList.remove('current-turn');
    });
    
    // If clicking the already selected button, do nothing
    if (creatureId === currentTurnCreatureId) {
        return;
    }
    
    // Handle end of previous turn
    if (currentTurnCreatureId) {
        const previousRadioButton = document.querySelector(`.turn-radio-button[data-creature-id="${currentTurnCreatureId}"]`);
        if (previousRadioButton) {
            previousRadioButton.style.backgroundColor = '#364051';
            previousRadioButton.classList.remove('selected');
            previousRadioButton.title = 'Click to start this creature\'s turn';
            
            // Remove current-turn class from previous row
            const previousRow = previousRadioButton.closest('tr');
            if (previousRow) {
                previousRow.classList.remove('current-turn');
                
                // Decrease conditions by 1 for the creature whose turn just ended
                const conditionsCell = previousRow.querySelector('td[data-key="conditions"]');
                if (conditionsCell && conditionsCell._conditionsData && conditionsCell._conditionsData.length > 0) {
                    const newConditions = conditionsCell._conditionsData
                        .map(condition => ({
                            ...condition,
                            turns: condition.turns - 1
                        }))
                        .filter(condition => condition.turns > 0);
                    
                    // Update the data model
                    const rowIndex = window.encounterTableData.findIndex(item => 
                        (item.type === 'player' ? item.name : item.id) === currentTurnCreatureId
                    );
                    
                    if (rowIndex !== -1) {
                        window.encounterTableData[rowIndex].conditions = stringifyConditions(newConditions);
                        conditionsCell._conditionsData = newConditions;
                        updateConditionsDisplay(conditionsCell, newConditions);
                    }
                }
            }
            
            // Call turn end handler
            const previousRowData = window.encounterTableData.find(item => 
                (item.type === 'player' ? item.name : item.id) === currentTurnCreatureId
            );
            if (previousRowData) {
                handleCreatureTurnEnd(previousRowData);
            }
        }
    }
    
    // Start new turn
    currentTurnCreatureId = creatureId;
    console.log('After being set, currentTurnCreatureId:', currentTurnCreatureId);
    console.log(window.currentTurnCreatureId);
    radioButton.style.backgroundColor = '#eab308';
    radioButton.classList.add('selected');
    radioButton.title = 'Current turn (click to end turn)';
    radioButton.style.transform = 'scale(1)';
    radioButton.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.8)';
    
    // Add current-turn class to the new row
    const row = radioButton.closest('tr');
    if (row) {
        row.classList.add('current-turn');
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Call turn start handler
    handleCreatureTurnStart(rowData);
}

function handleCreatureDeathDuringTurn(diedCreatureId) {
    console.log('Handling death of creature ID:', diedCreatureId, 'Current turn creature ID:', currentTurnCreatureId);
    if (currentTurnCreatureId === diedCreatureId) {
        // Remove current-turn class from all rows
        document.querySelectorAll('.encounter-table tr').forEach(row => {
            row.classList.remove('current-turn');
        });
        
        // Find the next creature in initiative order
        window.encounterTableData.forEach(item => {
            console.log('item:', item);
        });
        const currentIndex = window.encounterTableData.findIndex(item => 
            (item.type === 'player' ? item.name : item.id) === diedCreatureId
        );
        console.log('Current index of died creature:', currentIndex);
        let nextCreature = null;
        
        if (currentIndex < window.encounterTableData.length - 1) {
            nextCreature = window.encounterTableData[currentIndex + 1];
        } else if (window.encounterTableData.length > 0) {
            nextCreature = window.encounterTableData[0];
        }
        console.log('Next creature to take turn:', nextCreature);
        // Call turn end for the creature that died
        const diedCreature = window.encounterTableData.find(item => 
            (item.type === 'player' ? item.name : item.id) === diedCreatureId
        );
        console.log('Creature that died:', diedCreature);
        if (diedCreature) {
            handleCreatureTurnEnd(diedCreature);
        }
        
        // Select the next creature's turn
        if (nextCreature) {
            const nextRadioButton = document.querySelector(`.turn-radio-button[data-creature-id="${nextCreature.type === 'player' ? nextCreature.name : nextCreature.id}"]`);
            if (nextRadioButton) {
                currentTurnCreatureId = nextCreature.type === 'player' ? nextCreature.name : nextCreature.id;
                
                // Update all radio buttons
                document.querySelectorAll('.turn-radio-button').forEach(btn => {
                    btn.style.backgroundColor = '#364051';
                    btn.classList.remove('selected');
                    btn.title = 'Click to start this creature\'s turn';
                    btn.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
                });
                
                // Select the next creature
                nextRadioButton.style.backgroundColor = '#eab308';
                nextRadioButton.classList.add('selected');
                nextRadioButton.title = 'Current turn (click to end turn)';
                nextRadioButton.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.8)';
                
                // Add current-turn class to the new row
                const nextRow = nextRadioButton.closest('tr');
                if (nextRow) {
                    nextRow.classList.add('current-turn');
                }
                
                // Call turn start handler for the new creature
                handleCreatureTurnStart(nextCreature);
            }
        } else {
            currentTurnCreatureId = null;
            document.querySelectorAll('.turn-radio-button').forEach(btn => {
                btn.style.backgroundColor = '#364051';
                btn.classList.remove('selected');
                btn.title = 'Click to start this creature\'s turn';
                btn.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
            });
        }
    }
}

// Placeholder functions for future use
function handleCreatureTurnStart(creatureData) {
    console.log(`Turn started for: ${creatureData.name}`);
    // Add your custom logic here
    // Example: Highlight the creature, play sound, show notification, etc.
    if (creatureData.type === 'monster' || creatureData.type === 'creature') {
        popup.show([`#8A95A8=${creatureData.name} ${creatureData.id}'s`, 'white= turn starts']);
    } else {
        popup.show([`${creatureData.color}=${creatureData.name}'s`, 'white= turn starts']);
    }
}

function handleCreatureTurnEnd(creatureData) {
    console.log(`Turn ended for: ${creatureData.name}`);
    // Add your custom logic here
    // Example: Remove highlights, update resources, etc.
}
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
        min-width: 500px;
        max-width: 600px;
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
function logColoredMessage(partsArray) {
    let logString = '';
    const styles = [];
    
    partsArray.forEach(part => {
        if (typeof part !== 'string') {
            logString += String(part) + ' ';
            return;
        }
        
        if (part.includes('=')) {
            const [color, ...textParts] = part.split('=');
            const text = textParts.join('=');
            const cssColor = color.startsWith('#') ? color : 
                            /^[0-9A-Fa-f]{3,6}$/.test(color) ? '#' + color : color;
            
            logString += `%c${text} `;
            styles.push(`color: ${cssColor};`);
        } else {
            logString += part + ' ';
        }
    });
    console.log(logString, ...styles);
}
class PopupManager {
    constructor() {
        this.popups = []; // Store multiple popups
        this.nextZIndex = 10000; // Start with high z-index
        this.defaultDuration = secondsPopupShown * 1000;
        this.autoLog = true; // Add this flag
    }
    
    show(messageOrArray, seconds = secondsPopupShown) {
        if (this.autoLog) {
            if (Array.isArray(messageOrArray)) {
                logColoredMessage(messageOrArray);
            } else {
                console.log(`%c${messageOrArray}`, `color: #${specialTextColor};`);
            }
        }
        const popup = this.createPopup(messageOrArray, seconds);
        this.popups.push(popup);
        document.body.appendChild(popup.element);
        
        // Position popups in a column from top-right
        this.positionPopups();
        
        // Set timeout for auto-removal
        popup.timeout = setTimeout(() => {
            this.removePopup(popup.id);
        }, seconds * 1000);
        
        // Return popup ID for potential manual removal
        return popup.id;
    }
    
    createPopup(messageOrArray, seconds) {
        const id = 'popup-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const element = document.createElement('div');
        
        // Determine if message is an array or string
        let content;
        if (Array.isArray(messageOrArray)) {
            content = this.parseColoredArray(messageOrArray);
        } else {
            // Plain string - apply default special text color
            content = `<span style="color: #${specialTextColor}">${this.escapeHtml(messageOrArray)}</span>`;
        }
        
        element.innerHTML = content;
        
        Object.assign(element.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#333',
            color: 'white', // Default text color (for any plain text)
            padding: '12px 20px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: this.nextZIndex++,
            fontSize: '18px',
            fontWeight: '500',
            maxWidth: '300px',
            pointerEvents: 'none',
            cursor: 'default',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            transform: 'translateY(-10px)',
            marginBottom: '10px' // Space between popups
        });
        
        // Fade in and slide down
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 10);
        
        return {
            id: id,
            element: element,
            timeout: null,
            created: Date.now()
        };
    }
    
    parseColoredArray(colorArray) {
        let html = '';
        
        for (const item of colorArray) {
            if (typeof item !== 'string') continue;
            
            // Split by first '=' to separate color from text
            const parts = item.split('=');
            if (parts.length < 2) {
                // If no color specified, use default special text color
                html += `<span style="color: #${specialTextColor}">${this.escapeHtml(item)}</span>`;
                continue;
            }
            
            const colorCode = parts[0].trim();
            const text = parts.slice(1).join('='); // In case text contains '='
            
            // Validate color code
            let validColor;
            if (colorCode.startsWith('#') && (colorCode.length === 4 || colorCode.length === 7)) {
                validColor = colorCode; // Already hex
            } else if (colorCode.match(/^[0-9A-Fa-f]{6}$/)) {
                validColor = '#' + colorCode; // Hex without #
            } else if (colorCode.match(/^[0-9A-Fa-f]{3}$/)) {
                validColor = '#' + colorCode; // Short hex
            } else {
                // Try CSS color names
                const tempDiv = document.createElement('div');
                tempDiv.style.color = colorCode;
                document.body.appendChild(tempDiv);
                const computedColor = getComputedStyle(tempDiv).color;
                document.body.removeChild(tempDiv);
                
                if (computedColor !== 'rgb(0, 0, 0)' || colorCode.toLowerCase() === 'black') {
                    validColor = colorCode;
                } else {
                    // Fallback to special text color
                    validColor = '#' + specialTextColor;
                }
            }
            
            html += `<span style="color: ${validColor}">${this.escapeHtml(text)}</span>`;
        }
        return html;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    positionPopups() {
        let topPosition = 20;
        
        // Sort popups by creation time (newest first for stacking)
        this.popups.sort((a, b) => b.created - a.created);
        
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const popup = this.popups[i];
            popup.element.style.top = topPosition + 'px';
            topPosition += popup.element.offsetHeight + 10; // 10px gap
            
            // Bring newest to top (highest z-index)
            popup.element.style.zIndex = this.nextZIndex - (this.popups.length - i);
        }
    }
    
    removePopup(popupId) {
        const index = this.popups.findIndex(p => p.id === popupId);
        if (index === -1) return;
        
        const popup = this.popups[index];
        
        // Clear timeout if still exists
        if (popup.timeout) {
            clearTimeout(popup.timeout);
        }
        
        // Fade out
        popup.element.style.opacity = '0';
        popup.element.style.transform = 'translateY(-10px)';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (popup.element && document.body.contains(popup.element)) {
                document.body.removeChild(popup.element);
            }
            
            // Remove from array
            this.popups.splice(index, 1);
            
            // Reposition remaining popups
            this.positionPopups();
        }, 300);
    }
    
    hideNow(popupId = null) {
        if (popupId) {
            // Remove specific popup
            this.removePopup(popupId);
        } else {
            // Remove all popups
            this.popups.forEach(popup => {
                if (popup.timeout) {
                    clearTimeout(popup.timeout);
                }
                if (popup.element && document.body.contains(popup.element)) {
                    document.body.removeChild(popup.element);
                }
            });
            this.popups = [];
        }
    }
    
    // Get current number of visible popups
    getPopupCount() {
        return this.popups.length;
    }
    
    // Update an existing popup (if needed)
    updatePopup(popupId, newMessageOrArray) {
        const popup = this.popups.find(p => p.id === popupId);
        if (!popup) return;
        
        // Clear existing timeout
        if (popup.timeout) {
            clearTimeout(popup.timeout);
        }
        
        // Update content
        let content;
        if (Array.isArray(newMessageOrArray)) {
            content = this.parseColoredArray(newMessageOrArray);
        } else {
            content = `<span style="color: #${specialTextColor}">${this.escapeHtml(newMessageOrArray)}</span>`;
        }
        
        popup.element.innerHTML = content;
        
        // Reset timeout
        popup.timeout = setTimeout(() => {
            this.removePopup(popupId);
        }, this.defaultDuration);
        
        // Bring to front
        popup.element.style.zIndex = this.nextZIndex++;
        
        // Reposition
        this.positionPopups();
    }
}
const popup = new PopupManager();
// Add helper function for colored messages
window.showColoredPopup = function(partsArray, seconds = secondsPopupShown) {
    return popup.show(partsArray, seconds);
};
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
        popup.show([`white=${title} check = ${roll.toString()} ${symbol} ${Math.abs(mod).toString()} = `, `${specialTextColor}=${Math.max((roll + mod), 1).toString()}`]);
    } else
        popup.show([`white=${title} check = `, `${specialTextColor}=${roll.toString()}`]);
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
        popup.show([`white=${formula} = `, `${specialTextColor}=${Math.max((result + extra), 1).toString()}`]);
    } else if(formula.includes('to hit')) {
        let newFormula = formula;
        let numberStr = newFormula.replace('to hit', '').trim();
        if(numberStr.includes('+')) {
            numberStr = numberStr.replace('+', '').trim();
            let number = parseInt(numberStr);
            let roll = rollDie(20);
            if(roll == 1) popup.show([`red=Nat 1`]);
            else if(roll == 20) popup.show([`green=Nat 20!`]);
            else popup.show([`white=${roll.toString()} + ${number.toString()} = `, `${specialTextColor}=${(roll + number).toString()}`]);
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
async function loadSoundBoard() {
    const soundboardContainer = document.getElementById('soundboard-container');
    if (!soundboardContainer)
        return null;
    const jsonData = JSON.parse(localStorage.getItem('soundboard'));
    
    // Create a container div
    const container = document.createElement('div');
    container.className = 'soundboard-container';
    
    // Object to track currently playing sounds
    const playingSounds = {};
    
    // Object to store volume controls
    const volumeControls = {};
    
    // Object to track category sequences
    const categorySequences = {};
    
    // Object to track category playback state
    const categoryPlayback = {};
    
    // Main volume (global multiplier)
    let mainVolume = 1.0;
    const savedMainVolume = localStorage.getItem('mainVolume');
    if (savedMainVolume !== null) {
        mainVolume = parseFloat(savedMainVolume);
    }
    
    // Function to save main volume to localStorage
    const saveMainVolume = (volume) => {
        localStorage.setItem('mainVolume', volume.toString());
    };
    
    // Function to save volume to localStorage
    const saveVolume = (soundId, volume) => {
        const volumes = JSON.parse(localStorage.getItem('soundVolumes') || '{}');
        volumes[soundId] = volume;
        localStorage.setItem('soundVolumes', JSON.stringify(volumes));
    };
    
    // Function to get volume from localStorage
    const getVolume = (soundId) => {
        const volumes = JSON.parse(localStorage.getItem('soundVolumes') || '{}');
        return volumes[soundId] !== undefined ? volumes[soundId] : 1.0;
    };
    
    // Function to get all loopable sounds in a category
    const getLoopWithinCategorySounds = (category) => {
        const categoryData = jsonData.categories.find(c => c.name === category);
        if (!categoryData) return [];
        
        return categoryData.sounds.filter(sound => 
            sound.loopWithinCategory === true
        );
    };
    
    // Function to get a random sound from sequence (for random starting point)
    const getRandomSoundFromSequence = (sequence) => {
        if (!sequence || sequence.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * sequence.length);
        return {
            sound: sequence[randomIndex],
            index: randomIndex
        };
    };
    
    // Function to get next sound in category sequence
    const getNextSoundInCategorySequence = (category, currentSoundId) => {
        const playback = categoryPlayback[category];
        if (!playback || !playback.sequence || playback.sequence.length === 0) return null;
        
        const currentIndex = playback.sequence.findIndex(sound => sound.sound === currentSoundId);
        if (currentIndex === -1) return playback.sequence[0];
        
        const nextIndex = (currentIndex + 1) % playback.sequence.length;
        return {
            sound: playback.sequence[nextIndex],
            index: nextIndex
        };
    };
    
    // Function to stop sounds by their IDs
    const stopSoundsByIds = (soundIds) => {
        soundIds.forEach(soundId => {
            if (playingSounds[soundId]) {
                const audio = playingSounds[soundId];
                audio.pause();
                audio.currentTime = 0;
                
                const button = document.querySelector(`[data-sound-id="${soundId}"]`);
                if (button) {
                    button.classList.remove('playing');
                    button.classList.remove('sequence-playing');
                    button.dataset.hasSequenceListener = 'false';
                }
                
                delete playingSounds[soundId];
            }
        });
    };
    
    // Function to stop category playback
    const stopCategoryPlayback = (category) => {
        if (categoryPlayback[category]) {
            const currentSoundId = categoryPlayback[category].currentSoundId;
            if (currentSoundId && playingSounds[currentSoundId]) {
                const audio = playingSounds[currentSoundId];
                audio.pause();
                audio.currentTime = 0;
                
                const button = document.querySelector(`[data-sound-id="${currentSoundId}"]`);
                if (button) {
                    button.classList.remove('playing');
                    button.classList.remove('sequence-playing');
                    button.dataset.hasSequenceListener = 'false';
                }
                
                delete playingSounds[currentSoundId];
            }
            
            clearTimeout(categoryPlayback[category].nextSoundTimeout);
            delete categoryPlayback[category];
        }
    };
    
    // Function to stop all sounds in a category
    const stopSoundsInCategory = (categoryName, excludeSoundId = null) => {
        Object.keys(playingSounds).forEach(soundId => {
            const control = volumeControls[soundId];
            if (control && control.category === categoryName && soundId !== excludeSoundId) {
                const audio = playingSounds[soundId];
                audio.pause();
                audio.currentTime = 0;
                
                const button = document.querySelector(`[data-sound-id="${soundId}"]`);
                if (button) {
                    button.classList.remove('playing');
                    button.classList.remove('sequence-playing');
                    button.dataset.hasSequenceListener = 'false';
                }
                
                delete playingSounds[soundId];
            }
        });
    };
    
    // Function to play a specific sound in a category sequence
    const playSoundInCategorySequence = (category, sound, index) => {
        const button = document.querySelector(`[data-sound-id="${sound.sound}"]`);
        if (!button) return;
        
        // Create a fresh audio element to avoid loop interference
        const soundUrl = `${githubRoot}/sound_effects/${sound.sound}.mp3`;
        const audio = new Audio(soundUrl);
        
        // Set volume from saved setting and apply main volume
        const control = volumeControls[sound.sound];
        if (control) {
            const effectiveVolume = Math.min(1.0, Math.max(0, control.volume * mainVolume));
            audio.volume = effectiveVolume;
        }
        
        // Disable loop for sequence sounds
        audio.loop = false;
        
        // Remove any existing sequence listener from this button
        if (button.dataset.hasSequenceListener === 'true') {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        }
        
        // Play the sound
        audio.play();
        playingSounds[sound.sound] = audio;
        
        // Update category playback state
        categoryPlayback[category].currentSoundId = sound.sound;
        categoryPlayback[category].currentIndex = index;
        
        // Update button appearance
        const currentButton = document.querySelector(`[data-sound-id="${sound.sound}"]`);
        if (currentButton) {
            currentButton.classList.add('playing');
            currentButton.classList.add('sequence-playing');
        }
        
        // Set up ending handler
        const onEnded = () => {
            // Clean up current sound
            if (playingSounds[sound.sound]) {
                delete playingSounds[sound.sound];
            }
            
            const currentButton = document.querySelector(`[data-sound-id="${sound.sound}"]`);
            if (currentButton) {
                currentButton.classList.remove('playing');
                currentButton.classList.remove('sequence-playing');
                currentButton.dataset.hasSequenceListener = 'false';
            }
            
            // Play next sound in sequence after a short delay
            if (categoryPlayback[category]) {
                const nextSound = getNextSoundInCategorySequence(category, sound.sound);
                if (nextSound) {
                    categoryPlayback[category].nextSoundTimeout = setTimeout(() => {
                        playSoundInCategorySequence(category, nextSound.sound, nextSound.index);
                    }, 500); // 500ms delay between sounds
                }
            }
        };
        
        audio.addEventListener('ended', onEnded, { once: true });
        
        // Mark button as having sequence listener
        if (currentButton) {
            currentButton.dataset.hasSequenceListener = 'true';
        }
    };
    
    // Function to start category sequence playback with random starting point
    const startCategorySequence = (category) => {
        // Stop any existing category playback
        stopCategoryPlayback(category);
        
        const sequence = categorySequences[category];
        if (!sequence || sequence.length === 0) return;
        
        // Get random starting sound
        const randomStart = getRandomSoundFromSequence(sequence);
        
        // Set up category playback tracking
        categoryPlayback[category] = {
            sequence: sequence,
            currentSoundId: randomStart.sound.sound,
            currentIndex: randomStart.index,
            nextSoundTimeout: null
        };
        
        // Play the random starting sound
        playSoundInCategorySequence(category, randomStart.sound, randomStart.index);
    };
    
    // Function to create volume indicator
    const createVolumeIndicator = (button, currentVolume, isMainVolume = false) => {
        // Remove existing indicator if present
        const existingIndicator = button.querySelector('.volume-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create volume indicator container
        const indicator = document.createElement('div');
        indicator.className = 'volume-indicator';
        indicator.style.cssText = `
            position: absolute;
            left: 100%;
            top: 0;
            margin-left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 8px;
            border-radius: 6px;
            z-index: 100;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 120px;
        `;
        
        // Create volume bar container
        const volumeBarContainer = document.createElement('div');
        volumeBarContainer.style.cssText = `
            width: 80px;
            height: 20px;
            background: #555;
            border-radius: 3px;
            overflow: hidden;
            position: relative;
        `;
        
        // Create volume fill
        const volumeFill = document.createElement('div');
        volumeFill.className = 'volume-fill';
        volumeFill.style.cssText = `
            height: 100%;
            width: ${currentVolume * 100}%;
            background: linear-gradient(90deg, ${isMainVolume ? '#FF9800, #FFB74D' : '#4CAF50, #8BC34A'});
            transition: width 0.1s ease;
        `;
        
        // Create volume percentage text
        const volumeText = document.createElement('span');
        volumeText.className = 'volume-text';
        volumeText.style.cssText = `
            color: white;
            font-size: 12px;
            font-weight: bold;
            min-width: 30px;
            text-align: center;
        `;
        volumeText.textContent = `${Math.round(currentVolume * 100)}%`;
        
        // Assemble the indicator
        volumeBarContainer.appendChild(volumeFill);
        indicator.appendChild(volumeBarContainer);
        indicator.appendChild(volumeText);
        
        // Add to button
        button.style.position = 'relative';
        button.appendChild(indicator);
        
        // Set timeout to remove indicator
        const removeTimeout = setTimeout(() => {
            if (indicator.parentElement) {
                indicator.remove();
            }
        }, 1500); // Remove after 1.5 seconds
        
        // Store timeout reference
        indicator.dataset.removeTimeout = removeTimeout;
        
        return {
            indicator,
            volumeFill,
            volumeText
        };
    };
    
    // Function to update volume indicator
    const updateVolumeIndicator = (button, volume, isMainVolume = false) => {
        const indicator = button.querySelector('.volume-indicator');
        if (!indicator) return;
        
        // Reset removal timeout
        if (indicator.dataset.removeTimeout) {
            clearTimeout(parseInt(indicator.dataset.removeTimeout));
        }
        
        const volumeFill = indicator.querySelector('.volume-fill');
        const volumeText = indicator.querySelector('.volume-text');
        
        if (volumeFill) {
            volumeFill.style.width = `${volume * 100}%`;
            volumeFill.style.background = `linear-gradient(90deg, ${isMainVolume ? '#FF9800, #FFB74D' : '#4CAF50, #8BC34A'})`;
        }
        if (volumeText) {
            volumeText.textContent = `${Math.round(volume * 100)}%`;
        }
        
        // Set new timeout
        const newTimeout = setTimeout(() => {
            if (indicator.parentElement) {
                indicator.remove();
            }
        }, 1500);
        
        indicator.dataset.removeTimeout = newTimeout;
    };
    
    // Function to update all playing sounds' volumes with main volume
    const updateAllPlayingVolumes = () => {
        Object.keys(playingSounds).forEach(soundId => {
            const audio = playingSounds[soundId];
            const control = volumeControls[soundId];
            if (audio && control) {
                audio.volume = Math.min(1.0, Math.max(0, control.volume * mainVolume));
            }
        });
    };
    
    // Function to stop all playing sounds
    const stopAllSounds = () => {
        // Stop all category playback
        Object.keys(categoryPlayback).forEach(category => {
            stopCategoryPlayback(category);
        });
        
        // Stop all individual sounds
        Object.keys(playingSounds).forEach(soundId => {
            const audio = playingSounds[soundId];
            audio.pause();
            audio.currentTime = 0;
            
            const button = document.querySelector(`[data-sound-id="${soundId}"]`);
            if (button) {
                button.classList.remove('playing');
                button.classList.remove('sequence-playing');
                button.dataset.hasSequenceListener = 'false';
            }
        });
        
        // Clear the playingSounds object
        Object.keys(playingSounds).forEach(key => delete playingSounds[key]);
    };
    
    // First pass: Build category sequences and volume controls
    jsonData.categories.forEach(category => {
        // Build sequences for categories with loopWithinCategory sounds
        const loopWithinCategorySounds = getLoopWithinCategorySounds(category.name);
        if (loopWithinCategorySounds.length > 1) {
            categorySequences[category.name] = loopWithinCategorySounds;
        }
        
        // Initialize volume controls for each sound
        category.sounds.forEach(sound => {
            // Get initial volume from sound property (0-100, convert to 0-1)
            const initialVolume = sound.initialVolume !== undefined ? 
                Math.min(100, Math.max(0, sound.initialVolume)) / 100 : 1.0;
            
            // Get saved volume or use initial volume
            const savedVolume = getVolume(sound.sound);
            const finalVolume = savedVolume !== 1.0 ? savedVolume : initialVolume;
            
            // Save initial volume if it's different from default
            if (initialVolume !== 1.0 && savedVolume === 1.0) {
                saveVolume(sound.sound, initialVolume);
            }
            
            volumeControls[sound.sound] = {
                volume: finalVolume,
                isInSequence: sound.loopWithinCategory || false,
                category: category.name,
                exclusiveInCategory: sound.exclusiveInCategory || false,
                exclusiveWith: sound.exclusiveWith || []
            };
        });
    });
    
    // Create category sections
    jsonData.categories.forEach(category => {
        // Create category container
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-container';
        categoryDiv.dataset.categoryName = category.name;
        
        // Create category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        
        // Add category title with click handler for sequences
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category.name;
        
        // Add sequence indicator if category has loop sequence
        if (categorySequences[category.name]) {
            const sequenceIndicator = document.createElement('span');
            sequenceIndicator.className = 'sequence-indicator';
            sequenceIndicator.textContent = ' 🔄';
            sequenceIndicator.title = `Click to play ${categorySequences[category.name].length} sounds in random sequence`;
            categoryTitle.appendChild(sequenceIndicator);
            
            // Make the entire category title clickable for sequence playback
            categoryTitle.classList.add('clickable-category');
            categoryTitle.addEventListener('click', function(e) {
                e.stopPropagation();
                if (categoryPlayback[category.name]) {
                    // If category is currently playing, stop it
                    stopCategoryPlayback(category.name);
                    this.classList.remove('playing');
                } else {
                    // Start the category sequence with random starting point
                    startCategorySequence(category.name);
                    this.classList.add('playing');
                }
            });
        }
        
        categoryHeader.appendChild(categoryTitle);
        categoryDiv.appendChild(categoryHeader);
        
        // Create button container for this category
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        
        // Create buttons for each sound in this category
        category.sounds.forEach(sound => {
            // Create sound URL
            const soundUrl = `${githubRoot}/sound_effects/${sound.sound}.mp3`;
            
            // Create audio element (will be recreated for sequence playback)
            const audio = new Audio(soundUrl);
            audio.loop = sound.loopable;
            
            // Set volume from saved setting and apply main volume
            const control2 = volumeControls[sound.sound];
            if (control2) {
                const effectiveVolume = Math.min(1.0, Math.max(0, control2.volume * mainVolume));
                audio.volume = effectiveVolume;
            }
            
            // Create button
            const button = document.createElement('button');
            button.className = 'sound-button';
            button.dataset.soundId = sound.sound;
            button.dataset.category = category.name;
            
            // Add indicators based on properties
            if (sound.loopWithinCategory) {
                button.dataset.inSequence = 'true';
            }
            if (sound.exclusiveInCategory) {
                button.dataset.exclusiveCategory = 'true';
            }
            if (sound.exclusiveWith && sound.exclusiveWith.length > 0) {
                button.dataset.exclusiveWith = JSON.stringify(sound.exclusiveWith);
            }
            
            // Process icon URL
            let iconUrl = sound.icon;
            
            // Extract custom size if present
            let iconSize = 50;
            const sizeMatch = sound.icon.match(/customSize\/(\d+)/);
            if (sizeMatch && sizeMatch[1]) {
                iconSize = parseInt(sizeMatch[1]);
            }
            
            // Extract custom color if present
            let iconColor = '1A1A1A';
            const colorMatch = sound.icon.match(/customColor\/([A-Fa-f0-9]{6})/);
            if (colorMatch && colorMatch[1]) {
                iconColor = colorMatch[1];
            }
            
            // Create the final icon URL
            iconUrl = sound.icon.replace('customSize', iconSize.toString())
                               .replace('customColor', iconColor);
            // Remove query parameters
            iconUrl = iconUrl.split('??')[0];
            
            // Create icon
            const icon = document.createElement('img');
            icon.width = iconSize;
            icon.height = iconSize;
            icon.src = iconUrl;
            icon.alt = sound.sound;
            
            // Add icon to button
            button.appendChild(icon);
            
            // Store audio reference on button
            button.dataset.audioId = sound.sound;
            
            // Mouse wheel event for volume control
            button.addEventListener('wheel', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const soundId = this.dataset.soundId;
                const control = volumeControls[soundId];
                if (!control) return;
                
                // Calculate new volume
                let newVolume = control.volume;
                if (e.deltaY < 0) {
                    // Scrolling up - increase volume
                    newVolume = Math.min(1.0, control.volume + 0.05);
                } else {
                    // Scrolling down - decrease volume
                    newVolume = Math.max(0.0, control.volume - 0.05);
                }
                
                // Update volume
                control.volume = newVolume;
                
                // Save to localStorage
                saveVolume(soundId, newVolume);
                
                // Update audio volume if it exists (with main volume)
                if (playingSounds[soundId]) {
                    playingSounds[soundId].volume = newVolume * mainVolume;
                }
                
                // Update or create volume indicator
                const existingIndicator = this.querySelector('.volume-indicator');
                if (existingIndicator) {
                    updateVolumeIndicator(this, newVolume);
                } else {
                    createVolumeIndicator(this, newVolume);
                }
            });
            
            // Mouse enter/leave events for volume indicator
            let indicatorTimeout;
            button.addEventListener('mouseenter', function() {
                // Clear any pending removal
                if (indicatorTimeout) {
                    clearTimeout(indicatorTimeout);
                }
            });
            
            button.addEventListener('mouseleave', function() {
                const indicator = this.querySelector('.volume-indicator');
                if (indicator) {
                    // Set removal timeout when mouse leaves
                    indicatorTimeout = setTimeout(() => {
                        if (indicator.parentElement) {
                            indicator.remove();
                        }
                    }, 500);
                }
            });
            
            // Left click to play/pause individual sound
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const soundId = this.dataset.soundId;
                const currentAudio = playingSounds[soundId];
                const control = volumeControls[soundId];
                
                // If category sequence is playing and this is a sequence sound, stop the sequence first
                if (categoryPlayback[category.name] && control?.isInSequence) {
                    stopCategoryPlayback(category.name);
                    const categoryTitle = this.closest('.category-container').querySelector('h3');
                    if (categoryTitle) categoryTitle.classList.remove('playing');
                }
                
                if (currentAudio && !currentAudio.paused) {
                    // Pause if already playing
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    this.classList.remove('playing');
                    this.classList.remove('sequence-playing');
                    delete playingSounds[soundId];
                } else {
                    // Handle exclusive behaviors BEFORE playing
                    if (control?.exclusiveInCategory) {
                        // Stop all other sounds in the same category
                        stopSoundsInCategory(category.name, soundId);
                    }
                    
                    // Handle exclusiveWith sounds
                    if (control?.exclusiveWith && control.exclusiveWith.length > 0) {
                        stopSoundsByIds(control.exclusiveWith);
                    }
                    
                    // Create a fresh audio element
                    const newAudio = new Audio(soundUrl);
                    newAudio.loop = sound.loopable;
                    
                    // Get volume from controls and apply main volume
                    if (control) {
                        const effectiveVolume = Math.min(1.0, Math.max(0, control.volume * mainVolume));
                        newAudio.volume = effectiveVolume;
                    }
                    
                    // Play this sound
                    newAudio.play();
                    playingSounds[soundId] = newAudio;
                    this.classList.add('playing');
                    
                    // Handle sound ending for non-loopable sounds
                    if (!sound.loopable) {
                        const onEnded = () => {
                            this.classList.remove('playing');
                            this.classList.remove('sequence-playing');
                            delete playingSounds[soundId];
                        };
                        newAudio.addEventListener('ended', onEnded, { once: true });
                    }
                }
            });
            
            // Right click to stop individual sound
            button.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const soundId = this.dataset.soundId;
                const currentAudio = playingSounds[soundId];
                
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    this.classList.remove('playing');
                    this.classList.remove('sequence-playing');
                    delete playingSounds[soundId];
                    
                    // If this sound was part of category playback, stop the category sequence
                    const control = volumeControls[soundId];
                    if (control?.isInSequence && categoryPlayback[category.name]) {
                        stopCategoryPlayback(category.name);
                        const categoryTitle = this.closest('.category-container').querySelector('h3');
                        if (categoryTitle) categoryTitle.classList.remove('playing');
                    }
                }
            });
            
            // Build tooltip
            let tooltipText = `${sound.sound}`;
            
            // Add volume info
            const control3 = volumeControls[sound.sound];
            if (control3) {
                tooltipText += `\nVolume: ${Math.round(control3.volume * 100)}%`;
            }
            
            // Add property info
            const properties = [];
            if (sound.loopWithinCategory) {
                properties.push('Part of category sequence');
            }
            if (sound.loopable) {
                properties.push('Loopable');
            }
            if (sound.exclusiveInCategory) {
                properties.push('Exclusive in category');
            }
            if (sound.exclusiveWith && sound.exclusiveWith.length > 0) {
                properties.push(`Exclusive with: ${sound.exclusiveWith.join(', ')}`);
            }
            
            if (properties.length > 0) {
                tooltipText += '\n' + properties.join(' • ');
            }
            
            // Add controls info
            tooltipText += '\nLeft click: Play/Pause';
            tooltipText += '\nRight click: Stop';
            tooltipText += '\nScroll wheel: Adjust volume';
            
            button.title = tooltipText;
            
            buttonContainer.appendChild(button);
        });
        
        categoryDiv.appendChild(buttonContainer);
        container.appendChild(categoryDiv);
    });
    
    // Create main volume control section
    const mainVolumeContainer = document.createElement('div');
    mainVolumeContainer.className = 'main-volume-container';
    mainVolumeContainer.style.cssText = `
        text-align: center;
        margin-bottom: 20px;
        padding: 10px;
        background-color: #f9f9f9;
        border-radius: 8px;
    `;
    
    const mainVolumeLabel = document.createElement('div');
    mainVolumeLabel.textContent = `Main Volume: ${Math.round(mainVolume * 100)}%`;
    mainVolumeLabel.style.cssText = `
        font-weight: bold;
        margin-bottom: 5px;
        font-size: 14px;
    `;
    mainVolumeContainer.appendChild(mainVolumeLabel);
    
    const stopAllButton = document.createElement('button');
    stopAllButton.textContent = '⏹️ Stop All Sounds';
    stopAllButton.className = 'stop-all-button';
    stopAllButton.title = `Left click: Stop all sounds\nScroll wheel: Adjust main volume (currently ${Math.round(mainVolume * 100)}%)`;
    
    // Mouse wheel on stop button adjusts main volume
    stopAllButton.addEventListener('wheel', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Calculate new main volume
        let newMainVolume = mainVolume;
        if (e.deltaY < 0) {
            // Scrolling up - increase volume
            newMainVolume = Math.min(2.0, mainVolume + 0.05); // Allow up to 200%
        } else {
            // Scrolling down - decrease volume
            newMainVolume = Math.max(0.0, mainVolume - 0.05);
        }
        
        // Update main volume
        mainVolume = newMainVolume;
        saveMainVolume(mainVolume);
        
        // Update all playing sounds
        updateAllPlayingVolumes();
        
        // Update label
        mainVolumeLabel.textContent = `Main Volume: ${Math.round(mainVolume * 100)}%`;
        stopAllButton.title = `Left click: Stop all sounds\nScroll wheel: Adjust main volume (currently ${Math.round(mainVolume * 100)}%)`;
        
        // Update or create volume indicator
        const existingIndicator = this.querySelector('.volume-indicator');
        if (existingIndicator) {
            updateVolumeIndicator(this, newMainVolume, true);
        } else {
            createVolumeIndicator(this, newMainVolume, true);
        }
    });
    
    // Left click still stops all sounds
    stopAllButton.addEventListener('click', stopAllSounds);
    
    // Mouse enter/leave for main volume indicator
    let mainVolumeIndicatorTimeout;
    stopAllButton.addEventListener('mouseenter', function() {
        if (mainVolumeIndicatorTimeout) {
            clearTimeout(mainVolumeIndicatorTimeout);
        }
    });
    
    stopAllButton.addEventListener('mouseleave', function() {
        const indicator = this.querySelector('.volume-indicator');
        if (indicator) {
            mainVolumeIndicatorTimeout = setTimeout(() => {
                if (indicator.parentElement) {
                    indicator.remove();
                }
            }, 500);
        }
    });
    
    mainVolumeContainer.appendChild(stopAllButton);
    container.insertBefore(mainVolumeContainer, container.firstChild);
    
    soundboardContainer.appendChild(container);
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
        .soundboard-container {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .main-volume-container {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }
        
        .stop-all-button {
            display: block;
            margin: 0 auto;
            padding: 10px 20px;
            background-color: #ff9800;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .stop-all-button:hover {
            background-color: #f57c00;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .category-container {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 8px;
        }
        
        .category-header {
            margin-bottom: 15px;
        }
        
        .category-header h3 {
            margin-top: 0;
            margin-bottom: 0;
            color: #333;
            border-bottom: 2px solid #ddd;
            padding-bottom: 5px;
        }
        
        .clickable-category {
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: all 0.2s ease;
            user-select: none;
        }
        
        .clickable-category:hover {
            color: #9C27B0;
            border-bottom-color: #9C27B0;
        }
        
        .clickable-category.playing {
            color: #9C27B0;
            font-weight: bold;
            border-bottom-color: #9C27B0;
        }
        
        .sequence-indicator {
            font-size: 14px;
            cursor: pointer;
        }
        
        .button-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .sound-button {
            background: white;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .sound-button:hover {
            border-color: #1A1A1A;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .sound-button.playing {
            border-color: #4CAF50;
            background-color: #f0fff0;
        }
        
        .sound-button.sequence-playing {
            border-color: #9C27B0;
            background-color: #F3E5F5;
        }
        
        .sound-button[data-in-sequence="true"] {
            border-style: dashed;
            border-color: #9C27B0;
        }
        
        .sound-button[data-in-sequence="true"].playing {
            border-color: #9C27B0;
        }
        
        .sound-button[data-exclusive-category="true"] {
            border-left: 4px solid #FF5722;
        }
        
        .sound-button[data-exclusive-with] {
            border-right: 4px solid #FF5722;
        }
        
        .sound-button img {
            display: block;
        }
        
        /* Volume indicator styles */
        .volume-indicator {
            position: absolute;
            left: 100%;
            top: 0;
            margin-left: 10px;
            background: rgba(0, 0, 0, 0.9);
            padding: 8px;
            border-radius: 6px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 120px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .volume-indicator::before {
            content: '';
            position: absolute;
            left: -6px;
            top: 50%;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            border-right: 6px solid rgba(0, 0, 0, 0.9);
        }
        
        .volume-indicator .volume-fill {
            height: 100%;
            transition: width 0.1s ease;
            border-radius: 2px;
        }
        
        .volume-indicator .volume-text {
            color: white;
            font-size: 12px;
            font-weight: bold;
            min-width: 30px;
            text-align: center;
            font-family: monospace;
        }
        
        /* Sequence animation for category sequence sounds */
        @keyframes sequencePulse {
            0% { box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(156, 39, 176, 0); }
            100% { box-shadow: 0 0 0 0 rgba(156, 39, 176, 0); }
        }
        
        .sound-button.sequence-playing {
            animation: sequencePulse 2s infinite;
        }
    `;
    document.head.appendChild(style);
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
        ac: data.armorClass.split('(')[0] || 10,
        hp: hp,
        maxHp: hp,
        tempHp: '0',
        conditions: '',
        notes: '',
        type: 'creature',
        sourceKey: selectedValue,
        whenDamagedReminder: data.whenDamagedReminder,
        whenAllyDiesReminder: data.whenAllyDiesReminder,
        whenEnemyDiesReminder: data.whenEnemyDiesReminder,
        color: '#dc2626',
        textColor: 'white',
        stabilized: false,
        damageVulnerabilities: data.damageVulnerabilities || [],
        damageResistances: data.damageResistances || [],
        damageImmunities: data.damageImmunities || [],
        conditionImmunities: data.conditionImmunities || []
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
// Enhanced applyDamage function to handle damage types
function applyDamageWithType(rowData, damageType, damageAmount) {
    const vulnerabilities = rowData.damageVulnerabilities || [];
    const resistances = rowData.damageResistances || [];
    const immunities = rowData.damageImmunities || [];
    
    let finalDamage = parseInt(damageAmount);
    
    // Apply damage type modifiers
    if (immunities.includes(damageType)) {
        finalDamage = 0;
        popup.show(`${rowData.name} is immune to ${damageType} damage!`, 3);
    } else if (resistances.includes(damageType)) {
        finalDamage = Math.floor(finalDamage / 2);
        if (finalDamage > 0) {
            popup.show(`${rowData.name} is resistant to ${damageType} damage. Damage halved: ${damageAmount} → ${finalDamage}`, 3);
        }
    } else if (vulnerabilities.includes(damageType)) {
        finalDamage = finalDamage * 2;
        popup.show(`${rowData.name} is vulnerable to ${damageType} damage. Damage doubled: ${damageAmount} → ${finalDamage}`, 3);
    }
    
    // Apply the damage using existing applyDamage function
    return applyDamage(rowData, finalDamage);
}
// Function to create the damage type modal
function createDamageTypeModal(rowData, callback) {
    // Check if modal already exists
    const existingModal = document.querySelector('.damage-type-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    const modal = document.createElement('div');
    modal.className = 'damage-type-modal';
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
        z-index: 1001;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-width: 500px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    // Title
    const title = document.createElement('h3');
    title.textContent = `Apply Damage to ${rowData.name}`;
    title.style.marginTop = '0';
    title.style.marginBottom = '15px';
    title.style.textAlign = 'center';
    
    // Damage types grid
    const damageGrid = document.createElement('div');
    damageGrid.style.display = 'grid';
    damageGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    damageGrid.style.gap = '10px';
    damageGrid.style.marginBottom = '20px';
    
    // Get resistance/immunity/vulnerability info
    const vulnerabilities = rowData.damageVulnerabilities || [];
    const resistances = rowData.damageResistances || [];
    const immunities = rowData.damageImmunities || [];
    
    // Damage amount input
    const inputContainer = document.createElement('div');
    inputContainer.style.marginTop = '20px';
    
    const inputLabel = document.createElement('div');
    inputLabel.textContent = 'Damage Amount:';
    inputLabel.style.marginBottom = '5px';
    inputLabel.style.fontWeight = 'bold';
    
    const damageInput = document.createElement('input');
    damageInput.type = 'number';
    damageInput.min = '0';
    damageInput.value = '0';
    damageInput.style.cssText = `
        width: 100%;
        padding: 10px;
        margin-bottom: 10px;
        font-size: 16px;
        box-sizing: border-box;
    `;
    
    // Status display
    const statusDisplay = document.createElement('div');
    statusDisplay.className = 'damage-status-display';
    statusDisplay.style.cssText = `
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
        background-color: #f8f9fa;
        font-size: 14px;
        display: none;
    `;
    
    let selectedDamageType = null;
    
    // Load damage type icons from your existing icons map
    fetchMapIfNotSet('icons').then(() => {
        damageTypes.forEach(damageType => {
            const damageButton = document.createElement('button');
            damageButton.className = 'damage-type-button';
            
            // Determine button style based on creature's properties
            let backgroundColor = '#4a5568'; // Default
            let borderColor = '#4a5568';
            let titleText = damageType;
            
            if (immunities.includes(damageType)) {
                backgroundColor = '#dc2626'; // Red for immune
                borderColor = '#dc2626';
                titleText += ' (Immune)';
            } else if (resistances.includes(damageType)) {
                backgroundColor = '#d97706'; // Orange for resistant
                borderColor = '#d97706';
                titleText += ' (Resistant)';
            } else if (vulnerabilities.includes(damageType)) {
                backgroundColor = '#059669'; // Green for vulnerable
                borderColor = '#059669';
                titleText += ' (Vulnerable)';
            }
            
            damageButton.style.cssText = `
                padding: 10px;
                border: 2px solid ${borderColor};
                background: ${backgroundColor};
                color: white;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                transition: all 0.2s;
                min-height: 70px;
            `;
            
            // Get icon from your existing icons map
            let iconData = window.icons.get(damageType.toLowerCase());
            let iconUrl = '';
            let iconAlt = '';
            
            if (iconData) {
                iconUrl = iconData.split('||')[0].replace('customColor', iconColor);
                iconAlt = iconData.includes('||') ? iconData.split('||')[1] : '';
            }
            
            damageButton.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 5px;">
                    <img width="24" height="24" src="${iconUrl}" alt="${iconAlt}"/>
                </div>
                <div>${damageType}</div>
            `;
            
            damageButton.title = titleText;
            
            damageButton.addEventListener('click', () => {
                // Remove selection from all buttons
                damageGrid.querySelectorAll('.damage-type-button').forEach(btn => {
                    const originalColor = btn.style.borderColor;
                    btn.style.background = originalColor;
                    btn.style.boxShadow = 'none';
                });
                
                // Select this button
                damageButton.style.boxShadow = '0 0 0 2px white, 0 0 0 4px ' + borderColor;
                selectedDamageType = damageType;
                
                // Show status info
                updateStatusDisplay(damageType);
                
                // Focus the input
                damageInput.focus();
                damageInput.select();
            });
            
            damageGrid.appendChild(damageButton);
        });
    });
    
    function updateStatusDisplay(damageType) {
        let statusText = `Selected: ${damageType}`;
        let backgroundColor = '#f8f9fa';
        
        if (immunities.includes(damageType)) {
            statusText += ' - IMMUNE (no damage)';
            backgroundColor = '#fee2e2';
        } else if (resistances.includes(damageType)) {
            statusText += ' - RESISTANT (half damage, rounded down)';
            backgroundColor = '#ffedd5';
        } else if (vulnerabilities.includes(damageType)) {
            statusText += ' - VULNERABLE (double damage)';
            backgroundColor = '#d1fae5';
        }
        
        statusDisplay.textContent = statusText;
        statusDisplay.style.backgroundColor = backgroundColor;
        statusDisplay.style.display = 'block';
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
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
    
    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply Damage';
    applyButton.style.backgroundColor = '#dc2626';
    applyButton.style.color = 'white';
    applyButton.disabled = true;
    
    applyButton.addEventListener('click', () => {
        if (selectedDamageType && damageInput.value) {
            const damageAmount = parseInt(damageInput.value) || 0;
            if (damageAmount > 0) {
                callback(selectedDamageType, damageAmount);
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }
        }
    });
    
    // Enable apply button when damage type is selected and input has value
    damageGrid.addEventListener('click', () => {
        if (selectedDamageType && damageInput.value && parseInt(damageInput.value) > 0) {
            applyButton.disabled = false;
        }
    });
    
    damageInput.addEventListener('input', () => {
        if (selectedDamageType && damageInput.value && parseInt(damageInput.value) > 0) {
            applyButton.disabled = false;
        } else {
            applyButton.disabled = true;
        }
    });
    
    // Allow Enter key to apply damage
    damageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && selectedDamageType && damageInput.value && parseInt(damageInput.value) > 0) {
            const damageAmount = parseInt(damageInput.value) || 0;
            if (damageAmount > 0) {
                callback(selectedDamageType, damageAmount);
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }
        }
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(applyButton);
    
    inputContainer.appendChild(inputLabel);
    inputContainer.appendChild(damageInput);
    
    modalContent.appendChild(title);
    modalContent.appendChild(damageGrid);
    modalContent.appendChild(statusDisplay);
    modalContent.appendChild(inputContainer);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
    
    return modal;
}
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
                        textColor: playerInfo.textColor,
                        stabilized: true,
                        damageVulnerabilities: playerInfo.damageVulnerabilities || [],
                        damageResistances: playerInfo.damageResistances || [],
                        damageImmunities: playerInfo.damageImmunities || [],
                        conditionImmunities: playerInfo.conditionImmunities || []
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
                    const typeOfEnemy = enemy.split('-')[1].trim().toLowerCase().replaceAll(' ', '-').replaceAll("'", '');
                    const monsterInfo = JSON.parse(localStorage.getItem(`statblocks_${typeOfEnemy}.json`));
                    for(let n=0;n<parseInt(numberOfEnemies);n++) {
                        const dexMod = Math.floor((parseInt(monsterInfo.dex) - 10) / 2);
                        const roll = Math.floor(Math.random() * 20) + 1;
                        const initiative = roll + dexMod;
                        const hp = monsterInfo.hitPoints.split('(')[0].trim();
                        const ac = monsterInfo.armorClass.split('(')[0].trim();
                        tableForData.push({
                            id: (idCounter++).toString(),
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
                            whenAllyDiesReminder: monsterInfo.whenAllyDiesReminder || '',
                            whenEnemyDiesReminder: monsterInfo.whenEnemyDiesReminder || '',
                            stabilized: false,
                            color: '#dc2626', // Red for monsters
                            damageVulnerabilities: monsterInfo.damageVulnerabilities || [],
                            damageResistances: monsterInfo.damageResistances || [],
                            damageImmunities: monsterInfo.damageImmunities || [],
                            conditionImmunities: monsterInfo.conditionImmunities || []
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
                if (option === 'Damage') {
                    showDamageModal(0, window.encounterTableData[rowIndex], (damageAmount) => {
                        const updatedStats = applyDamage(window.encounterTableData[rowIndex], damageAmount);
                        
                        if (updatedStats === null) {
                            // Monster was removed
                            window.encounterTableData.splice(rowIndex, 1);
                            renderTable();
                            return;
                        }
                        
                        window.encounterTableData[rowIndex].tempHp = updatedStats.tempHp;
                        window.encounterTableData[rowIndex].hp = updatedStats.hp;
                        window.encounterTableData[rowIndex].deathSaveSuccesses = updatedStats.deathSaveSuccesses;
                        window.encounterTableData[rowIndex].deathSaveFailures = updatedStats.deathSaveFailures;
                        window.encounterTableData[rowIndex].stabilized = updatedStats.stabilized;
                        renderTable();
                    });
                } else if (option === 'Heal') {
                    showHealingModal(0, (healAmount) => {
                        const updatedStats = applyHealing(window.encounterTableData[rowIndex], healAmount);
                        window.encounterTableData[rowIndex].hp = updatedStats.hp;
                        window.encounterTableData[rowIndex].stabilized = updatedStats.stabilized;
                        
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
                                    hpCell._textColor || 'white',
                                    data
                                );
                            }
                        }
                    });
                } else if (option === 'Add Temp HP') {
                    showTempHpModal(window.encounterTableData[rowIndex].tempHp || '0', (tempHpAmount) => {
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
                                    hpCell._textColor || 'white',
                                    data
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
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Add Temp HP';
    confirmButton.style.backgroundColor = '#eab308'; // Yellow for temp HP
    confirmButton.style.color = 'black';
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
    { name: 'Asleep', icon: 'https://img.icons8.com/sf-black/64/fefefe/sleep.png', color: '#6366f1' },
    { name: 'Blessed', icon: 'https://img.icons8.com/glyph-neue/64/fefefe/pray.png', color: '#fbbf24' },
    { name: 'Blinded', icon: 'https://img.icons8.com/sf-black-filled/64/fefefe/invisible.png', color: '#4a5568' },
    { name: 'Burning', icon: 'https://img.icons8.com/glyph-neue/64/fefefe/fire-element.png', color: '#ea580c' },
    { name: 'Bleeding', icon: 'https://img.icons8.com/ios-filled/50/fefefe/diabetes.png', color: '#8c0d0dff' },
    { name: 'Charmed', icon: 'https://img.icons8.com/ios-filled/50/fefefe/novel--v1.png', color: '#db2777' },
    { name: 'Concentrating', icon: 'https://img.icons8.com/ios-filled/50/fefefe/brain.png', color: '#8b5cf6' },
    { name: 'Cursed', icon: 'https://img.icons8.com/ios-filled/50/fefefe/evil.png', color: '#7c2d12' },
    { name: 'Deafened', icon: 'https://img.icons8.com/external-smashingstocks-glyph-smashing-stocks/50/fefefe/external-ear-medical-smashingstocks-glyph-smashing-stocks.png', color: '#7c3aed' },
    { name: 'Exhaustion', icon: 'https://img.icons8.com/external-jumpicon-glyph-ayub-irawan/32/fefefe/external-Tired-diabetes-jumpicon-(glyph)-jumpicon-glyph-ayub-irawan.png', color: '#57534e' },
    { name: 'Frightened', icon: 'https://img.icons8.com/ios-filled/50/fefefe/scream.png', color: '#dc2626' },
    { name: 'Frozen', icon: 'https://img.icons8.com/glyph-neue/64/fefefe/snowflake.png', color: '#0ea5e9' },
    { name: 'Grappled', icon: 'https://img.icons8.com/external-stick-figures-gan-khoon-lay/51/fefefe/external-choke-fighting-stick-figures-gan-khoon-lay.png', color: '#059669' },
    { name: 'Incapacitated', icon: 'https://img.icons8.com/ios-filled/50/fefefe/sleeping.png', color: '#0ea5e9' },
    { name: 'Invisible', icon: 'https://img.icons8.com/ios-filled/50/fefefe/ghost.png', color: '#6366f1' },
    { name: 'Paralyzed', icon: 'https://img.icons8.com/ios-filled/50/fefefe/pause-squared.png', color: '#8b5cf6' },
    { name: 'Petrified', icon: 'https://img.icons8.com/external-others-pike-picture/50/fefefe/external-Stone-prehistoric-others-pike-picture-4.png', color: '#78716c' },
    { name: 'Poisoned', icon: 'https://img.icons8.com/ios-filled/50/fefefe/poison-bottle.png', color: '#10b981' },
    { name: 'Prone', icon: 'https://img.icons8.com/ios-filled/50/fefefe/down.png', color: '#f59e0b' },
    { name: 'Restrained', icon: 'https://img.icons8.com/external-febrian-hidayat-glyph-febrian-hidayat/50/fefefe/external-chain-ui-essential-febrian-hidayat-glyph-febrian-hidayat.png', color: '#f97316' },
    { name: 'Stunned', icon: 'https://img.icons8.com/ios-filled/50/fefefe/faint-full-body.png', color: '#eab308' },
    { name: 'Unconscious', icon: 'https://img.icons8.com/external-regular-kawalan-studio/24/fefefe/external-unconscious-medical-regular-kawalan-studio.png', color: '#3b82f6' }
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
        min-width: 500px;
        max-width: 600px;
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
    conditionGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    conditionGrid.style.gap = '10px';
    conditionGrid.style.marginBottom = '20px';
    
    let selectedCondition = null;
    
    availableConditions.forEach(condition => {
        const conditionButton = document.createElement('button');
        conditionButton.style.cssText = `
            padding: 10px;
            border: 2px solid ${condition.color};
            background: white;
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
            
            <div style="color:${condition.color}">${condition.name}</div>
        `.replace('fefefe', condition.color.replace('#', ''));
        
        conditionButton.addEventListener('click', () => {
            // Remove selection from all buttons
            conditionGrid.querySelectorAll('button').forEach(btn => {
                btn.style.background = 'white'
                btn.style.color = btn.style.borderColor;
                const lastDivInBtn = btn.querySelector('div:last-child');
                let toInnerHtml;
                dndConditions.forEach(cond => {
                    if (lastDivInBtn && lastDivInBtn.textContent === cond.name) {
                        toInnerHtml = lastDivInBtn.innerHTML = `
                            <div style="font-size: 20px; margin-bottom: 5px;"><img width="30" height="30" src="${cond.icon}"/></div>`.replace('fefefe', cond.color.replace('#', '')) + `
                            <div>${cond.name}</div>
                        `;
                    }
                });
                btn.innerHTML = toInnerHtml;
                btn.style.fontWeight = 'normal';
            });
            
            // Select this button
            conditionButton.style.background = condition.color;
            conditionButton.style.color = 'white';
            conditionButton.innerHTML = `
                <div style="font-size: 20px; margin-bottom: 5px;"><img width="30" height="30" src="${condition.icon}"/></div>
                
                <div>${condition.name}</div>
            `;
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

    modalContent.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (selectedCondition) {
                const turns = parseInt(turnsInput.value) || 1;
                callback(selectedCondition, turns);
                document.body.removeChild(modal);
            }
        } else if (e.key === 'Escape') {
            document.body.removeChild(modal);
        }
    });

    modalContent.addEventListener('wheel', (e) => {
        turnsInput.textContent = parseInt(turnsInput.value) + (e.deltaY < 0 ? 1 : -1);
    });

    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            //document.body.removeChild(modal);
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
            //closeModal();
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
        min-width: 600px;
        max-width: 700px;
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
                <span style="font-size: 18px;"><img width="20" height="20" src="${condition.icon}" /></span>
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
    
    const closeModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    };
    
    cancelButton.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            //closeModal();
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
function createDeathSavingThrowsDisplay(successes = 0, failures = 0) {
    const container = document.createElement('div');
    container.className = 'death-saving-throws';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = '2px';
    container.style.marginLeft = '10px';
    
    // Success circles (top row)
    const successRow = document.createElement('div');
    successRow.style.display = 'flex';
    successRow.style.gap = '4px';
    
    for (let i = 0; i < 3; i++) {
        const circle = document.createElement('div');
        circle.className = 'death-save-circle success-circle';
        circle.dataset.type = 'success';
        circle.dataset.index = i;
        circle.style.width = '12px';
        circle.style.height = '12px';
        circle.style.borderRadius = '50%';
        circle.style.backgroundColor = i < successes ? '#22c55e' : '#9ca3af'; // Green if active, grey if not
        circle.style.border = '1px solid #4b5563';
        circle.style.cursor = 'pointer';
        circle.style.transition = 'background-color 0.2s';
        
        circle.addEventListener('click', function() {
            const currentColor = this.style.backgroundColor;
            if (currentColor === 'rgb(34, 197, 94)' || currentColor === '#22c55e') {
                // Already green, toggle back to grey
                this.style.backgroundColor = '#9ca3af';
                container.dataset.successes = Math.max(0, parseInt(container.dataset.successes || 0) - 1);
            } else {
                // Turn green
                this.style.backgroundColor = '#22c55e';
                container.dataset.successes = Math.min(3, parseInt(container.dataset.successes || 0) + 1);
            }
        });
        
        successRow.appendChild(circle);
    }
    
    // Failure circles (bottom row)
    const failureRow = document.createElement('div');
    failureRow.style.display = 'flex';
    failureRow.style.gap = '4px';
    
    for (let i = 0; i < 3; i++) {
        const circle = document.createElement('div');
        circle.className = 'death-save-circle failure-circle';
        circle.dataset.type = 'failure';
        circle.dataset.index = i;
        circle.style.width = '12px';
        circle.style.height = '12px';
        circle.style.borderRadius = '50%';
        circle.style.backgroundColor = i < failures ? 'darkred' : '#9ca3af'; // Red if active, grey if not
        circle.style.border = '1px solid #4b5563';
        circle.style.cursor = 'pointer';
        circle.style.transition = 'background-color 0.2s';
        
        circle.addEventListener('click', function() {
            const currentColor = this.style.backgroundColor;
            if (currentColor === 'darkred') {
                // Already red, toggle back to grey
                this.style.backgroundColor = '#9ca3af';
                container.dataset.failures = Math.max(0, parseInt(container.dataset.failures || 0) - 1);
            } else {
                // Turn red
                this.style.backgroundColor = 'darkred';
                container.dataset.failures = Math.min(3, parseInt(container.dataset.failures || 0) + 1);
            }
        });
        
        failureRow.appendChild(circle);
    }
    
    container.appendChild(successRow);
    container.appendChild(failureRow);
    
    // Store initial counts
    container.dataset.successes = successes;
    container.dataset.failures = failures;
    
    return container;
}

window.createDamageTypeModal = createDamageTypeModal;
window.applyDamageWithType = applyDamageWithType;

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
    
    const headers = ['Turn', '#', 'Name', 'AC', 'HP', 'Conditions', 'Notes'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.style.textAlign = 'center';
        headerRow.appendChild(th);
        if (headerText === 'Turn') {
            // Turn button column - add a clock icon
            const turnIcon = document.createElement('span');
            turnIcon.innerHTML = '<img width="20" height="20" src="https://img.icons8.com/ios-filled/50/FFFFFF/clock--v1.png" alt="turn"/>';
            turnIcon.title = 'Turn tracker - click to start creature\'s turn';
            th.appendChild(turnIcon);
        } else if(headerText === 'AC') {
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
        const turnCell = document.createElement('td');
        turnCell.style.cssText = `
            width: 40px;
            padding: 0 5px;
            text-align: center;
            vertical-align: middle;
        `;
        
        const radioButton = createTurnRadioButton(data);
        turnCell.appendChild(radioButton);
        row.appendChild(turnCell);
        // === ADD THESE LINES ===
        // Add color classes based on type
        let backgroundColor = 'darkblue';
        row.dataset.hp = data.hp;
        row.dataset.stabilized = data.stabilized || false;
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
                        updateCellWithHpBar(cell, data.hp, data.maxHp, data.tempHp || '0', textColor, data);
                        // Store reference to data for editing
                        cell._rowData = data;
                        cell._textColor = textColor;
                        
                        // Make cell editable
                        cell.style.cursor = 'pointer';
                        cell.classList.add('editable-cell');
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
                    idBadge.style.backgroundColor = '#364051';
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
                    const creatureSlug = data.sourceKey.replaceAll(' ', '-').replaceAll("'", '').toLowerCase();
                    link.href = `creature?name=${creatureSlug}`;
                    link.setAttribute('data-url', `creature?name=${creatureSlug}`);
                    link.setAttribute('data-text', toPrettyListName(creatureSlug));
                    link.textContent = toPrettyListName(data.sourceKey);
                    link.style.color = textColor;
                    link.style.textDecoration = 'none';
                    link.style.fontSize = '15px';
                    link.style.cursor = 'pointer';
                    
                    nameContainer.appendChild(link);
                } else {
                    const nameText = document.createElement('span');
                    nameText.textContent = data.name;
                    nameText.style.color = textColor;
                    nameContainer.appendChild(nameText);
                }
                
                // ADD DEATH SAVING THROWS FOR PLAYERS AT 0 HP
                const currentHp = parseInt(data.hp) || 0;
                const isStabilized = data.stabilized || false;
                if (data.type === 'player' && currentHp <= 0 && !isStabilized && (data.deathSaveFailures || 0) < 3) {
                    const deathSaves = createDeathSavingThrowsDisplay(
                        data.deathSaveSuccesses || 0,
                        data.deathSaveFailures || 0
                    );
                    
                    // Check all monsters to see if one needs to be reminded that an ally died
                    let reminders = [];
                    window.encounterTableData.forEach(creature => {
                        if ((creature.type === 'player') && creature.whenAllyDiesReminder) {
                            let reminder = null;
                            if (creature.whenAllyDiesReminder.includes('['))
                                reminder = [`${specialTextColor}=${creature.whenAllyDiesReminder.split(']')[0].split('[')[1].trim()} `, `white=${creature.whenAllyDiesReminder.split(']')[1].trim()}`];
                            else
                                reminder = creature.whenAllyDiesReminder;
                            if (reminder) {
                                if (!containsArray(reminders, reminder))
                                    reminders.push(reminder);
                            }
                        }
                    });
                    // Check all players to see if one needs to be reminded that an enemy died
                    window.encounterTableData.forEach(creature => {
                        if ((creature.type === 'monster' || creature.type === 'creature') && creature.whenEnemyDiesReminder) {
                            let reminder = null;
                            if (creature.whenEnemyDiesReminder.includes('['))
                                reminder = [`${specialTextColor}=${creature.whenEnemyDiesReminder.split(']')[0].split('[')[1].trim()} `, `white=${creature.whenEnemyDiesReminder.split(']')[1].trim()}`];
                            else
                                reminder = creature.whenEnemyDiesReminder;
                            if (reminder)
                                if (!containsArray(reminders, reminder))
                                    reminders.push(reminder);
                        }
                    });
                    reminders.forEach(reminder => {
                        popup.show(reminder, 10);
                    });
                    // Store reference to the row data
                    deathSaves._rowData = data;
                    
                    // Check if player should be dead or stabilized
                    deathSaves.addEventListener('click', function() {
                        setTimeout(() => {
                            const successes = parseInt(this.dataset.successes) || 0;
                            const failures = parseInt(this.dataset.failures) || 0;
                            
                            // Update data model
                            data.deathSaveSuccesses = successes;
                            data.deathSaveFailures = failures;
                            
                            // Check for death or stabilization
                            if (failures >= 3) {
                                // Player dies - remove row
                                const rowIndex = window.encounterTableData.findIndex(item => 
                                    item.id === data.id && item.name === data.name
                                );
                                if (rowIndex !== -1) {
                                    if (confirm(`${data.name} has failed 3 death saving throws. Remove from combat?`)) {
                                        window.encounterTableData.splice(rowIndex, 1);
                                        renderTable();
                                    }
                                }
                            } else if (successes >= 3) {
                                data.stabilized = true;
                                data.deathSaveSuccesses = 0;
                                data.deathSaveFailures = 0;
                                renderTable(); // Re-render to remove circles
                            }
                        }, 10);
                    });
                    
                    nameContainer.appendChild(deathSaves);

                    // Add "Dying" indicator
                    const dyingIndicator = document.createElement('span');
                    dyingIndicator.textContent = '🩸';
                    dyingIndicator.title = 'Dying - making death saving throws';
                    dyingIndicator.style.marginLeft = '5px';
                    dyingIndicator.style.fontSize = '12px';
                    nameContainer.appendChild(dyingIndicator);
                } else if (data.type === 'player' && currentHp <= 0 && isStabilized) {
                    const stabilizedIndicator = document.createElement('span');
                    stabilizedIndicator.textContent = '✅';
                    stabilizedIndicator.title = 'Stabilized (0 HP)';
                    stabilizedIndicator.style.marginLeft = '5px';
                    stabilizedIndicator.style.fontSize = '12px';
                    nameContainer.appendChild(stabilizedIndicator);
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
                updateCellWithHpBar(cell, data.hp, data.maxHp, data.tempHp, 'black', data);
            } else if (column.key === 'conditions') {
                // Add fresh event listeners
                cell.addEventListener('click', function conditionsClickHandler(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Get fresh data from the stored reference
                    const currentConditions = cell._conditionsData || parseConditions(data.conditions || '');
                    
                    showConditionAddModal(currentConditions, (selectedCondition, turns) => {
                        // Create a new array to avoid mutation issues
                        const updatedConditions = [...currentConditions];
                        
                        // Check if condition already exists
                        const existingIndex = updatedConditions.findIndex(c => c.name === selectedCondition.name);
                        
                        if (existingIndex >= 0) {
                            // Update existing condition (replace, don't add new)
                            updatedConditions[existingIndex].turns = turns;
                        } else {
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
                        }
                        
                        // Update the display
                        const displayContainer = cell;
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
    editButton.style.color = customDarkGrey;
    editButton.innerHTML = '✎'; // Pencil icon
    editButton.title = data.notes;

    // Left click - show context menu
    editButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const rowIndex = window.encounterTableData.findIndex(item => {
            if (data.type === 'player') {
                return item.name === data.name && item.type === 'player';
            } else {
                return item.id === data.id;
            }
        });
        if (rowIndex === -1) return;
        
        showContextMenu(event.clientX, event.clientY, 
            ['Damage', 'Heal', 'Add Temp HP', '---', 'Destroy'], 
            (option) => {
                if (option === 'Damage') {
                    // This is the one that's working
                    showDamageModal(0, window.encounterTableData[rowIndex], (damageAmount) => {
                        const updatedStats = applyDamage(window.encounterTableData[rowIndex], damageAmount);
                        let shouldRenderTable = false;
                        if (!updatedStats || parseInt(updatedStats.hp) === 0) {
                            // Monster was removed
                            if (data.type === 'creature' || data.type === 'monster') { 
                                console.warn('Should be removed???');
                                //window.encounterTableData.splice(rowIndex, 1);
                                renderTable();
                                // If this creature was the current turn, handle the transition
                                if (creatureWasCurrentTurn) {
                                    setTimeout(() => {
                                        handleCreatureDeathDuringTurn(creatureId);
                                    }, 10);
                                }
                                return;
                            } else {
                                shouldRenderTable = true;
                            }
                        }
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
                                    hpCell._textColor || 'white',
                                    hpCell._rowData
                                );
                                if (shouldRenderTable) {
                                    renderTable();
                                }
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
                        renderTable();
                    });
                } else if (option === 'Add Temp HP') {
                    showTempHpModal(window.encounterTableData[rowIndex].tempHp || '0', (tempHpAmount) => {
                    window.encounterTableData[rowIndex].tempHp = tempHpAmount.toString();
                    
                    const row = editButton.closest('tr');
                    if (row) {
                        const hpCell = row.querySelector('td[data-key="hp"]');
                        if (hpCell && hpCell._rowData) {
                            hpCell._rowData.tempHp = tempHpAmount.toString();
                            updateCellWithHpBar(
                                hpCell,
                                hpCell._rowData.hp,
                                hpCell._rowData.maxHp,
                                hpCell._rowData.tempHp,
                                tempHpAmount.toString(),
                                hpCell._textColor || 'white',
                                hpCell._rowData
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
        // After first render, reset the flag
        if (isInitialLoad) {
            isInitialLoad = false;
        }
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
function containsArray(arrOfArrs, target) {
    if (!Array.isArray(arrOfArrs) || !Array.isArray(target)) {
        return arrOfArrs.includes(target);
    }

    return arrOfArrs.some(
        subArr =>
            Array.isArray(subArr) &&
            subArr.length === target.length &&
            subArr.every((val, index) => val === target[index])
    );
}
// Apply damage to a creature/player (with temp HP support)
// Update applyDamage function
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
    // Get creature ID before any modifications
    const creatureId = rowData.type === 'player' ? rowData.name : rowData.id;
    console.log('>>> currentTurnCreatureId:', currentTurnCreatureId, 'creatureId:', creatureId);
    const creatureWasCurrentTurn = currentTurnCreatureId === creatureId;
    // Check if creature died
    if ((rowData.type === 'monster' || rowData.type === 'creature') && newHp <= 0) {
        console.warn(`Creature ${rowData.name} (ID: ${creatureId}) died. Was it current turn? ${creatureWasCurrentTurn}`);
        const diedCreatureId = rowData.type === 'player' ? rowData.name : rowData.id;
        // Remove monster from table
        const rowIndex = window.encounterTableData.findIndex(item => {
            if (rowData.type === 'player') {
                return item.name === rowData.name && item.type === 'player';
            } else {
                return item.id === rowData.id;
            }
        });
        if (rowIndex !== -1) {
            window.encounterTableData.splice(rowIndex, 1);
        }
        // Check all monsters to see if one needs to be reminded that an ally died
        let reminders = [];
        window.encounterTableData.forEach(creature => {
            if ((creature.type === 'monster' || creature.type === 'creature') && creature.whenAllyDiesReminder) {
                let reminder = null;
                if (creature.whenAllyDiesReminder.includes('['))
                    reminder = [`${specialTextColor}=${creature.whenAllyDiesReminder.split(']')[0].split('[')[1].trim()} `, `white=${creature.whenAllyDiesReminder.split(']')[1].trim()}`];
                else
                    reminder = creature.whenAllyDiesReminder;
                if (reminder) {
                    if (!containsArray(reminders, reminder))
                        reminders.push(reminder);
                }
            }
        });
        // Check all players to see if one needs to be reminded that an enemy died
        window.encounterTableData.forEach(creature => {
            if ((creature.type === 'player') && creature.whenEnemyDiesReminder) {
                let reminder = null;
                if (creature.whenEnemyDiesReminder.includes('['))
                    reminder = [`${specialTextColor}=${creature.whenEnemyDiesReminder.split(']')[0].split('[')[1].trim()} `, `white=${creature.whenEnemyDiesReminder.split(']')[1].trim()}`];
                else
                    reminder = creature.whenEnemyDiesReminder;
                if (reminder)
                    if (!containsArray(reminders, reminder))
                        reminders.push(reminder);
            }
        });
        reminders.forEach(reminder => {
            popup.show(reminder, 10);
        });
        // Handle turn transition if this creature was currently taking its turn
        if (currentTurnCreatureId === diedCreatureId) {
            handleCreatureDeathDuringTurn(diedCreatureId);
        }
        if (creatureWasCurrentTurn) {
            console.log(`Creature ${rowData.name} died during its turn. Handling turn transition...`);
            // We need to handle this AFTER the table is re-rendered
            // Use setTimeout to ensure the table is updated first
            setTimeout(() => {
                handleCreatureDeathDuringTurn(creatureId);
            }, 10);
        }
        return null; // Signal that row was removed
    }
    
    // For players at 0 HP, reset death saving throws
    if (rowData.type === 'player' && newHp <= 0) {
        // Reset death saving throws when reaching 0 HP
        rowData.stabilized = false;
        rowData.deathSaveSuccesses = 0;
        rowData.deathSaveFailures = 0;
    }
    return {
        tempHp: newTempHp.toString(),
        hp: newHp.toString(),
        deathSaveSuccesses: rowData.deathSaveSuccesses || 0,
        deathSaveFailures: rowData.deathSaveFailures || 0,
        stabilized: rowData.stabilized || false
    };
}

// Update applyHealing function
function applyHealing(rowData, healAmount) {
    let currentHp = parseInt(rowData.hp) || 0;
    let maxHp = parseInt(rowData.maxHp) || 0;
    let heal = parseInt(healAmount);
    
    // Heal but don't exceed max HP (temp HP doesn't count toward max)
    const newHp = Math.min(maxHp, currentHp + heal);
    
    // For players, if healed above 0 HP, clear death saving throws
    if (rowData.type === 'player' && currentHp <= 0 && newHp > 0) {
        rowData.stabilized = true;
        rowData.deathSaveSuccesses = 0;
        rowData.deathSaveFailures = 0;
    }
    
    return {
        hp: newHp.toString(),
        deathSaveSuccesses: rowData.deathSaveSuccesses || 0,
        deathSaveFailures: rowData.deathSaveFailures || 0,
        stabilized: rowData.stabilized || false
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
            const result = callback(value);
            if (result === null && creatureInfo.type === 'monster') {
                popup.show(`${creatureInfo.name} has been defeated!`, 3);
            }
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
                const result = callback(value);
                if (result === null && creatureInfo.type === 'monster') {
                    popup.show(`${creatureInfo.name} has been defeated!`, 3);
                }
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
        min-width: 600px;
        max-width: 700px;
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
function updateCellWithHpBar(cell, hp, maxHp, tempHp, textColor, data={}) {
    cell.innerHTML = ''; // Clear
    const hpDisplay = createHpProgressBar(hp, maxHp, tempHp, textColor);
    cell.appendChild(hpDisplay);
    cell.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentRowData = cell._rowData || data;
        // Show damage type modal
        createDamageTypeModal(currentRowData , (damageType, damageAmount) => {
            const updatedStats = applyDamageWithType(currentRowData , damageType, damageAmount);
            window.encounterTableRender();
            if (updatedStats === null && (currentRowData.type === 'monster' || currentRowData.type === 'creature')) {
                // Creature was removed
                const rowIndex = window.encounterTableData.findIndex(item => {
                    if (currentRowData.type === 'player') {
                        return item.name === currentRowData.name && item.type === 'player';
                    } else {
                        return item.id === currentRowData.id;
                    }
                });
                if (rowIndex !== -1) {
                    window.encounterTableData.splice(rowIndex, 1);
                    window.encounterTableRender();
                }
                return;
            }
            
            // Update the row data
            if (updatedStats) {
                currentRowData.tempHp = updatedStats.tempHp;
                currentRowData.hp = updatedStats.hp;
                currentRowData.deathSaveSuccesses = updatedStats.deathSaveSuccesses || 0;
                currentRowData.deathSaveFailures = updatedStats.deathSaveFailures || 0;
                currentRowData.stabilized = updatedStats.stabilized || false;
                
                // Update the display
                updateCellWithHpBar(cell, updatedStats.hp, currentRowData.maxHp, updatedStats.tempHp, textColor, currentRowData);
                
                // Update the table data
                const rowIndex = window.encounterTableData.findIndex(item => {
                    if (currentRowData.type === 'player') {
                        return item.name === currentRowData.name && item.type === 'player';
                    } else {
                        return item.id === currentRowData.id;
                    }
                });
                
                if (rowIndex !== -1) {
                    window.encounterTableData[rowIndex] = { ...currentRowData };
                }
                window.encounterTableRender();
            }
        });
    });
    // Keep the old right-click functionality for direct HP editing
    cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const currentValue = data.hp;
        window.showNumberPrompt(currentValue, (newValue) => {
            data.hp = newValue;
            
            const rowIndex = window.encounterTableData.findIndex(item => {
                if (data.type === 'player') {
                    return item.name === data.name && item.type === 'player';
                } else {
                    return item.id === data.id;
                }
            });
            
            if (rowIndex !== -1) {
                window.encounterTableData[rowIndex].hp = newValue;
                updateCellWithHpBar(cell, newValue, data.maxHp, data.tempHp || '0', textColor, data);
            }
        });
    });
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
                updateCellWithHpBar(cell, newValue, data.maxHp, data.tempHp, textColor, data);
            }
        });
    };
}// Add this to your existing style function or create a new one
function addInventorySortingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .sort-button {
            transition: all 0.2s ease;
        }
        
        .sort-button:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .sort-button:active {
            transform: scale(0.95);
        }
        
        .category-section {
            margin-bottom: 15px;
        }
        
        .category-header {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .inventory-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .inventory-item:hover {
            transform: translateX(5px);
        }
        
        .item-quantity, .item-weight, .item-price {
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 12px;
            margin-left: 5px;
            font-weight: bold;
        }
        
        .item-icon {
            flex-shrink: 0;
        }
        
        .item-name {
            flex-grow: 1;
            margin-left: 8px;
        }
    `;
    document.head.appendChild(style);
}

// Export the function for manual use
window.convertToEncounterTable = convertToEncounterTable;
window.addRowToDOM = addRowToDOM; // Make it available globally
window.handleCreatureTurnStart = handleCreatureTurnStart;
window.handleCreatureTurnEnd = handleCreatureTurnEnd;
window.handleCreatureDeathDuringTurn = handleCreatureDeathDuringTurn;
window.currentTurnCreatureId = currentTurnCreatureId;
window.inventoryMenu = new InventoryItemMenu();