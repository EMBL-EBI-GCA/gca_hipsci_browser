'use strict';

var dependencies = [
  'ngRoute',
  'ngSanitize',
  'hipsciBrowser.services',
  'hipsciBrowser.controllers',
  'hipsciBrowser.navigation',
  'hipsciBrowser.listUtils',
  'hipsciBrowser.listComponents',
  'ui.bootstrap',
];

// Declare app level module which depends on filters, and services
var hipsciBrowser = angular.module('hipsciBrowser', dependencies);

hipsciBrowser.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
    when('/lines/:ipscName', {
      templateUrl: 'partials/line-detail.html',
      controller: 'LineDetailCtrl'
    }).
    when('/donors', {
      templateUrl: 'partials/donor-list.html',
      controller: 'DonorCtrl',
      controllerAs: 'DonorCtrl',
    }).
    when('/lines', {
      templateUrl: 'partials/line-list.html',
      controller: 'LineCtrl',
      controllerAs: 'LineCtrl',
    }).
    when('/donors/:donorName', {
      templateUrl: 'partials/donor-detail.html',
      controller: 'DonorDetailCtrl'
    }).
    otherwise({
      redirectTo: '/lines/'
    });
  }
]);

/*
hipsciBrowser.run(function($rootScope, $templateCache) {
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        if (typeof(current) !== 'undefined'){
            $templateCache.remove(current.templateUrl);
        }
    });
}); 
*/
