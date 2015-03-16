'use strict';

/* Services */

var services = angular.module('ebiscBrowser.services', ['elasticsearch']);

services.service('esClient', ['esFactory',
  function(esFactory) {
      return esFactory({
          //host: 'vg-rs-dev1:8000/api',
          host: 'http://127.0.0.1:9200',
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
          body.column_names = searchParams.columnHeaders;
          //form.action='http://vg-rs-dev1:8000/api/hipsci/' + searchParams.documentType + '/_search.' +format;
          form.action='/api/hipsci/' + searchParams.documentType + '/_search.' +format;
          form.method='POST';
          form.target="_self";

          var input = document.createElement("textarea");
          input.setAttribute('type', 'hidden');
          input.setAttribute('name', 'json');
          input.value = JSON.stringify(body);
          form.appendChild(input);
          form.style.display = 'none';
          document.body.appendChild(form);
          form.submit();
      };


      return {search: search, exportData: exportData};
}]);

