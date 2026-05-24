import sharp from 'sharp';
import path from 'path';

const inputSvg = path.join(process.cwd(), 'public', 'icon.svg');
const dest192 = path.join(process.cwd(), 'public', 'icon-192.png');
const dest512 = path.join(process.cwd(), 'public', 'icon-512.png');

async function convert() {
  try {
    console.log('Generating PWA PNG icons from SVG...');
    await sharp(inputSvg)
      .resize(192, 192)
      .png()
      .toFile(dest192);
    console.log('Created icon-192.png');

    await sharp(inputSvg)
      .resize(512, 512)
      .png()
      .toFile(dest512);
    console.log('Created icon-512.png');
    console.log('PWA PNG icons generated successfully!');
  } catch (error) {
    console.error('Failed to generate PNG icons:', error);
  }
}

convert();
