const fs = require('fs');
const path = 'frontend/src/pages/Home.tsx';
let c = fs.readFileSync(path, 'utf8');

// Simple global replacements (order matters - do closing tags first to avoid issues)
c = c.replace(/<\/Col>/g, '</div>');
c = c.replace(/<\/Row>/g, '</div>');
c = c.replace(/<\/Title>/g, '');
c = c.replace(/<Title level=\{5\} style=\{.*?\}>/g, '');
c = c.replace(/<Col xs=\{24\} lg=\{16\}>/g, '<div style={{ flex: "2fr", minWidth: 0 }}>');
c = c.replace(/<Col xs=\{24\} lg=\{8\}>/g, '<div style={{ flex: "1fr", minWidth: 0 }}>');
c = c.replace(/<Col xs=\{24\} md=\{8\}>/g, '<div style={{ flex: "1fr", minWidth: 0 }}>');
c = c.replace(/<Col xs=\{24\} md=\{16\}>/g, '<div style={{ flex: "2fr", minWidth: 0 }}>');
c = c.replace(/<Col xs=\{24\}>/g, '<div style={{ flex: "1fr", minWidth: 0 }}>');
c = c.replace(/<Row/g, '<div');

// Clean up empty lines
c = c.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(path, c);

const rc = (c.match(/<Row /g) || []).length;
const cc = (c.match(/<Col /g) || []).length;
const tc = (c.match(/<Title level=/g) || []).length;
const bc = (c.match(/<Button /g) || []).length;
console.log('Row:', rc, 'Col:', cc, 'Title:', tc, 'Button:', bc);
console.log('</Col>:', c.includes('</Col>'), '</Row>:', c.includes('</Row>'));

// Verify Row replaced with div
const rowCount2 = (c.match(/<Row /g) || []).length;
const divCount = (c.match(/<div className="dashboard-chart-row"/g) || []).length;
console.log('dashboard-chart-row divs:', divCount);
