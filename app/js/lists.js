'use strict';

var listUtils = angular.module('hipsciBrowser.listUtils', []);

listUtils.controller('ListCtrl', ['$scope', 'listTypeConfig', 'esClient',
    function($scope, listTypeConfig, esClient) {
        $scope.currentPage = 1;
        $scope.numPages = 0;
        $scope.hitsPerPage = 10;
        $scope.columnHeaders = [];
        $scope.fields = [];
        $scope.displayResults = [];
        $scope.numHits = 0;

        var controller = this;

        this.documentType = listTypeConfig.documentType;
        this.cachedHits = [];

        listTypeConfig.initScope($scope);

        this.search = function() {
            var searchBody = {
                fields: $scope.fields,
                size: $scope.hitsPerPage,
                from: ($scope.currentPage -1) * $scope.hitsPerPage,
            };
            listTypeConfig.amendSearchBody(searchBody, $scope);
            return esClient.search( {
                index: 'hipsci',
                type: this.documentType,
                body: searchBody,
            }).then(function(resp) {
                $scope.numHits = resp.hits.total
                $scope.numPages = Math.ceil($scope.numHits / $scope.hitsPerPage);
                var displayResults = [];
                for (var i=0; i<resp.hits.hits.length; i++) {
                    var listItem = {};
                    for (var field in resp.hits.hits[i].fields) {
                        listItem[field] = resp.hits.hits[i].fields[field][0];
                    }
                    displayResults.push(listItem);
                }
                $scope.displayResults = displayResults;
                controller.cachedHits[$scope.currentPage] = $scope.displayResults
            });
        };

        this.exportData = function(format) {
          var form = document.createElement('form');
          var body = {
            fields: $scope.fields,
            column_names: $scope.columnHeaders,
            page: 0,
            size: $scope.numHits,
          };
          listTypeConfig.amendSearchBody(body, scope);
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
            $scope.currentPage = 1;
            this.search();
        };
        $scope.setPage = function () {
            var displayResults = $scope.cachedHits[$scope.currentPage];
            if (typeof displayResults == "undefined") {
                this.search();
            }
            else {
                $scope.displayResults = displayResults
            }
        };

        this.search();
}]);

listUtils.factory('donorConfig', function() {
    return {
        documentType : 'donor',
        initScope : function (scope) {
            scope.fields = ['name', 'sex'];
            scope.columnHeaders = ['Name', 'Sex'];
        },
        amendSearchBody : function (searchBody, scope) {
            return;
        },
        processSearchResponse : function(scope, response) {
            return;
        }
    };
});

listUtils.factory('lineConfig', function() {
    return {
        documentType : 'cellLine',
        initScope : function (scope) {
            scope.fields = ['name', 'donor', 'bioSamplesAccession'];
            scope.columnHeaders = ['Name', 'Donor', 'Biosamples ID'];
        },
        amendSearchBody : function (searchBody, scope) {
            return;
        },
        processSearchResponse : function(scope, response) {
            return;
        }
    };
});
