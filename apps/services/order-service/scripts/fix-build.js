const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const srcDir = path.join(distDir, 'apps', 'services', 'order-service', 'src');

if (fs.existsSync(srcDir)) {
  // Move files from dist/apps/services/order-service/src to dist
  const files = fs.readdirSync(srcDir);
  
  files.forEach(file => {
    const srcFile = path.join(srcDir, file);
    const dstFile = path.join(distDir, file);
    
    if (fs.statSync(srcFile).isDirectory()) {
      // Copy directory recursively
      if (fs.existsSync(dstFile)) {
        fs.rmSync(dstFile, { recursive: true, force: true });
      }
      fs.cpSync(srcFile, dstFile, { recursive: true });
      fs.rmSync(srcFile, { recursive: true, force: true });
    } else {
      // Copy file
      fs.copyFileSync(srcFile, dstFile);
      fs.unlinkSync(srcFile);
    }
  });
  
  // Remove empty directories
  fs.rmSync(path.join(distDir, 'apps'), { recursive: true, force: true });
  fs.rmSync(path.join(distDir, 'packages'), { recursive: true, force: true });
  
  console.log('✅ Build output fixed');
} else {
  console.log('⚠️  Source directory not found, skipping fix');
}

