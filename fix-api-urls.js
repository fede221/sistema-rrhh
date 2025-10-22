const fs = require('fs');
const path = require('path');

function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const frontendSrc = path.join(__dirname, 'frontend', 'src');
const jsFiles = getAllJsFiles(frontendSrc);

let totalFixed = 0;
let totalFiles = 0;

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(/\$\{API_BASE_URL\}\/api\//g, '${API_BASE_URL}/');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`✓ Fixed: ${path.relative(__dirname, file)}`);
    totalFiles++;
    const matches = (content.match(/\$\{API_BASE_URL\}\/api\//g) || []).length;
    totalFixed += matches;
  }
});

console.log(`\n✅ Done! Fixed ${totalFixed} instances in ${totalFiles} files.`);
