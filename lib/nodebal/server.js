(function (module) {
   "use strict";

   var http    = require('http'),
       _       = require('underscore'),
       Handler = require('./handler');

   var Server = (function () {
     var Constr = function (opt) {
       if (! opt) opt = {};

       // set attribute
       this.host = opt.host;
       this.port = opt.port;

       // setup handler
       this.handler = new Handler(_.bind(function (connection) {
           this.handleRequest(connection);
       }, this));

       // setup middlewae
       if (opt.middlewares) for (var i = opt.middlewares.length - 1; i >= 0; i--) {
         this.handler = middlewares[i].wrap(this.handler);
       }

       // setup http server
       this.httpServer = http.createServer(function (req, res) {
         this.handler.doAction(req, res);
       });
     };

     Constr.prototype.listen = function (host, port) {
       if (host) this.host = host;
       if (port) this.port = port;
       this.httpServer.listen(this.port, this.host);
     };

     Constr.prototype.handleRequest = function (connection) {
       var host = connection.backend.host,
           port = connection.backend.port;

       // setup proxy request
       var req = http.request({
           agent:   http.getAgent(host, port),
           port:    port,
           host:    host,
           headers: connection.backend.headers
       });

       // request proxy
       connection.handler.req.setEncoding('binary');
       connection.handler.on('req:data', function (chunk) {
         req.write(chunk, 'binary');
       });
       connection.handler.on('req:end', function () {
         req.end();
       });
       connection.handler.on('req:close', function () {
         req.abort();
       });

       // response proxy
       req.on('response', function (response) {
         connection.handler.responseHeader(response.statusCode, response.headers);
         response.on('data', function (chunk) {
           connection.handler.responseChunk(chunk);
         });
         response.on('end', function () {
           connection.handler.responseEnd();
         });
         response.on('close', function () {
           connection.handler.responseClose();
         });
       });
     };

     return Constr;
   })();

   module.exports = Server;
})(module);
