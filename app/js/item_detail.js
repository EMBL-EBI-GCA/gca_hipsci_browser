'use strict';

var itemDetail = angular.module('hipsciBrowser.itemDetail', []);

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
