// Borrowed from HTTP-API-Assignment-ii
const fs = require('fs');

const index = fs.readFileSync('./client/client.html');
const style = fs.readFileSync('./client/style.css');

function getIndex(res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(index);
  res.end();
}

function getStyle(res) {
  res.writeHead(200, { 'Content-Type': 'text/css' });
  res.write(style);
  res.end();
}

module.exports = {
  getIndex,
  getStyle,
};
