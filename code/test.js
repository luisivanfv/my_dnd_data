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
        /*await fetchFolderDataSequentially();
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
        document.body.classList.add('loaded');*/
};
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