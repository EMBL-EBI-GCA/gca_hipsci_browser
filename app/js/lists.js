'use strict';

var listUtils = angular.module('hipsciBrowser.listUtils', []);

listUtils.controller('ListCtrl', ['listTypeConfig', 'esClient',
    function(listTypeConfig, esClient) {
        this.currentPage = 1;
        this.numPages = 0;
        this.hitsPerPage = 10;
        this.columnHeaders = [];
        this.fields = [];
        this.displayResults = [];
        this.numHits = 0;

        this.documentType = listTypeConfig.documentType;
        this.cachedHits = [];

        listTypeConfig.initScope(this);

        this.search = function() {
            var searchBody = {
                fields: this.fields,
                size: this.hitsPerPage,
                from: (this.currentPage -1) * this.hitsPerPage,
            };
            listTypeConfig.amendSearchBody(searchBody, this);
            return esClient.search( {
                index: 'hipsci',
                type: this.documentType,
                body: searchBody,
            }).then(angular.bind(this, function(resp) {
                this.numHits = resp.hits.total
                this.numPages = Math.ceil(this.numHits / this.hitsPerPage);
                var displayResults = [];
                for (var i=0; i<resp.hits.hits.length; i++) {
                    var listItem = {};
                    for (var field in resp.hits.hits[i].fields) {
                        listItem[field] = resp.hits.hits[i].fields[field][0];
                    }
                    displayResults.push(listItem);
                }
                this.displayResults = displayResults;
                this.cachedHits[this.currentPage] = this.displayResults
            }));
        };

        this.exportData = function(format) {
          var form = document.createElement('form');
          var body = {
            fields: this.fields,
            column_names: this.columnHeaders,
            page: 0,
            size: this.numHits,
          };
          listTypeConfig.amendSearchBody(body, this);
          //form.action='http://vg-rs-dev1:8000/api/hipsci/' + this.documentType + '/_search.' +format;
          //form.action='/api/hipsci/' + this.documentType + '/_search.' +format;
          form.action='http://127.0.0.1:3000/hipsci/' + this.documentType + '/_search.' +format;
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

        this.refreshSearch = function () {
            this.currentPage = 1;
            this.search();
        };
        this.setPage = function () {
            var displayResults = this.cachedHits[this.currentPage];
            if (typeof displayResults == "undefined") {
                this.search();
            }
            else {
                this.displayResults = displayResults
            }
        };

        this.search();
}]);

listUtils.factory('donorConfig', function() {
    return {
        documentType : 'donor',
        initScope : function (controller) {
            controller.fields = ['name', 'sex'];
            controller.columnHeaders = ['Name', 'Sex'];
        },
        amendSearchBody : function (searchBody, controller) {
            return;
        },
        processSearchResponse : function(controller, response) {
            return;
        }
    };
});

listUtils.factory('lineConfig', function() {
    return {
        documentType : 'cellLine',
        initScope : function (controller) {
            controller.fields = ['name', 'donor', 'bioSamplesAccession'];
            controller.columnHeaders = ['Name', 'Donor', 'Biosamples ID'];
        },
        amendSearchBody : function (searchBody, controller) {
            return;
        },
        processSearchResponse : function(controller, response) {
            return;
        }
    };
});
