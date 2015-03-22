'use strict';

/* Services */

var services = angular.module('hipsciBrowser.services', ['elasticsearch']);

services.service('esClient', ['esFactory',
  function(esFactory) {
      return esFactory({
          //host: 'vg-rs-dev1:8000/api',
          host: 'http://127.0.0.1:3000',
          apiVersion: '1.3'
      });
  }
]);

