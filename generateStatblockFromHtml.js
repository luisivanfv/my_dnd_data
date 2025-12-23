import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import https from 'https';
import { createWriteStream } from 'fs';
import { extname, basename } from 'path';

export function parseStatblockFromHTML(html) {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.DOMParser) {
    // Browser environment
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
  } else {
    // Node.js environment - we need to create a simple parser
    // This is a lightweight approach without external dependencies
    const doc = createSimpleDocument(html);
  }
  
  const result = {
    name: '',
    sounds: [],
    creatureType: '',
    armorClass: '',
    hitPoints: '',
    speed: '',
    str: '',
    dex: '',
    con: '',
    int: '',
    wis: '',
    cha: '',
    strSave: '',
    dexSave: '',
    conSave: '',
    intSave: '',
    wisSave: '',
    chaSave: '',
    savingThrows: '',
    skills: '',
    damageVulnerabilities: '',
    damageResistances: '',
    damageImmunities: '',
    conditionImmunities: '',
    senses: '',
    languages: '',
    challenge: '',
    proficiencyBonus: '',
    description: '', // New property for the description text
    passives: [],
    actions: [],
    reactions: [],
    bonusActions: [],
    legendaryActions: []
  };

  // Initialize saving throws with defaults
  const abilityModifiers = {};

  // Parse name and creature type
  const nameMatch = html.match(/class="mon-stat-block__name[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
                    html.match(/class="mon-stat-block__name[^"]*"[^>]*>([^<]+)<\//i);
  if (nameMatch) {
    result.name = cleanText(nameMatch[1]);
  }

  const metaMatch = html.match(/class="mon-stat-block__meta"[^>]*>([^<]+)</i);
  if (metaMatch) {
    result.creatureType = cleanText(metaMatch[1]);
  }

  // Parse attributes (Armor Class, Hit Points, Speed)
  parseAttributes(html, result);
  
  // Parse ability scores
  parseAbilityScores(html, result, abilityModifiers);
  
  // Parse tidbits (Saving Throws, Skills, etc.)
  parseTidbits(html, result);
  
  // Parse proficiency bonus from tidbit container if not already found
  if (!result.proficiencyBonus) {
    const proficiencyMatch = html.match(/Proficiency Bonus[^<]*<[^>]*>[\s\S]*?class="[^"]*mon-stat-block__tidbit-data[^"]*"[^>]*>([^<]+)</i);
    if (proficiencyMatch) {
      result.proficiencyBonus = cleanText(proficiencyMatch[1]);
    }
  }

  // Parse description from mon-details__description-block-content
  parseDescriptionText(html, result);

  // Apply saving throws override
  if (result.savingThrows) {
    applySavingThrowOverrides(result.savingThrows, result, abilityModifiers);
  }

  // Set default saving throws for abilities not overridden
  setDefaultSavingThrows(result, abilityModifiers);

  // Parse description blocks (Traits, Actions, etc.)
  parseDescriptionBlocks(html, result);

  return result;
}

// Helper function to parse attributes
function parseAttributes(html, result) {
  const attributeRegex = /class="mon-stat-block__attribute"[^>]*>[\s\S]*?class="mon-stat-block__attribute-label"[^>]*>([^<]+)<[\s\S]*?class="mon-stat-block__attribute-data-value"[^>]*>([^<]+)<(?:[\s\S]*?class="mon-stat-block__attribute-data-extra"[^>]*>([^<]+)<)?/gi;
  
  let match;
  while ((match = attributeRegex.exec(html)) !== null) {
    const label = cleanText(match[1]);
    const value = cleanText(match[2]);
    const extra = match[3] ? cleanText(match[3]) : '';
    
    switch(label) {
      case 'Armor Class':
        result.armorClass = `${value}${extra ? ' ' + extra : ''}`.trim();
        break;
      case 'Hit Points':
        result.hitPoints = `${value}${extra ? ' ' + extra : ''}`.trim();
        break;
      case 'Speed':
        result.speed = value;
        break;
    }
  }
}

