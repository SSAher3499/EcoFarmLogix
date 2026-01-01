/**
 * Simple icon generator for PWA
 * This creates placeholder icons with the EcoFarmLogix branding
 *
 * Usage: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create SVG template for each size
function createSVG(size) {
  const fontSize = Math.floor(size / 3);
  const plantSize = Math.floor(size / 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#15803d;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow${size}">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size / 10}" fill="url(#grad${size})"/>

  <!-- Plant emoji or text -->
  <text x="50%" y="60%" font-size="${plantSize}" text-anchor="middle" fill="white" filter="url(#shadow${size})">🌱</text>

  <!-- Optional: EF text for larger icons -->
  ${size >= 192 ? `<text x="50%" y="90%" font-size="${fontSize / 2}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif" font-weight="bold">EcoFarm</text>` : ''}
</svg>`;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files for each size
sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);

  fs.writeFileSync(filepath, svg);
  console.log(`✓ Created ${filename}`);
});

console.log('\n📱 SVG icons created successfully!');
console.log('\n⚠️  Note: PWA requires PNG icons. You have two options:');
console.log('1. Convert SVGs to PNGs using an online tool (recommended):');
console.log('   - Visit https://cloudconvert.com/svg-to-png');
console.log('   - Upload each SVG and download as PNG');
console.log('   - Replace the SVG files with PNG files\n');
console.log('2. Install sharp package and use the conversion script:');
console.log('   npm install sharp');
console.log('   node convert-icons-to-png.js\n');
console.log('3. Use ImageMagick (if installed):');
console.log('   For each icon, run: magick convert icon-{size}x{size}.svg icon-{size}x{size}.png\n');
