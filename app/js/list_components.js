'use strict';

var listComponents = angular.module('hipsciBrowser.listComponents', []);

listComponents.directive('listPagination', function() {
  return {
    restrict: 'E',
    scope: false,
    template: '<pagination total-items="ListPanelCtrl.numHits"'
        +' ng-model="ListPanelCtrl.currentPage" ng-change="ListPanelCtrl.setPage()"'
        +' items-per-page="ListPanelCtrl.hitsPerPage" max-size="ListPanelCtrl.numPages"'
        +' class="pagination-sm" boundary-links="true" rotate="false" ></pagination>'
  };
});

listComponents.directive('orFacet', function() {
  return {
    restrict: 'E',
    scope: {
        title: '@',
        field: '@',
    },
    require: '^listPanel',
    templateUrl: 'partials/uiFacet.html',
    link: function(scope, iElement, iAttrs, ListPanelCtrl) {
        scope.filteredTerms = {};
        scope.aggs = [];
        scope.collapsed = true;
        scope.buttonText = '+';
        scope.buttonRequired = false;


        var disableCallback = function() {
            scope.filteredTerms = {};
            for (var i=0; i<scope.aggs.length; i++) {
                scope.aggs[i] = '';
            }
        };
        var registerFilter = function() {
            var filtTermsArr = Object.keys(scope.filteredTerms);
            var filterReq = {};
            if (filtTermsArr.length == 0) {
                filterReq = undefined;
            }
            else if (filtTermsArr.length == 1) {
                filterReq = {term: {}};
                filterReq['term'][scope.field] = filtTermsArr[0];
            }
            else {
                filterReq = {terms: {execution: 'or'}};
                filterReq['terms'][scope.field] = filtTermsArr;
            }
            ListPanelCtrl.registerFilter(scope.field, filterReq, disableCallback);
        };

        var aggReq = { terms: {field: scope.field } };
        var ulElem = iElement.find("ul").first();
        var processAggResp = function(resp) {
            scope.aggs = resp.buckets.sort(function(a,b) {
                return b['doc_count'] - a['doc_count'];
            });
            scope.buttonRequired = (ulElem.prop('scrollHeight') > ulElem.height());
        };
        ListPanelCtrl.registerAggregate(scope.field, aggReq, true, processAggResp);
        ListPanelCtrl.refreshSearch();

        scope.handleEvent = function(agg) {
            var term = agg['key'];
            if (scope.filteredTerms.hasOwnProperty(term)) {
                delete scope.filteredTerms[term];
            }
            else {
                scope.filteredTerms[term] = true;
            }
            registerFilter();
            ListPanelCtrl.refreshSearch();
        };

        scope.toggleCollapse = function() {
            scope.collapse = !scope.collapse;
            scope.buttonText = scope.collapse ? '+' : '-';
        };

    }
  };
});
