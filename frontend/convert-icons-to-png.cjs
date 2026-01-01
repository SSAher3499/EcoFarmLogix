/**
 * Convert SVG icons to PNG using sharp
 *
 * Prerequisites: npm install sharp
 * Usage: node convert-icons-to-png.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp package is not installed.');
  console.log('\nPlease install it first:');
  console.log('  npm install sharp\n');
  process.exit(1);
}

const iconsDir = path.join(__dirname, 'public', 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function convertIcons() {
  console.log('🔄 Converting SVG icons to PNG...\n');

  for (const size of sizes) {
    const svgFile = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngFile = path.join(iconsDir, `icon-${size}x${size}.png`);

    if (!fs.existsSync(svgFile)) {
      console.log(`⚠️  Skipping icon-${size}x${size}.svg (not found)`);
      continue;
    }

    try {
      await sharp(svgFile)
        .resize(size, size)
        .png()
        .toFile(pngFile);

      console.log(`✓ Converted icon-${size}x${size}.png`);

      // Optionally remove SVG after conversion
      // fs.unlinkSync(svgFile);
    } catch (error) {
      console.error(`❌ Error converting icon-${size}x${size}.svg:`, error.message);
    }
  }

  console.log('\n✅ PNG conversion complete!');
  console.log('\n💡 Tip: You can now delete the SVG files if you want (optional)');
}

convertIcons().catch(console.error);
