if (!Object.hasOwn) {
  Object.hasOwn = (object, property) => Object.prototype.hasOwnProperty.call(object, property);
}
