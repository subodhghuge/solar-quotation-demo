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

  // --- TABLE TITLE ---
  doc.fontSize(16).text("Solar Quotation (10 KW)", { align: 'center' });
  doc.moveDown();

  // --- TABLE ---
  const tableTop = 200;
  const itemSpacing = 30;
  const leftX = 50;
  const rightX = 350;

  function drawRow(y, label, value) {
    doc.fontSize(12).fillColor('black').text(label, leftX, y);
    doc.text(value, rightX, y);
    doc.moveTo(leftX, y - 5).lineTo(550, y - 5).strokeColor('#cccccc').stroke();
  }

  drawRow(tableTop, "System Cost (₹)", systemCost);
  drawRow(tableTop + itemSpacing, `GST (${gstPercent}%)`, gstAmount);
  drawRow(tableTop + itemSpacing * 2, "Total Project Cost (₹)", totalCost);
  drawRow(tableTop + itemSpacing * 3, "60% Advance", advance);
  drawRow(tableTop + itemSpacing * 4, "30% Proforma", proforma);
  drawRow(tableTop + itemSpacing * 5, "5% Commissioning", commissioning);
  drawRow(tableTop + itemSpacing * 6, "5% Meter Installation", meter);

  // --- FOOTER ---
  doc.moveDown(6);
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
