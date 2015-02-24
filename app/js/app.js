'use strict';

var dependencies = [
  'ngRoute',
  'ngSanitize',
  'ebiscBrowser.services',
  'ebiscBrowser.controllers',
];

// Declare app level module which depends on filters, and services
var ebiscBrowser = angular.module('ebiscBrowser', dependencies);

ebiscBrowser.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
    when('/lines/:ipscName', {
      templateUrl: 'partials/line-detail.html',
      controller: 'LineDetailCtrl'
    }).
    when('/donors', {
      templateUrl: 'partials/donor-list.html',
      controller: 'DonorListCtrl'
    }).
    when('/lines', {
      templateUrl: 'partials/line-list.html',
      controller: 'LineListCtrl'
    }).
    when('/donors/:donorName', {
      templateUrl: 'partials/donor-detail.html',
      controller: 'DonorDetailCtrl'
    }).
    otherwise({
      redirectTo: '/lines/HPSI0413i-uahf_3'
    });
  }
]);
