'use strict';

var navigation = angular.module('hipsciBrowser.navigation', []);

navigation.directive('navigationBanner', [function() {
    var activeLink = function (viewLocation) {
        return viewLocation == $location.path();
    };

    return {
        restrict: 'E',
        templateUrl : 'partials/navigation.html?ver=20170324',
        scope : true,
        link : function (scope) {
            scope.collapsed = {};
            scope.isCollapsed = function(label) {
              return !scope.collapsed.hasOwnProperty(label) ? true : scope.collapsed[label];
            }
            scope.toggleCollapse = function(label) {
              scope.collapsed[label] = !scope.isCollapsed(label);
            }
            scope.submit = function() {
              if (scope.searchTerm) {
                window.location.href="#/search?q="+scope.searchTerm;
              }
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
