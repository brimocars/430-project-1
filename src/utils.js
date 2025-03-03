/**
 * Checks if 2 strings are the same regardless of case
 * @param {String} string1 first string
 * @param {String} string2 second string
 * @returns {Boolean} true if the strings are the same, false if not.
 */
function equalsIgnoreCase(string1, string2) {
  if (!string1 || !string2) {
    return true;
  }
  return string1.toLowerCase() === string2.toLowerCase();
}

module.exports = {
  equalsIgnoreCase,
};
