'use strict';

/* Controllers */

var controllers = angular.module('hipsciBrowser.controllers', []);

controllers.controller('LineDetailCtrl', ['$scope', '$routeParams', 'apiClient',
  function($scope, $routeParams, apiClient) {
    $scope.data = apiClient.getSource({
        type: 'cellLine',
        id: $routeParams.ipscName
    }).success(function(resp) {
        console.log(resp);
        $scope.data = resp['_source'];
    });
  }
]);

controllers.controller('DonorDetailCtrl', ['$scope', '$routeParams', 'apiClient',
  function($scope, $routeParams, apiClient) {
    $scope.data = apiClient.getSource({
        index: 'hipsci',
        type: 'donor',
        id: $routeParams.donorName
    }).success(function(resp) {
        $scope.data = resp['_source'];
    });
  }
]);

