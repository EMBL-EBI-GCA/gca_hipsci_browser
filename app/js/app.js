'use strict';

var dependencies = [
  'ngRoute',
  'ngSanitize',
  'hipsciBrowser.services',
  'hipsciBrowser.controllers',
  'hipsciBrowser.navigation',
  'hipsciBrowser.listUtils',
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
      controller: 'ListCtrl',
      controllerAs: 'ListCtrl',
      resolve: {listTypeConfig: 'donorConfig'}
    }).
    when('/lines', {
      templateUrl: 'partials/line-list.html',
      controller: 'ListCtrl',
      controllerAs: 'ListCtrl',
      resolve: {listTypeConfig: 'lineConfig'}
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
