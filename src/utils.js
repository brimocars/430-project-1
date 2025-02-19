function equalsIgnoreCase(string1, string2) {
  if (!string1 || !string2) {
    return true;
  }
  return string1.toLowerCase() === string2.toLowerCase();
}

module.exports = {
  equalsIgnoreCase,
}