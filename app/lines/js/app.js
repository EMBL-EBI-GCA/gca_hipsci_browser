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
  'markdown'
];

// Declare app level module which depends on filters, and services
var hipsciBrowser = angular.module('hipsciBrowser', dependencies);

hipsciBrowser.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
    when('/lines/:ipscName', {
      templateUrl: 'partials/line-detail.html?ver=20170308d',
      controller: 'LineDetailCtrl',
      controllerAs: 'LineCtrl',
    }).
    when('/lines/:ipscName/:assay', {
      templateUrl: 'partials/line-assay-detail.html?ver=20170308d',
      controller: 'LineAssayCtrl',
      controllerAs: 'LineCtrl',
    }).
    when('/donors/:donorName', {
      templateUrl: 'partials/donor-detail.html?ver=20170308d',
      controller: 'DonorDetailCtrl'
    }).
    when('/lines', {
      templateUrl: 'partials/line-list.html?ver=20170308d',
      controller: 'LineListCtrl',
      controllerAs: 'LineCtrl',
      reloadOnSearch: false,
    }).
    when('/donors', {
      templateUrl: 'partials/donor-list.html?ver=20170308d',
      controller: 'DonorListCtrl',
      controllerAs: 'DonorCtrl',
      reloadOnSearch: false,
    }).
    when('/files', {
      templateUrl: 'partials/file-list.html?ver=20170308d',
      controller: 'FileListCtrl',
      controllerAs: 'FileCtrl',
      reloadOnSearch: false,
    }).
    when('/datasets', {
      templateUrl: 'partials/dataset-table.html?ver=20170308d',
      controller: 'DatasetTableCtrl',
      controllerAs: 'DSCtrl',
    }).
    when('/cohorts/:cohortId', {
      templateUrl: 'partials/cohort-detail.html?ver=20170308e',
      controller: 'CohortDetailCtrl',
      controllerAs: 'CohortCtrl',
    }).
    when('/assays/:assayName', {
      templateUrl: 'partials/assay-detail.html?ver=20170308e',
      controller: 'AssayDetailCtrl',
      controllerAs: 'AssayCtrl',
    }).
    when('/api', {
      templateUrl: 'partials/api.html?ver=20170308d',
    }).
    otherwise({
      redirectTo: '/lines/'
    });
  }
]);
