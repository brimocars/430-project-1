// Borrowed from HTTP-API-Assignment-ii
const fs = require('fs');

function getIndex(res) {
  const index = fs.readFileSync('./client/client.html');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(index);
  res.end();
}

function getStyle(res) {
  const style = fs.readFileSync('./client/style.css');
  res.writeHead(200, { 'Content-Type': 'text/css' });
  res.write(style);
  res.end();
}

module.exports = {
  getIndex,
  getStyle,
};
