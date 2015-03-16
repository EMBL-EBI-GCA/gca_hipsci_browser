'use strict';

var navigation = angular.module('hipsciBrowser.navigation', []);

navigation.directive('navigationBanner', ['$location', function($location) {
    var activeLink = function (viewLocation) {
        return viewLocation == $location.path();
    };

    return {
        restrict: 'E',
        templateUrl : 'partials/navigation.html',
        scope : true,
        link : function (scope) {
            scope.activeLink = activeLink;
        }
    };
}]);