// Helper function to parse ability scores
function parseAbilityScores(html, result, abilityModifiers) {
  const abilityRegex = /class="ability-block__stat[^>]*>[\s\S]*?class="ability-block__heading"[^>]*>([^<]+)<[\s\S]*?class="ability-block__score"[^>]*>([^<]+)<(?:[\s\S]*?class="ability-block__modifier"[^>]*>([^<]+)<)?/gi;
  
  let match;
  while ((match = abilityRegex.exec(html)) !== null) {
    const abilityName = cleanText(match[1]).toLowerCase();
    const score = cleanText(match[2]);
    const modifier = match[3] ? cleanText(match[3]) : '';
    
    // Store ability score
    result[abilityName] = score;
    
    // Extract modifier number
    if (modifier) {
      const modifierMatch = modifier.match(/\(([+-]\d+)\)/);
      if (modifierMatch) {
        abilityModifiers[abilityName] = modifierMatch[1];
      }
    }
  }
}

// Helper function to parse tidbits
function parseTidbits(html, result) {
  const tidbitRegex = /class="mon-stat-block__tidbit"[^>]*>[\s\S]*?class="mon-stat-block__tidbit-label"[^>]*>([^<]+)<[\s\S]*?class="mon-stat-block__tidbit-data"[^>]*>([\s\S]*?)<\/span>/gi;
  
  let match;
  while ((match = tidbitRegex.exec(html)) !== null) {
    const label = cleanText(match[1]);
    let data = cleanText(match[2]);
    
    // Remove any nested HTML tags from the data
    data = data.replace(/<[^>]+>/g, '').trim();
    
    switch(label) {
      case 'Saving Throws':
        result.savingThrows = data;
        break;
      case 'Skills':
        result.skills = data;
        break;
      case 'Damage Vulnerabilities':
        result.damageVulnerabilities = data;
        break;
      case 'Damage Resistances':
        result.damageResistances = data;
        break;
      case 'Damage Immunities':
        result.damageImmunities = data;
        break;
      case 'Condition Immunities':
        result.conditionImmunities = data;
        break;
      case 'Senses':
        result.senses = data;
        break;
      case 'Languages':
        result.languages = data;
        break;
      case 'Challenge':
        result.challenge = data;
        break;
      case 'Proficiency Bonus':
        result.proficiencyBonus = data;
        break;
    }
  }
}

// Helper function to parse description text from mon-details__description-block-content
function parseDescriptionText(html, result) {
  const descriptionRegex = /class="mon-details__description-block-content"[^>]*>([\s\S]*?)<\/div>/i;
  const match = html.match(descriptionRegex);
  
  if (match) {
    let descriptionText = match[1];
    // Remove HTML tags
    descriptionText = descriptionText.replace(/<[^>]+>/g, ' ');
    // Clean up whitespace
    descriptionText = cleanText(descriptionText);
    result.description = descriptionText;
  }
}

// Helper function to parse description blocks
function parseDescriptionBlocks(html, result) {
  // Find all description blocks
  const blockRegex = /class="mon-stat-block__description-block"[^>]*>[\s\S]*?class="mon-stat-block__description-block-heading"[^>]*>([^<]+)<[\s\S]*?class="mon-stat-block__description-block-content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  
  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const sectionName = cleanText(match[1]);
    const content = match[2];
    const sectionKey = getSectionKey(sectionName);
    
    if (sectionKey && Array.isArray(result[sectionKey])) {
      const entries = parseSectionEntriesFromHTML(content);
      result[sectionKey] = entries;
    }
  }
}

