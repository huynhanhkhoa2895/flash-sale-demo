const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');

// Remove lock files
function removeLockFiles(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      removeLockFiles(filePath);
    } else if (file === 'lock') {
      try {
        fs.unlinkSync(filePath);
        console.log(`✅ Removed lock file: ${filePath}`);
      } catch (error) {
        // Ignore errors
      }
    }
  });
}

if (fs.existsSync(nextDir)) {
  removeLockFiles(nextDir);
  console.log('✅ Cleanup completed');
} else {
  console.log('⚠️  .next directory not found, skipping cleanup');
}

