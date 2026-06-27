const fs = require('fs');
const path = require('path');

const targetFile = 'c:/Users/lalin/OneDrive/Desktop/VillageF (2)/VillageF/frontend/node_modules/react-dom/cjs/react-dom-client.development.js';

if (!fs.existsSync(targetFile)) {
    console.error('File does not exist:', targetFile);
    process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = 'react_stack_bottom_frame: function (Component, props, secondArg) {';
const index = content.indexOf(targetStr);

if (index === -1) {
    console.error('Target string not found in react-dom-client.development.js');
    
    // Let's try searching for it in other files in react-dom
    console.log('Searching all files in react-dom...');
    function searchDir(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                searchDir(fullPath);
            } else if (file.endsWith('.js')) {
                const c = fs.readFileSync(fullPath, 'utf8');
                if (c.includes('react_stack_bottom_frame')) {
                    console.log(`Found in: ${fullPath}`);
                }
            }
        }
    }
    searchDir('c:/Users/lalin/OneDrive/Desktop/VillageF (2)/VillageF/frontend/node_modules/react-dom');
    process.exit(1);
}

console.log('Found target at index:', index);

const replacement = targetStr + '\n        console.log("🔍 React is calling component:", Component?.name || Component, props);\n';
const newContent = content.substring(0, index) + replacement + content.substring(index + targetStr.length);

fs.writeFileSync(targetFile, newContent, 'utf8');
console.log('Successfully patched react-dom-client.development.js!');
