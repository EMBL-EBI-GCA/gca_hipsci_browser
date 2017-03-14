'use strict';

var navigation = angular.module('hipsciBrowser.navigation', []);

navigation.directive('navigationBanner', [function() {
    var activeLink = function (viewLocation) {
        return viewLocation == $location.path();
    };

    return {
        restrict: 'E',
        templateUrl : 'partials/navigation.html?ver=20170314',
        scope : true,
        link : function (scope) {
            scope.collapsed = {};
            scope.isCollapsed = function(label) {
              return !scope.collapsed.hasOwnProperty(label) ? true : scope.collapsed[label];
            }
            scope.toggleCollapse = function(label) {
              scope.collapsed[label] = !scope.isCollapsed(label);
            }
        }
    };
}]);

navigation.directive('navigationTabs', ['$location', function($location) {
    var activeLink = function (viewLocation) {
        return viewLocation == $location.path();
    };

    return {
        restrict: 'E',
        templateUrl : 'partials/navigation-tabs.html?ver=20170308',
        scope : true,
        link : function (scope) {
            scope.activeLink = activeLink;
        }
    };
}]);
