'use strict';

var navigation = angular.module('hipsciBrowser.navigation', []);

navigation.directive('navigationBanner', ['$location', function($location) {
    var activeLink = function (viewLocation) {
        return viewLocation == $location.path();
    };

    return {
        restrict: 'E',
        templateUrl : 'partials/navigation.html?ver=20170220',
        scope : true,
        link : function (scope) {
            scope.activeLink = activeLink;
        }
    };
}]);

navigation.directive('navigationTabs', ['$location', function($location) {
    var activeLink = function (viewLocation) {
        return viewLocation == $location.path();
    };

    return {
        restrict: 'E',
        templateUrl : 'partials/navigation-tabs.html?ver=20170220',
        scope : true,
        link : function (scope) {
            scope.activeLink = activeLink;
        }
    };
}]);
