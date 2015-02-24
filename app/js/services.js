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

services.factory('itemSearcher', ['esClient',
  function(esClient) {
      var buildSearchBody = function(searchParams) {
          return {
                fields: searchParams.fields,
                size: searchParams.size,
                from: searchParams.page * searchParams.size
          };
      };
      var search = function(searchParams) {
        return esClient.search({
            index: 'hipsci',
            type: searchParams.documentType,
            body: buildSearchBody(searchParams)
        });
      };

      var exportData = function(searchParams, format) {
          var form = document.createElement('form');
          var body = buildSearchBody(searchParams);
          delete body.size;
          delete body.from;
          body.column_names = searchParams.columnHeaders;
          form.action='http://127.0.0.1:3000/hipsci/' + searchParams.documentType + '/_search.' +format;
          form.method='POST';
          form.target="_self";

          for (var key in body) {
              if (body.hasOwnProperty(key)) {
                  var input = document.createElement("textarea");
                  input.setAttribute('type', 'hidden');
                  input.setAttribute('name', key);
                  input.value =  (body[key] instanceof Array || typeof body[key] === "object")
                                ? JSON.stringify(body[key]) : body[key];
                  form.appendChild(input);
              }
          }
          form.style.display = 'none';
          document.body.appendChild(form);
          form.submit();
      };


      return {search: search, exportData: exportData};
}]);

