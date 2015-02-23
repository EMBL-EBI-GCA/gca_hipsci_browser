'use strict';

/* Services */

var services = angular.module('ebiscBrowser.services', ['elasticsearch']);

services.service('esClient', ['esFactory',
  function(esFactory) {
      return esFactory({
          host: '127.0.0.1:3000',
          apiVersion: '1.3'
      });
  }
]);

services.factory('donorSearcher', ['esClient',
  var search = function(offset) {
    esClient.search({
        index: 'hipsci',
        type: 'donor',
        body: {
            fields: 'Name',
            size: 10,
            from: (offset || 0) * 10
        }
    });
  };
  return {search:search};
]);

