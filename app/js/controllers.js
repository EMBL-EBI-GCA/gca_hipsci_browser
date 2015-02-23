'use strict';

/* Controllers */

var controllers = angular.module('ebiscBrowser.controllers', []);

controllers.controller('LineDetailCtrl', ['$scope', '$routeParams', 'esClient',
  function($scope, $routeParams, esClient) {
    $scope.data = esClient.getSource({
        index: 'hipsci',
        type: 'cell_line',
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

controllers.controller('DonorListCtrl', ['$scope', '$routeParams', 'donorSearcher',
  function($scope, $routeParams, esClient) {
    $scope.page = 0;

    $scope.search = function() {
        donorSearcher.search($scope.page)
        .then(function(resp) {
            $scope.data = resp;
        });
    };

    $scope.loadNext = function() {
        $scope.search($scope.page++);
    };

    $scope.loadPrevious = function() {
        $scope.search($scope.page--);
    };

    $scope.search();
  }
]);
