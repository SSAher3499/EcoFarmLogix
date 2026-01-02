/**
 * Generate PWA icons from logo.png
 *
 * Prerequisites: npm install sharp
 * Usage: node generate-icons-from-logo.cjs
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = path.join(__dirname, 'public', 'logo.png');
const outputDir = path.join(__dirname, 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons from logo.png...\n');

  // Check if logo.png exists
  if (!fs.existsSync(inputImage)) {
    console.error('❌ Error: logo.png not found at', inputImage);
    process.exit(1);
  }

  console.log(`📁 Input: ${inputImage}`);
  console.log(`📂 Output: ${outputDir}\n`);

  try {
    // Generate all icon sizes
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

      await sharp(inputImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }

    // Also create apple-touch-icon (180x180 for iOS)
    console.log('');
    await sharp(inputImage)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));

    console.log('✅ Generated: apple-touch-icon.png (180x180)');

    // Create favicon.ico sized image (optional)
    await sharp(inputImage)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, 'public', 'favicon-32x32.png'));

    console.log('✅ Generated: favicon-32x32.png');

    console.log('\n🎉 All icons generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update index.html to use apple-touch-icon.png');
    console.log('   2. Verify icons in public/icons/ folder');
    console.log('   3. Test PWA installation on mobile devices\n');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