// Helper function to parse entries from HTML content
function parseSectionEntriesFromHTML(content) {
  const entries = [];
  
  // Split content by paragraph tags
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  const paragraphs = [];
  
  while ((match = paragraphRegex.exec(content)) !== null) {
    paragraphs.push(match[1]);
  }
  
  let currentEntry = null;
  let descriptionParts = [];
  
  paragraphs.forEach(paragraph => {
    // Clean the paragraph HTML
    let text = paragraph.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Check if this paragraph starts a new entry (looks for pattern like "Name. Description")
    const dotIndex = text.indexOf('.');
    const firstPart = text.substring(0, Math.min(50, text.length));
    
    // Heuristic: if the text starts with something that looks like a name followed by a period
    if (dotIndex > 0 && dotIndex < Math.min(40, text.length) && 
        (firstPart.includes('.') || text.match(/^[A-Z][a-z]+(?: [A-Z][a-z]+)*\./))) {
      
      // Save previous entry
      if (currentEntry) {
        currentEntry.description = formatDescriptionFromParts(descriptionParts);
        currentEntry.sound = null;
        entries.push(currentEntry);
        descriptionParts = [];
      }
      
      // Extract entry name (text before the first period)
      const name = text.substring(0, dotIndex).trim();
      const descriptionStart = text.substring(dotIndex + 1).trim();
      
      // Start new entry
      currentEntry = {
        name: name,
        description: '',
        sound: null
      };
      
      if (descriptionStart) {
        descriptionParts.push(descriptionStart);
      }
    } else if (currentEntry) {
      // This is a continuation of the current entry
      if (text) {
        descriptionParts.push(text);
      }
    } else {
      // This might be the first entry without a clear marker
      // Try to extract name from first line
      const firstDotIndex = text.indexOf('.');
      if (firstDotIndex > -1) {
        const name = text.substring(0, firstDotIndex).trim();
        const descriptionStart = text.substring(firstDotIndex + 1).trim();
        
        currentEntry = {
          name: name,
          description: '',
          sound: null
        };
        
        if (descriptionStart) {
          descriptionParts.push(descriptionStart);
        }
      }
    }
  });
  
  // Save the last entry
  if (currentEntry) {
    currentEntry.description = formatDescriptionFromParts(descriptionParts);
    currentEntry.sound = null;
    entries.push(currentEntry);
  }
  
  return entries;
}

// Helper function to format description from parts
function formatDescriptionFromParts(parts) {
  if (parts.length === 0) return '';
  
  // Join parts with <br><br> between paragraphs
  const formatted = parts.join('<br><br>');
  
  // Remove any trailing <br><br>
  return formatted.replace(/(<br><br>)+$/, '');
}

// Helper function to clean text
function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

// Helper function to convert creature name to filename
function nameToFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .trim();
}

// Extract image URL from HTML
function extractImageUrl(html) {
  const imageRegex = /<div[^>]*class="image"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>/i;
  const match = html.match(imageRegex);
  
  if (match) {
    return match[1];
  }
  return null;
}

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        fileStream.on('error', (err) => {
          reject(err);
        });
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Simple DOM parser for Node.js (lightweight alternative to jsdom)
function createSimpleDocument(html) {
  return {
    querySelector: function(selector) {
      // Simple implementation for basic selectors
      return null;
    },
    querySelectorAll: function() {
      return [];
    }
  };
}

// Helper functions (same as before)
function applySavingThrowOverrides(savingThrowsStr, result, abilityModifiers) {
  const savingThrowMap = {
    'STR': 'strSave',
    'DEX': 'dexSave',
    'CON': 'conSave',
    'INT': 'intSave',
    'WIS': 'wisSave',
    'CHA': 'chaSave'
  };

  // Clear all saving throws first
  Object.values(savingThrowMap).forEach(key => {
    result[key] = '';
  });

  // Parse saving throws string
  const savingThrows = savingThrowsStr.split(',');
  savingThrows.forEach(st => {
    const match = st.trim().match(/^(\w+)\s*([+-]\d+)$/);
    if (match) {
      const ability = match[1].toUpperCase();
      const bonus = match[2];
      
      if (savingThrowMap[ability]) {
        result[savingThrowMap[ability]] = bonus;
      }
    }
  });
}

function setDefaultSavingThrows(result, abilityModifiers) {
  const savingThrowMap = {
    'str': 'strSave',
    'dex': 'dexSave',
    'con': 'conSave',
    'int': 'intSave',
    'wis': 'wisSave',
    'cha': 'chaSave'
  };

  // Set defaults for abilities not overridden
  Object.entries(savingThrowMap).forEach(([ability, saveKey]) => {
    if (!result[saveKey] && abilityModifiers[ability]) {
      result[saveKey] = abilityModifiers[ability];
    }
  });
}

