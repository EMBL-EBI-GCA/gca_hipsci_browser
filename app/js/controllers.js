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

controllers.controller('DonorListCtrl', ['$scope', '$routeParams', 'itemSearcher',
  function($scope, $routeParams, itemSearcher) {
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
            for (var i=0; i<$scope.data.length; i++) {
                $scope.data[i].columnHrefs = {};
                for (var j=0; j<$scope.searchParams.fields.length; j++) {
                    var field = $scope.searchParams.fields[j];
                    if (field == 'name') {
                        $scope.data[i].columnHrefs[field] = "#/donors/" + $scope.data[i].fields[field][0];
                    }
                }
            }
        });
    };

    $scope.exportData = function(format) {
        itemSearcher.exportData($scope.searchParams, format);
    };

    $scope.loadNext = function() {
        $scope.searchParams.page++;
        $scope.search();
    };

    $scope.loadPrevious = function() {
        $scope.searchParams.page--;
        $scope.search();
    };

    $scope.search();
  }
]);
