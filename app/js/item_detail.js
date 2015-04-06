'use strict';

var itemDetail = angular.module('hipsciBrowser.itemDetail', []);

/*
itemDetail.directive('itemDetailDl', function() {
  return {
    restrict: 'A',
    scope: false,
    link: function(scope, iElement, iAttrs) {
        var widestDt;
        var widestDtWidth = 0;
        iElement.find('dt').each(function(index, el) {
            if (el.scrollWidth >= widestDtWidth) {
                widestDt = el; widestDtWidth = el.scrollWidth;
            } 
        });
        console.log(widestDt);

        scope.itemDetailDl = {
            dtStyle: function() { return {
                width: widestDt.scrollWidth + "px",
                overflow: "visible"
            };},
            ddStyle: function() { return {
                marginLeft: widestDt.scrollWidth + 20 + "px",
                overflow: "visible"
            };}
        };
    }
  };
});
*/

itemDetail.directive('itemDetailDl', ['$window', function($window) {
  return {
    restrict: 'A',
    scope: false,
    compile: function(tElement) {
        tElement.addClass('dl-horizontal');
    return {
    post: function(scope, iElement, iAttrs) {
        var setProperties = function() {
            var dtEls = iElement.find('dt');
            var ddEls = iElement.find('dd');
            if (! dtEls.length) {
                return;
            }
            if (dtEls.first().position().top === ddEls.first().position().top) {
                var dtWidth = iElement.width() * 0.3;
                dtEls.width(dtWidth);
                ddEls.css('margin-left', dtWidth + 20 + 'px');
            }
            else {
                dtEls.width(iElement.width());
                ddEls.css('margin-left', 40 + 'px');
            }
        };
        //setProperties();

        var win = angular.element($window);
        win.bind('resize', setProperties);

        scope.$watch('data', setProperties);

    }
    };
    }
  };
}]);
