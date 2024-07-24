function insertIntoTarget(element, options) {
  var parent = options.target || document.head;
  console.log("inserting style into ", element, options);
  parent.appendChild(element);
}

module.exports = insertIntoTarget;
