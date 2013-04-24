(function (module) {
   "use strict";

   var nodebal = {
     Server:     require('./nodebal/server'),
     Middleware: require('./nodebal/middleware')
   };

   module.exports.version = '0.0.0';
   module.exports = nodebal;
})(module);