function getSectionKey(sectionName) {
  const sectionMap = {
    'Traits': 'passives',
    'Actions': 'actions',
    'Reactions': 'reactions',
    'Bonus Actions': 'bonusActions',
    'Legendary Actions': 'legendaryActions'
  };
  return sectionMap[sectionName] || sectionName.toLowerCase();
}

// Check if a file exists
async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Export a function to read, parse, and save a statblock
export async function parseAndSaveStatblockFromFile(htmlFilePath) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Read the HTML file
    const htmlContent = await readFile(
      join(__dirname, htmlFilePath),
      'utf-8'
    );
    
    // Parse it
    const statblockData = parseStatblockFromHTML(htmlContent);
    
    // Save the statblock based on the naming rules
    await saveStatblock(statblockData, __dirname, htmlContent);
    
    return statblockData;
    
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}

// Save statblock based on your rules
async function saveStatblock(statblockData, baseDir, htmlContent) {
  // Convert name to filename format
  const filename = nameToFilename(statblockData.name);
  const statblocksDir = join(baseDir, 'statblocks');
  const imagesDir = join(baseDir, 'images', 'monsters');
  
  // Create statblocks directory if it doesn't exist
  try {
    await mkdir(statblocksDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  
  // Create images directory if it doesn't exist
  try {
    await mkdir(imagesDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  
  // Check if the individual statblock file already exists
  const individualFilePath = join(statblocksDir, `${filename}.json`);
  const individualFileExists = await fileExists(individualFilePath);
  
  // Download and save the image
  await downloadAndSaveImage(htmlContent, filename, imagesDir);
  
  if (individualFileExists) {
    // File exists - save to repeated-statblock.json
    await saveToRepeatedFile(statblockData, statblocksDir);
    console.log(`Statblock "${statblockData.name}" already exists. Added to repeated-statblock.json`);
  } else {
    // File doesn't exist - save as individual file
    await writeFile(
      individualFilePath,
      JSON.stringify(statblockData, null, 2),
      'utf-8'
    );
    console.log(`Saved statblock "${statblockData.name}" to ${filename}.json`);
  }
}

// Download and save the monster image
async function downloadAndSaveImage(htmlContent, filename, imagesDir) {
  try {
    const imageUrl = extractImageUrl(htmlContent);
    
    if (!imageUrl) {
      console.log('No image found in the HTML');
      return;
    }
    
    // Always save as .jpeg regardless of original extension
    const imagePath = join(imagesDir, `${filename}.jpeg`);
    
    console.log(`Downloading image from: ${imageUrl}`);
    await downloadImage(imageUrl, imagePath);
    console.log(`Saved image to: ${imagePath}`);
    
  } catch (error) {
    console.error('Error downloading image:', error.message);
  }
}

// Save statblock to repeated-statblock.json
async function saveToRepeatedFile(statblockData, statblocksDir) {
  const repeatedFilePath = join(statblocksDir, 'repeated-statblock.json');
  
  let repeatedStatblocks = [];
  
  try {
    // Check if repeated-statblock.json exists
    const fileExists = await existsSync(repeatedFilePath);
    
    if (fileExists) {
      // Read existing content
      const existingContent = await readFile(repeatedFilePath, 'utf-8');
      repeatedStatblocks = JSON.parse(existingContent);
      
      // Make sure it's an array
      if (!Array.isArray(repeatedStatblocks)) {
        repeatedStatblocks = [repeatedStatblocks];
      }
    }
    
    // Add new statblock to the array
    repeatedStatblocks.push({
      ...statblockData,
      originalFileName: `${nameToFilename(statblockData.name)}.json`
    });
    
    // Write back to file
    await writeFile(
      repeatedFilePath,
      JSON.stringify(repeatedStatblocks, null, 2),
      'utf-8'
    );
    
  } catch (error) {
    console.error('Error updating repeated-statblock.json:', error);
    throw error;
  }
}

// If you want this file to be executable on its own, add this:
async function main() {
  try {
    // Example usage when running this file directly
    const statblockData = await parseAndSaveStatblockFromFile('statblockHtml.html');
    
    // Output the result
    console.log('Parsed Statblock:', JSON.stringify(statblockData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check if this file is being run directly (ES module way)
main();
