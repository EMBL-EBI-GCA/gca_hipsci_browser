'use strict';

/* Controllers */

var controllers = angular.module('hipsciBrowser.controllers', []);

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

