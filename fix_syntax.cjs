const fs = require('fs');
const path = require('path');

const domains = ['broker', 'cache', 'hash', 'kv', 'lock', 'queue', 'rateLimiter', 'sessions', 'stream'];
const srcPath = path.join(__dirname, 'src');

domains.forEach(domain => {
  const typesPath = path.join(srcPath, 'domains', domain, 'types.ts');
  if (fs.existsSync(typesPath)) {
    let content = fs.readFileSync(typesPath, 'utf8');
    // Fix hanging EngineConfig = \n
    content = content.replace(/export type [A-Za-z]+EngineConfig\s*=\s*$/m, 'export type ' + (domain.charAt(0).toUpperCase() + domain.slice(1)) + 'EngineConfig = never;');
    
    // Fix empty enums that might have trailing commas or bad formatting, though TS allows empty enums.
    
    // Specifically for Cache, fix the MEMORY_LRU
    if (domain === 'cache') {
      content = content.replace(/export type CacheEngineConfig\s*=\s*$/m, 'export type CacheEngineConfig = never;');
    }
    
    // For domains with multiple configs (kv, queue, lock)
    // We just need to make sure the union is valid. If it starts with | due to line breaks
    content = content.replace(/=\s*\|/g, '=');

    fs.writeFileSync(typesPath, content);
  }

  // Factory fixes
  const factoryFile1 = path.join(srcPath, 'domains', domain, `${domain}Factory.ts`);
  const factoryFile2 = path.join(srcPath, 'domains', domain, `${domain.charAt(0).toUpperCase() + domain.slice(1)}Factory.ts`);
  const factoryPath = fs.existsSync(factoryFile1) ? factoryFile1 : fs.existsSync(factoryFile2) ? factoryFile2 : null;
  
  if (factoryPath) {
    let content = fs.readFileSync(factoryPath, 'utf8');
    // Clean up empty switch statements or hanging breaks
    content = content.replace(/switch\s*\([^\)]+\)\s*\{\s*break;/g, 'switch (config.type) {');
    content = content.replace(/switch\s*\([^\)]+\)\s*\{\s*default:/g, 'switch (config.type) { default:');
    
    // if engine is used before being assigned because case is missing:
    // just let TS catch it, we'll fix it manually if needed.
    // Actually, if we just remove the `break;` that is floating
    content = content.replace(/^\s*break;\s*$/gm, '');
    
    fs.writeFileSync(factoryPath, content);
  }
});
