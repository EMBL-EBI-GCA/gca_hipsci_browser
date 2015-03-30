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
    template: '<span>Search:<input ng-model="ListPanelCtrl.query" ng-change="ListPanelCtrl.delayedSearch()" ng-keypress="ListPanelCtrl.delayedSearch($event)"></input></span>'
  };
});

listComponents.directive('aggsFilter', function() {
  return {
    restrict: 'E',
    scope: {
        title: '@',
        field: '@',
        existsLabels: '@',
        type: '@'
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

        var existsFields = scope.$parent.$eval(scope.existsFields);
        var existsLabels = scope.$parent.$eval(scope.existsLabels);

        var disableCallback = function() {
            scope.filteredTerms = {};
            scope.filterNoData = false;
            for (var i=0; i<scope.aggs.length; i++) {
                scope.aggs[i]['doc_count'] = '';
            }
            scope.aggsOther = 0;
            scope.aggsNoData = 0;
        };
        var registerTermsFilter = function() {
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
        var registerExistsFilter = function() {
            var filtTermsArr = Object.keys(scope.filteredTerms);
            var filterReq = undefined;
            if (filtTermsArr.length == 1) {
                filterReq = {exists: {field: filtTermsArr[0]}};
            }
            else if (filtTermsArr.length > 1) {
                filterReq = {and: []};
                for (var i=0; i<filtTermsArr.length; i++) {
                    filterReq.and.push({exists: {field: filtTermsArr[i]}});
                }
            }
            ListPanelCtrl.registerFilter(scope.field, filterReq, disableCallback);
        };

        var processTermsAggResp = function(resps) {
            scope.aggs = resps[0].buckets.sort(function(a,b) {
                if (scope.filteredTerms.hasOwnProperty(b['key']) == scope.filteredTerms.hasOwnProperty(a['key'])) {
                    return b['doc_count'] - a['doc_count'];
                }
                return scope.filteredTerms.hasOwnProperty(b['key']);
            });
            for (var i=0; i<scope.aggs.length; i++) {
                scope.aggs[i].field = scope.aggs[i].key;
            }
            if (scope.aggs.length == 0) {
                for (var aggKey in scope.filteredTerms) {
                    scope.aggs.push({key: aggKey, doc_count: 0, field: aggKey});
                }
            }
            scope.aggsOther = resps[0].sum_other_doc_count;
            scope.aggsNoData = resps[1].doc_count;
        };
        var processExistsAggResp = function(resps) {
            scope.aggs = [];
            if (resps.length != existsFields.length) {
                return;
            }
            for (var i=0; i<existsFields.length; i++) {
                if (resps[i].value >0) {
                    scope.aggs.push({key: existsLabels[i], doc_count: resps[i].value, field: existsFields[i]});
                }
            }
            scope.aggs = scope.aggs.sort(function(a,b) {
                if (scope.filteredTerms.hasOwnProperty(b['field']) == scope.filteredTerms.hasOwnProperty(a['field'])) {
                    return b['doc_count'] - a['doc_count'];
                }
                return scope.filteredTerms.hasOwnProperty(b['field']);
            });
        };
        if (scope.type == 'terms') {
            var aggReq = { terms: {field: scope.field, size: 20}};
            var aggMissingReq = {missing: {field: scope.field}};
            ListPanelCtrl.registerAggregate(scope.field, [aggReq,aggMissingReq], true, processTermsAggResp);
        }
        else if (scope.type == 'exists') {
            var aggReqs = [];
            for (var i=0; i<existsFields.length; i++) {
                aggReqs.push({value_count: {field: existsFields[i]}});
            }
            ListPanelCtrl.registerAggregate(scope.field, aggReqs, false, processExistsAggResp);
        }
        var ulElem = iElement.find("ul").first();
        scope.buttonRequired = function() {
            var buttonRequired = !scope.collapsed || (ulElem.prop('scrollHeight') > ulElem.height());
            return buttonRequired;
        };

        scope.handleEvent = function(agg) {
            var term = scope.type=='terms' ? agg['key'] : agg['field'];
            if (scope.filteredTerms.hasOwnProperty(term)) {
                delete scope.filteredTerms[term];
            }
            else {
                scope.filteredTerms[term] = true;
            }
            if (scope.type == 'terms') {
                registerTermsFilter();
            }
            else if (scope.type == 'exists') {
                registerExistsFilter();
            }
            else return;
            ListPanelCtrl.refreshSearch();
        };
        scope.handleNoDataEvent = function() {
            scope.filterNoData = !scope.filterNoData;
            registerTermsFilter();
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


listComponents.directive('listTable', ['$compile', function($compile) {
  return {
    restrict: 'E',
    scope: {
        type: '@type',
        compileHead: '=',
        compileRow: '=',
        processHitFields: '='
    },
    require: '^listPanel',
    replace: false,
    template: '<table><thead ><tr class="slanted"></tr></thead><tbody></tbody></table>',
    compile: function(tElement, tAttrs) {
      return {
        post: function(scope, iElement, iAttrs, listPanelCtrl) {

            scope.processedHits = [];
            var tableEl = iElement.find('table');
            tableEl.attr('class', iAttrs.class);
            iElement.removeAttr('class');

            var compileTable = function (fields) {
                var headEl = iElement.find('thead');
                var bodyEl = iElement.find('tbody');
                var headTrEl = headEl.find('tr');
                var headTrChildren = scope.compileHead(fields);
                for (var i=0; i<headTrChildren.length; i++) {
                    headTrEl.append(headTrChildren[i]);
                };

                bodyEl.append('<tr ng-repeat="hit in processedHits"></tr>');
                var rowEl = bodyEl.find('tr');
                var rowTrChildren = scope.compileRow(fields);
                for (var i=0; i<rowTrChildren.length; i++) {
                    rowEl.append(rowTrChildren[i]);
                }

                var linkFunc = $compile(tableEl);
                linkFunc(scope);
            };

            var processHits = function(respHits, fields) {
                scope.processedHits = [];
                for (var i=0; i<respHits.length; i++) {
                    scope.processedHits.push(scope.processHitFields(respHits[i].fields, fields));
                }
            };

            listPanelCtrl.registerTable(compileTable, processHits);
    }};}
  };
}]);

listComponents.directive('listInitFields', [function() {
  return {
    restrict: 'E',
    require: '^listPanel',
    scope: {exportHeadersMap : '=', fields: '=' },
    link: function(scope, element, attrs, ListPanelController) {
        console.log(scope.exportHeadersMap);
        ListPanelController.registerFields(scope.fields, scope.exportHeadersMap);
    },
  };
}]);
