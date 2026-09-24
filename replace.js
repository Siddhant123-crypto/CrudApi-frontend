const fs = require('fs');
const path = require('path');

function replaceArrowBack(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceArrowBack(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('"arrow-back"')) {
                content = content.replace(/"arrow-back"/g, '"chevron-back"');
                fs.writeFileSync(fullPath, content);
                console.log('Updated', fullPath);
            }
        }
    }
}
replaceArrowBack('d:\\spring boot\\UserApp\\userappmobile\\src\\screens');
