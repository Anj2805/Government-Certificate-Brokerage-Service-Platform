const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const types = [
  'identity-proof',
  'income-proof',
  'hospital-record',
  'residence-proof',
  'caste-proof',
  'birth-record',
  'marriage-proof',
  'age-proof',
  'property-deed',
  'tax-receipt',
  'business-proof',
  'document-to-attest',
  'bank-passbook',
  'medical-record',
  'supporting-document',
  'delivered-certificate'
];

async function generateAssets() {
  console.log('Generating dummy PDF assets...');
  const assetsDir = path.join(__dirname);
  
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  for (const type of types) {
    const filePath = path.join(assetsDir, `${type}-demo.pdf`);
    if (fs.existsSync(filePath)) {
      continue; // Skip if already generated
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(24).fillColor('red').text('DEMO DOCUMENT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).fillColor('black').text(`Type: ${type.toUpperCase()}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('gray').text('SYNTHETIC DATA', { align: 'center' });
    doc.text('NOT VALID FOR OFFICIAL USE', { align: 'center' });
    
    // Add some random fake data looking text
    doc.moveDown(3);
    doc.fontSize(12).fillColor('black').text(`This document is generated explicitly for the SevaSetu showcase environment.`, { align: 'left' });
    doc.moveDown();
    doc.text(`Document ID: ${Date.now().toString(16).toUpperCase()}-${Math.floor(Math.random()*10000)}`);
    doc.text(`Generated On: ${new Date().toISOString()}`);

    doc.end();
  }
  
  console.log('Dummy PDF assets generated successfully.');
}

if (require.main === module) {
  generateAssets().catch(console.error);
}

module.exports = { generateAssets, types };
