"use strict";
if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function(fn) {
    var result = [];
    for (var i = 0; i < this.length; i++) {
      var mapped = fn(this[i], i, this);
      if (Array.isArray(mapped)) {
        for (var j = 0; j < mapped.length; j++) {
          result.push(mapped[j]);
        }
      } else {
        result.push(mapped);
      }
    }
    return result;
  };
}
