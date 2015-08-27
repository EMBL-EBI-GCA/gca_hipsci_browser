'use strict';

var dependencies = [
  'ngRoute',
  'ngSanitize',
  'hipsciBrowser.services',
  'hipsciBrowser.controllers',
  'hipsciBrowser.navigation',
  'hipsciBrowser.listPanel',
  'hipsciBrowser.listComponents',
  'ui.bootstrap',
];

// Declare app level module which depends on filters, and services
var hipsciBrowser = angular.module('hipsciBrowser', dependencies);

hipsciBrowser.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
    when('/lines/:ipscName', {
      templateUrl: 'partials.20150827/line-detail.html',
      controller: 'LineDetailCtrl',
      controllerAs: 'LineCtrl',
    }).
    when('/donors/:donorName', {
      templateUrl: 'partials.20150827/donor-detail.html',
      controller: 'DonorDetailCtrl'
    }).
    when('/lines', {
      templateUrl: 'partials.20150827/line-list.html',
      controller: 'LineListCtrl',
      controllerAs: 'LineCtrl',
    }).
    when('/donors', {
      templateUrl: 'partials.20150827/donor-list.html',
      controller: 'DonorListCtrl',
      controllerAs: 'DonorCtrl',
    }).
    when('/api', {
      templateUrl: 'partials.20150827/api.html',
    }).
    otherwise({
      redirectTo: '/lines/'
    });
  }
]);
