'use strict';

/* Controllers */

var controllers = angular.module('ebiscBrowser.controllers', []);

controllers.controller('LineDetailCtrl', ['$scope', '$routeParams', 'esClient',
  function($scope, $routeParams, esClient) {
    $scope.data = esClient.getSource({
        index: 'hipsci',
        type: 'cellLine',
        id: $routeParams.ipscName
    }).then(function(resp) {
        $scope.data = resp;
    });
  }
]);

controllers.controller('DonorDetailCtrl', ['$scope', '$routeParams', 'esClient',
  function($scope, $routeParams, esClient) {
    $scope.data = esClient.getSource({
        index: 'hipsci',
        type: 'donor',
        id: $routeParams.donorName
    }).then(function(resp) {
        $scope.data = resp;
    });
  }
]);

function listController($scope, $routeParams, itemSearcher) {
    $scope.searchParams = {
        documentType: 'donor',
        page: 0,
        size: 10,
        query: '',
        fields: ['name', 'sex'],
        columnHeaders: ['Name', 'Sex']
    };

    $scope.cachedResults = {};
    $scope.setDisplayResults = function() {
        var displayResults = $scope.cachedResults[$scope.searchParams.page];
        if (typeof displayResults == "undefined") {
            $scope.search().then(function(returnResults) {$scope.displayResults = returnResults});
        }
        else {
            $scope.displayResults = displayResults;
        }
    };


    $scope.search = function() {
        return itemSearcher.search($scope.searchParams)
        .then(function(resp) {
            $scope.numHits = resp.hits.total;
            var returnResults = [];
            for (var i=0; i<resp.hits.hits.length; i++) {
                var listItem = {};
                for (var field in resp.hits.hits[i].fields) {
                    listItem[field] = resp.hits.hits[i].fields[field][0];
                }
                returnResults.push(listItem);
            }
            $scope.cachedResults[$scope.searchParams.page] = returnResults;
            return returnResults;
        });
    };

    $scope.exportData = function(format) {
        var searchParams = $scope.searchParams;
        searchParams.page = 0;
        searchParams.size = $scope.numHits;
        itemSearcher.exportData(searchParams, format);
    };

    $scope.loadNext = function() {
        $scope.searchParams.page++;
        $scope.setDisplayResults();
    };

    $scope.loadPrevious = function() {
        $scope.searchParams.page--;
        $scope.setDisplayResults();
    };

};
listController.$inject = ['$scope', '$routeParams', 'itemSearcher'];


controllers.controller('DonorListCtrl', ['$scope', '$injector',
  function($scope, $injector) {
      $injector.invoke(listController, this, {$scope: $scope});
      $scope.searchParams.documentType = 'donor';
      $scope.searchParams.fields = ['name', 'sex'];
      $scope.searchParams.columnHeaders = ['Name', 'Sex'];

      $scope.setDisplayResults();
  }
]);

controllers.controller('LineListCtrl', ['$scope', '$injector',
  function($scope, $injector) {
      $injector.invoke(listController, this, {$scope: $scope});
      $scope.searchParams.documentType = 'cellLine';
      $scope.searchParams.fields = ['name', 'donor', 'bioSamplesAccession'];
      $scope.searchParams.columnHeaders = ['Name', 'Donor', 'Biosamples ID'];

      $scope.setDisplayResults();
  }
]);
