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


    $scope.search = function() {
        itemSearcher.search($scope.searchParams)
        .then(function(resp) {
            $scope.data = resp.hits.hits;
            $scope.numHits = resp.hits.total;
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
        $scope.search();
    };

    $scope.loadPrevious = function() {
        $scope.searchParams.page--;
        $scope.search();
    };

};
listController.$inject = ['$scope', '$routeParams', 'itemSearcher'];


controllers.controller('DonorListCtrl', ['$scope', '$injector',
  function($scope, $injector) {
      $injector.invoke(listController, this, {$scope: $scope});
      $scope.searchParams.documentType = 'donor';
      $scope.searchParams.fields = ['name', 'sex'];
      $scope.searchParams.columnHeaders = ['Name', 'Sex'];

      $scope.search();
  }
]);

controllers.controller('LineListCtrl', ['$scope', '$injector',
  function($scope, $injector) {
      $injector.invoke(listController, this, {$scope: $scope});
      $scope.searchParams.documentType = 'cellLine';
      $scope.searchParams.fields = ['name', 'donor', 'bioSamplesAccession'];
      $scope.searchParams.columnHeaders = ['Name', 'Donor', 'Biosamples ID'];

      $scope.search();
  }
]);

