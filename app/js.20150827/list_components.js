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
    template: '<div class="search-box">Search:<input ng-model="ListPanelCtrl.query" ng-change="ListPanelCtrl.delayedSearch()" ng-keypress="ListPanelCtrl.delayedSearch($event)"></input></div>'
  };
});

listComponents.directive('aggsFilter', function() {
  return {
    restrict: 'E',
    scope: {
        title: '@',
        field: '@',
        showNoData: '@',
        sortFunction: '@',
        multiBoolean: '@',
    },
    require: '^listPanel',
    templateUrl: 'partials.20150827/uiFacet.html',
    link: function(scope, iElement, iAttrs, ListPanelCtrl) {
        scope.filteredTerms = {};
        scope.filterNoData = false;
        scope.aggs = [];
        scope.aggsOther = 0;
        scope.aggsNoData = 0;
        scope.collapsed = true;
        scope.buttonText = '+';

        var sortFunction = scope.$parent.$eval(scope.sortFunction) || function() {return 0;};

        scope.ulMaxHeight = 0;

        var showNoData = scope.$parent.$eval(scope.showNoData) || false;

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
            var filtTermsArr = [];
            for (var key in scope.filteredTerms) {
                if (key != '_noData') {
                    filtTermsArr.push(key);
                }
            };
            var filterReq = {};
            if (filtTermsArr.length == 0) {
                if (scope.filteredTerms['_noData']) {
                    filterReq = {missing: {field: scope.field}};
                }
                else {
                    filterReq = undefined;
                }
            }
            else if (filtTermsArr.length == 1) {
                if (scope.filteredTerms['_noData']) {
                    filterReq = {missing: {field: scope.field}};
                }
                filterReq = {term: {}};
                filterReq.term[scope.field] = filtTermsArr[0];
            }
            else {
                filtTermsArr = filtTermsArr.sort(); // This is to help with caching
                filterReq = {terms: {execution: scope.multiBoolean || 'or'}};
                filterReq.terms[scope.field] = filtTermsArr;
            }
            if (filtTermsArr.length >0 && scope.filteredTerms['_noData']) {
                filterReq = {or: [filterReq, {missing: {field: scope.field}}]};
            }
            ListPanelCtrl.registerFilter(scope.field, filterReq, disableCallback);
        };

        var processAggResp = function(resps) {
            var aggs = {};
            scope.aggsOther = resps[0].sum_other_doc_count;
            for (var i=0; i<resps[0].buckets.length; i++) {
                var respAgg = resps[0].buckets[i];
                respAgg.field = respAgg.key;
                aggs[respAgg.key] = respAgg;
            }
            if (showNoData && resps[1].doc_count) {
                aggs['_noData'] = {key: 'No data', doc_count: resps[1].doc_count, field: '_noData'};
            }
            
            for (var aggField in scope.filteredTerms) {
                if (!aggs.hasOwnProperty(aggField)) {
                    var aggKey = aggField == '_noData' ? 'No data' : aggField;
                    aggs[aggField] = {key: aggKey, doc_count: 0, field: aggField};
                }
            }

            if (scope.aggs.length == 0) {
                var sortedKeys = Object.keys(aggs).sort(function(a,b) {
                    if (a=='_noData') {return a;}
                    if (b=='_noData') {return b;}
                    return sortFunction(a,b) || aggs[b].doc_count - aggs[a].doc_count;
                });
                for (var i=0; i<sortedKeys.length; i++) {
                    scope.aggs.push(aggs[sortedKeys[i]]);
                }
            }
            else {
                var oldFields = {};
                var fieldsArr = [];
                for (var i=0; i<scope.aggs.length; i++) {
                    var field = scope.aggs[i].field;
                    oldFields[field] = true;
                    fieldsArr.push(field);
                }
                var newFieldsArr = [];
                for (var field in aggs) {
                    if (!oldFields[field]) {
                        newFieldsArr.push(field);
                    }
                }
                fieldsArr.concat(newFieldsArr.sort(function(a,b) {
                    if (a=='_noData') {return a;}
                    if (b=='_noData') {return b;}
                    return sortFunction(a,b) || aggs[b].doc_count - aggs[a].doc_count;
                }));
                scope.aggs = [];
                for (var i=0; i<fieldsArr.length; i++) {
                    var field = fieldsArr[i];
                    if (aggs.hasOwnProperty(field)) {
                        scope.aggs.push(aggs[field]);
                    }
                    else {
                        var key = field == '_noData'? 'No data'
                                : field;
                        scope.aggs.push({key: key, doc_count: 0, field: field});
                    }
                }
            }

        };

        var ulElem = iElement.find("ul").first();
        scope.buttonRequired = function() {
            var scrollHeight = ulElem.prop('scrollHeight');
            if (scope.ulMaxHeight == 0  && (scrollHeight > ulElem.height())) {
                scope.ulMaxHeight = ulElem.height();
            }
            if (scope.ulMaxHeight >0) {
                var buttonRequired = scrollHeight > scope.ulMaxHeight ? true : false;
                return buttonRequired;
            }
            return false;
        };

        scope.handleEvent = function(agg) {
            var term = agg['field'];
            if (scope.filteredTerms.hasOwnProperty(term)) {
                delete scope.filteredTerms[term];
            }
            else {
                if (agg['doc_count'] == 0) {
                    return;
                }
                scope.filteredTerms[term] = true;
            }
            registerTermsFilter();
            ListPanelCtrl.refreshSearch();
        };

        scope.toggleCollapse = function() {
            scope.collapsed = !scope.collapsed;
            scope.buttonText = scope.collapsed ? '+' : '-';
        };

        var aggReq = { terms: {field: scope.field, size: 20}};
        var aggMissingReq = {missing: {field: scope.field}};
        var aggReqsArr = showNoData ? [aggReq, aggMissingReq] : [aggReq];
        ListPanelCtrl.registerAggregate(scope.field, aggReqsArr, processAggResp);

        iAttrs.$set('list-panel-registered', true);
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
        compileHead: '=',
        compileRow: '=',
        processHitFields: '=',
        defaultSortFields: '@',
    },
    require: '^listPanel',
    replace: false,
    template: '<table><thead ><tr class="slanted"></tr></thead><tbody></tbody></table>',
    compile: function(tElement, tAttrs) {
      return {
        post: function(scope, iElement, iAttrs, listPanelCtrl) {

            scope.processedHits = [];
            var defaultSortFields = scope.$eval(scope.defaultSortFields) || [];
            scope.sortField = '';
            scope.sortAscending = true;
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
                    var appended = headTrEl.children().last();
                    if (appended.hasClass('sort')) {
                        var fieldsStr = "'"+fields[i]+"'";
                        appended.attr('ng-class', '{sortAsc: (sortField=='+fieldsStr+' && sortAscending), sortDesc: (sortField=='+fieldsStr+' && !sortAscending)}');
                        appended.attr('ng-click', 'registerSortOrder('+fieldsStr+')');
                    }
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

            scope.registerSortOrder = function(field) {
                if (scope.sortField == field) {
                    if (scope.sortAscending) {
                        scope.sortAscending = false
                    }
                    else {
                        scope.sortField = '';
                        scope.sortAscending = true;
                    }
                }
                else {
                    scope.sortField = field;
                    scope.sortAscending = true;
                }
                
                if (scope.sortField.length >0) {
                    var sortFields = [[scope.sortField, scope.sortAscending]];
                    for (var i=0; i<defaultSortFields.length; i++) {
                        if (defaultSortFields[i][0] != scope.sortField) {
                            sortFields.push(defaultSortFields[i]);
                        }
                    }
                    listPanelCtrl.registerSortOrders(sortFields);
                }
                else {
                    listPanelCtrl.registerSortOrders(defaultSortFields);
                }
            };

            listPanelCtrl.registerTable(compileTable, processHits, defaultSortFields);
            iAttrs.$set('list-panel-registered', true);
    }};}
  };
}]);

listComponents.directive('listInitFields', [function() {
  return {
    restrict: 'E',
    require: '^listPanel',
    scope: {exportHeadersMap : '=', fields: '=' },
    link: function(scope, iElement, iAttrs, ListPanelController) {
        ListPanelController.registerFields(scope.fields, scope.exportHeadersMap);
        iAttrs.$set('list-panel-registered', true);
    },
  };
}]);
