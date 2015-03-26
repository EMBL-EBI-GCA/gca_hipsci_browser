'use strict';

var listComponents = angular.module('hipsciBrowser.listComponents', []);

listComponents.directive('listPagination', function() {
  return {
    restrict: 'E',
    scope: false,
    template: '<pagination total-items="ListPanelCtrl.numHits"'
        +' ng-model="ListPanelCtrl.currentPage" ng-change="ListPanelCtrl.setPage()"'
        +' items-per-page="ListPanelCtrl.hitsPerPage" max-size=3'
        +' class="pagination-sm" boundary-links="true" rotate="false" ></pagination>'
  };
});

listComponents.directive('listSearchBox', function() {
  return {
    restrict: 'E',
    scope: false,
    template: '<span>Search:<input ng-model="ListPanelCtrl.query" ng-change="ListPanelCtrl.refreshSearch()"></input></span>'
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
        scope.filterNoData = false;
        scope.aggs = [];
        scope.aggsOther = 0;
        scope.aggsNoData = 0;
        scope.collapsed = true;
        scope.buttonText = '+';


        var disableCallback = function() {
            scope.filteredTerms = {};
            scope.filterNoData = false;
            for (var i=0; i<scope.aggs.length; i++) {
                scope.aggs[i]['doc_count'] = '';
            }
            scope.aggsOther = 0;
            scope.aggsNoData = 0;
        };
        var registerFilter = function() {
            var filtTermsArr = Object.keys(scope.filteredTerms);
            var filterReq = {};
            if (filtTermsArr.length == 0) {
                if (scope.filterNoData) {
                    filterReq = {missing: {field: scope.field}};
                }
                else {
                    filterReq = undefined;
                }
            }
            else if (filtTermsArr.length == 1) {
                filterReq = {term: {}};
                filterReq.term[scope.field] = filtTermsArr[0];
            }
            else {
                filterReq = {terms: {execution: 'or'}};
                filterReq.terms[scope.field] = filtTermsArr;
            }
            if (filtTermsArr.length >0 && scope.filterNoData) {
                filterReq = {or: [filterReq, {missing: {field: scope.field}}]};
            }
            ListPanelCtrl.registerFilter(scope.field, filterReq, disableCallback);
        };

        var aggReq = { terms: {field: scope.field, size: 20}};
        var aggMissingReq = {missing: {field: scope.field}};
        var processAggResp = function(resps) {
            scope.aggs = resps[0].buckets.sort(function(a,b) {
                if (scope.filteredTerms.hasOwnProperty(b['key']) == scope.filteredTerms.hasOwnProperty(a['key'])) {
                    return b['doc_count'] - a['doc_count'];
                }
                return scope.filteredTerms.hasOwnProperty(b['key']);
            });
            if (scope.aggs.length == 0) {
                for (var aggKey in scope.filteredTerms) {
                    scope.aggs.push({key: aggKey, doc_count: 0});
                }
            }
            scope.aggsOther = resps[0].sum_other_doc_count;
            scope.aggsNoData = resps[1].doc_count;
        };
        ListPanelCtrl.registerAggregate(scope.field, [aggReq,aggMissingReq], true, processAggResp);
        var ulElem = iElement.find("ul").first();
        scope.buttonRequired = function() {
            var buttonRequired = !scope.collapsed || (ulElem.prop('scrollHeight') > ulElem.height());
            return buttonRequired;
        };

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
        scope.handleNoDataEvent = function() {
            scope.filterNoData = !scope.filterNoData;
            registerFilter();
            ListPanelCtrl.refreshSearch();
        }

        scope.toggleCollapse = function() {
            scope.collapsed = !scope.collapsed;
            scope.buttonText = scope.collapsed ? '+' : '-';
        };

    }
  };
});



listComponents.directive('facetsClear', [function() {
  return {
    restrict: 'E',
    require: '^listPanel',
    scope: {
      'text': '@'
    },
    link: function(scope, element, attrs, ListPanelController) {
      scope.clearParent = function() {
        ListPanelController.clearFilters();
      };
    },
    template: '<button class="btn btn-primary" ng-click="clearParent()" ng-bind="text"></button>'
  };
}]);
