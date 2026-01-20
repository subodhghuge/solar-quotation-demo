const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // serve frontend

app.post('/generate-pdf', (req, res) => {
  const { systemCost, gstPercent, gstAmount, totalCost, advance, proforma, commissioning, meter } = req.body;

  const doc = new PDFDocument({ margin: 50 });
  const filename = `quotation_${Date.now()}.pdf`;
  const filepath = path.join(__dirname, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  // --- WATERMARK ---
  doc.fontSize(50)
     .fillColor('lightgray')
     .opacity(0.3)
     .rotate(45, { origin: [300, 300] })
     .text("Mauli Solar Power Energy", 100, 100, { align: 'center', width: 500 });
  doc.rotate(-45, { origin: [300, 300] });
  doc.opacity(1).fillColor('black');

  // --- HEADER ---
  try {
    doc.image(path.join(__dirname, 'logo.png'), 50, 45, { width: 80 });
  } catch (e) {
    doc.fontSize(12).fillColor('red').text("Logo missing - upload logo.png", 50, 45);
  }
  doc.fontSize(20).fillColor('black').text("Mauli Solar Power Energy", 150, 50);
  doc.fontSize(10).text("Commercial Quotation", { align: 'right' });
  doc.moveDown(2);

  // --- BODY ---
  doc.fontSize(16).text("Solar Quotation", { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`System Cost: ₹${systemCost}`);
  doc.text(`GST (${gstPercent}%): ₹${gstAmount}`);
  doc.text(`Total Project Cost: ₹${totalCost}`);
  doc.moveDown();
  doc.text("Payment Terms:");
  doc.text(`60% Advance: ₹${advance}`);
  doc.text(`30% Proforma: ₹${proforma}`);
  doc.text(`5% Commissioning: ₹${commissioning}`);
  doc.text(`5% Meter Installation: ₹${meter}`);

  // --- FOOTER ---
  doc.moveDown(4);
  doc.fontSize(10).fillColor('gray')
     .text("Mauli Solar Power Energy | Ratanlal Plot Durga Chowk Akola", { align: 'center' });
  doc.text("Contact: info@maulisolar.com | +91-XXXXXXXXXX", { align: 'center' });

  doc.end();

  stream.on('finish', () => {
    res.json({ link: `/download/${filename}` });
  });
});

app.get('/download/:filename', (req, res) => {
  const filepath = path.join(__dirname, req.params.filename);
  res.download(filepath);
});

app.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));
