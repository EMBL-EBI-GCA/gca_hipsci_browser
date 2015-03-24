'use strict';

var listUtils = angular.module('hipsciBrowser.listUtils', []);

listUtils.controller('DonorCtrl', function() {
    this.documentType = 'donor';
    this.fields = ['name', 'sex'];
    this.columnHeaders = ['Name', 'Sex'];
});

listUtils.controller('LineCtrl', function() {
    this.documentType = 'cellLine';
    this.fields =  ['name', 'donor', 'bioSamplesAccession'];
    this.columnHeaders = ['Name', 'Donor', 'Biosamples ID'];
});


listUtils.directive('listPanel', ['esClient', function (esClient) {
  return {
    //scope: {documentType: '@'},
    scope: false,
    controllerAs: 'ListPanelCtrl',
    restrict: 'E',
    //transclude: true,
    //template: '<div ng-transclude></div>',
    link: function(scope, iElement, iAttrs, controller) {
      controller.documentType = scope.$eval(iAttrs.documentType);
      controller.columnHeaders = scope.$eval(iAttrs.columnHeaders);
      controller.fields = scope.$eval(iAttrs.fields);
      controller.search();
    },
    controller: ['$scope', function ($scope) {
      this.currentPage = 1;
      this.numPages = 0;
      this.hitsPerPage = 10;
      this.displayResults = [];
      this.numHits = 0;
  
      this.cachedHits = [];
      this.filters = [];
  
      this.search = function() {
        var searchBody = {
          fields: this.fields,
          size: this.hitsPerPage,
          from: (this.currentPage -1) * this.hitsPerPage,
        };
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
    }]

  };
}]);
