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
      templateUrl: 'partials/line-detail.html?ver=20170705',
      controller: 'LineDetailCtrl',
      controllerAs: 'LineCtrl',
    }).
    when('/lines/:ipscName/:assay', {
      templateUrl: 'partials/line-assay-detail.html?ver=20170524',
      controller: 'LineAssayCtrl',
      controllerAs: 'LineCtrl',
    }).
    when('/donors/:donorName', {
      templateUrl: 'partials/donor-detail.html?ver=20170503c',
      controller: 'DonorDetailCtrl'
    }).
    when('/lines', {
      templateUrl: 'partials/line-list.html?ver=20170503c',
      controller: 'LineListCtrl',
      controllerAs: 'LineCtrl',
      reloadOnSearch: false,
    }).
    when('/donors', {
      templateUrl: 'partials/donor-list.html?ver=20170503c',
      controller: 'DonorListCtrl',
      controllerAs: 'DonorCtrl',
      reloadOnSearch: false,
    }).
    when('/files', {
      templateUrl: 'partials/file-list.html?ver=20170503c',
      controller: 'FileListCtrl',
      controllerAs: 'FileCtrl',
      reloadOnSearch: false,
    }).
    when('/datasets', {
      templateUrl: 'partials/dataset-table.html?ver=20170503c',
      controller: 'DatasetTableCtrl',
      controllerAs: 'DSCtrl',
    }).
    when('/cohorts/:cohortId', {
      templateUrl: 'partials/cohort-detail.html?ver=20170503c',
      controller: 'CohortDetailCtrl',
      controllerAs: 'CohortCtrl',
    }).
    when('/assays/:assayName', {
      templateUrl: 'partials/assay-detail.html?ver=20170503c',
      controller: 'AssayDetailCtrl',
      controllerAs: 'AssayCtrl',
    }).
    when('/search', {
      templateUrl: 'partials/search.html?ver=20170503c',
      controller: 'SearchCtrl',
      controllerAs: 'SearchCtrl',
    }).
    when('/api', {
      controller: function() {
        window.location.replace("/data/faq/api");
      },
      template: '<div></div>',
    }).
    otherwise({
      redirectTo: '/lines/'
    });
  }
]);
