'use strict';

var listComponents = angular.module('hipsciBrowser.listComponents', []);

listComponents.directive('listPagination', function() {
  return {
    restrict: 'E',
    scope: false,
    template: '<pagination total-items="listPanelCtrl.cache.numHits"'
        +' ng-model="listPanelCtrl.cache.currentPage" ng-change="listPanelCtrl.search()"'
        +' items-per-page="listPanelCtrl.hitsPerPage" max-size=3'
        +' class="pagination-sm" boundary-links="true" rotate="false" ></pagination>',
    require: '^listPanel',
    link: function(scope, iElement, iAttr, listPanelCtrl) {
        scope.listPanelCtrl = listPanelCtrl;
    },
  };
});

listComponents.directive('listSearchBox', function() {
  return {
    restrict: 'E',
    scope: false,
    template: '<div class="search-box">Search:<input ng-model="listPanelCtrl.cache.query"'
            + 'ng-change="listPanelCtrl.search()" ng-keypress="listPanelCtrl.search($event)"></input></div>',
    require: '^listPanel',
    link: function(scope, iElement, iAttr, listPanelCtrl) {
        scope.listPanelCtrl = listPanelCtrl;
    }
  };
});

listComponents.directive('listErrorAlert', function() {
  return {
    restrict: 'E',
    scope: false,
    template: '<div class="alert alert-danger" role="alert" ng-if="apiStatus.error">'
            +    '<span class="glyphicon glyphicon-exclamation-sign" ></span>'
            +    '<span>Server error: {{apiStatus.code}} {{apiStatus.text}}</span>'
            +'</div>',
    require: '^listPanel',
    link: function(scope, iElement, iAttr, listPanelCtrl) {
        scope.apiStatus = listPanelCtrl.apiStatus;
    }
  };
});

listComponents.directive('aggsFilter', function() {
  return {
    restrict: 'E',
    scope: {
        title: '@',
        field: '@',
        sortFunction: '@',
        multiBoolean: '@',
    },
    require: ['aggsFilter', '^listPanel'],
    templateUrl: 'partials.20150827/uiFacet.html',
    controller: ['$scope', '$location', function($scope, $location) {
        var c = this;
        c.esAggRequest = { terms: {field: $scope.field, size: 20}};
        c.esFilterRequest = null;
        c.unFilteredTermsReq = false;
        var cache = null;

        c.initCache = function(listPanelCtrl) {
            if (!listPanelCtrl.cache.aggsFilters.hasOwnProperty($scope.field)) {
                listPanelCtrl.cache.aggsFilters[$scope.field] = {};
            }
            cache = listPanelCtrl.cache.aggsFilters[$scope.field];
            if (!cache.hasOwnProperty('collapsed')) {
                cache.collapsed = true;
            }
            $scope.collapsed = cache.collapsed;
        };

        c.createFilterRequest = function() {
            var filtTermsArr = jQuery.grep($scope.aggs, function(a) {return a.filtered});
            filtTermsArr = jQuery.map(filtTermsArr, function(a) {return a.term});
            if (filtTermsArr.length == 0) {
                c.esFilterRequest = null;
            }
            else if (filtTermsArr.length ==1) {
                c.esFilterRequest = {term: {}};
                c.esFilterRequest.term[$scope.field] = filtTermsArr[0];
            }
            else {
                filtTermsArr = filtTermsArr.sort(); // This is to help with caching
                c.esFilterRequest = {terms: {execution: $scope.multiBoolean || 'or'}};
                c.esFilterRequest.terms[$scope.field] = filtTermsArr;
            }
        };

        c.urlToFilteredTerms = function() {
            var filteredTerms = $location.search()[$scope.title+'[]'];
            return (typeof filteredTerms === 'undefined') ? []
                    : (filteredTerms.constructor === Array) ? filteredTerms
                    : [filteredTerms];
        };

        c.filteredTermsToUrl = function() {
            var filtTermsArr = [];
            for (var i=0; i<$scope.aggs.length; i++) {
                if ($scope.aggs[i].filtered) {
                    filtTermsArr.push($scope.aggs[i].term);
                }
            };
            $location.search($scope.title+'[]', filtTermsArr.length > 0 ? filtTermsArr : null); 
        };

        c.processAggResp = function (resp) {
            if (cache.hasOwnProperty('aggs')) {
                var respAggs = {};
                for (var i=0; i<resp.buckets.length; i++) {
                    respAggs[resp.buckets[i].key] = resp.buckets[i].doc_count;
                }
                for (var i=0; i<$scope.aggs.length; i++) {
                    $scope.aggs[i].doc_count = respAggs[$scope.aggs[i].term] || 0;
                }
            }
            else {
                var filtTerms = {};
                var numFiltTermsBefore = 0;
                var numFiltTermsAfter = 0;
                for (var i=0; i<$scope.aggs.length; i++) {
                    if ($scope.aggs[i].filtered) {
                        filtTerms[$scope.aggs[i].term] = 1;
                        numFiltTermsBefore +=1;
                    }
                }
                cache['aggs'] = [];
                for (var i=0; i<resp.buckets.length; i++) {
                    if (filtTerms.hasOwnProperty(resp.buckets[i].key)) {
                        numFiltTermsAfter +=1;
                    }
                    else {
                        filtTerms[resp.buckets[i].key] = 0;
                    }
                    cache.aggs.push({
                        term: resp.buckets[i].key,
                        doc_count: resp.buckets[i].doc_count,
                        unfilteredCount: resp.buckets[i].doc_count,
                        filtered: filtTerms[resp.buckets[i].key] > 0 ? true : false
                    });
                }
                cache.aggs = cache.aggs.sort(function(a,b) {
                    return filtTerms[b.term] - filtTerms[a.term]
                        || c.sortFunction(a,b);
                });
                c.unfilteredTermsReq = false;
                $scope.aggs = cache.aggs;
                if (numFiltTermsBefore != numFiltTermsAfter) {
                    c.filteredTermsToUrl();
                    c.createFilterRequest();
                }
            }
        };

        c.loadFromUrl = function(firstView) {
            if (firstView) {
                cache.collapsed = true;
                $scope.collapsed = true;
            }
            var filtTermsArr = c.urlToFilteredTerms();
            if (cache.hasOwnProperty('aggs')) {
                var numFiltTermsAllowed = 0;
                for (var i=0; i<cache.aggs.length; i++) {
                    if (jQuery.inArray(cache.aggs[i].term, filtTermsArr) >=0) {
                        numFiltTermsAllowed += 1;
                        cache.aggs[i].filtered = true;
                    }
                    else {
                        cache.aggs[i].filtered = false;
                    }
                }
                if (firstView) {
                    cache.aggs = cache.aggs.sort(function(a,b) {
                        return (b.filtered ? 1 : 0) - (a.filtered ? 1 : 0)
                            || c.sortFunction(a,b);
                    });
                }
                $scope.aggs = cache.aggs;
                if (numFiltTermsAllowed != filtTermsArr.length) {
                    c.filteredTermsToUrl();
                }
                c.createFilterRequest();
                c.unfilteredTermsReq = false;
            }
            else {
                $scope.aggs = [];
                for (var i=0; i<filtTermsArr.length; i++) {
                    $scope.aggs.push({
                        term: filtTermsArr[i],
                        doc_count: '',
                        filtered: true
                    });
                }
                if (filtTermsArr.length > 0) {
                    c.unfilteredTermsReq = true;
                }
            }
        };

        c.toggleCollapse = function() {
            cache.collapsed = ! cache.collapsed;
            $scope.collapsed = cache.collapsed;
        };

    }],
    link: function(scope, iElement, iAttrs, ctrls) {
        var aggsFilterCtrl = ctrls[0];
        var listPanelCtrl = ctrls[1];
        aggsFilterCtrl.sortFunction = scope.$parent.$eval(scope.sortFunction)
            || function(a, b) {b.unfilteredCount - a.unfilteredCount};

        listPanelCtrl.aggsFilterCtrls[scope.field] = aggsFilterCtrl;
        aggsFilterCtrl.initCache(listPanelCtrl);

        scope.ulMaxHeight = 0;
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
            if (!agg.filtered && ! agg.doc_count) {
                return;
            }
            agg.filtered = ! agg.filtered;
            aggsFilterCtrl.createFilterRequest();
            aggsFilterCtrl.filteredTermsToUrl();
            //listPanelCtrl.search();
        };

        scope.toggleCollapse = function() {
            aggsFilterCtrl.toggleCollapse();
        };

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


listComponents.directive('listTable', function() {
  return {
    restrict: 'E',
    scope: {
        compileHead: '=',
        compileRow: '=',
        processHitFields: '=',
        defaultSortFields: '@',
    },
    require: ['listTable', '^listPanel'],
    replace: false,
    template: '<table><thead ><tr class="slanted"></tr></thead><tbody></tbody></table>',
    link: function(scope, iElement, iAttrs, ctrls) {
        var listTableCtrl = ctrls[0];
        var listPanelCtrl = ctrls[1];
        listPanelCtrl.listTableCtrl = listTableCtrl;
        listTableCtrl.initCache(listPanelCtrl);
        listTableCtrl.iElement = iElement;
        listTableCtrl.defaultSortFields = scope.$eval(scope.defaultSortFields) || [];

        scope.processedHits = [];
        scope.sortField = '';
        scope.sortAscending = true;

        scope.registerSortOrder = function(field) {
            listTableCtrl.registerSortOrder(field);
            listPanelCtrl.search();
        };

        var tableEl = iElement.find('table');
        tableEl.attr('class', iAttrs.class);
        iElement.removeAttr('class');

        iAttrs.$set('list-panel-registered', true);
    },
    controller: ['$scope', '$compile', function($scope, $compile) {
        this.iElement = null;
        this.defaultSortFields = [];
        var cachedSortFields = null;

        this.initCache = function(listPanelCtrl) {
            cachedSortFields = listPanelCtrl.cache.sortFields;
        };

        this.compileTable = function (fields) {
            var headEl = this.iElement.find('thead');
            var bodyEl = this.iElement.find('tbody');
            var headTrEl = headEl.find('tr');
            var tableEl = this.iElement.find('table');
            var headTrChildren = $scope.compileHead(fields);
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
            var rowTrChildren = $scope.compileRow(fields);
            for (var i=0; i<rowTrChildren.length; i++) {
                rowEl.append(rowTrChildren[i]);
            }

            var linkFunc = $compile(tableEl);
            linkFunc($scope);
        };

        this.resetSortOrder = function() {
            cachedSortFields.length = 0;
            Array.prototype.push.apply(cachedSortFields, this.defaultSortFields);
            $scope.sortField = cachedSortFields.length >0 ? cachedSortFields[0][0] : 0;
            $scope.sortAscending = cachedSortFields.length >0 ? cachedSortFields[0][1] : true;
        };


        this.processHits = function(respHits, fields) {
            var processedHits = []
            for (var i=0; i<respHits.length; i++) {
                processedHits.push($scope.processHitFields(respHits[i].fields, fields));
            }
            $scope.processedHits = processedHits;
        };

        this.registerSortOrder = function(field) {
            cachedSortFields.length = 0;
            if (field != $scope.sortField || $scope.sortAscending) {
                cachedSortFields.push([field, field == $scope.sortField ? !$scope.sortAscending : true]);
            }
            for (var i=0; i<this.defaultSortFields.length; i++) {
                if (this.defaultSortFields[i][0] != field) {
                    cachedSortFields.push(this.defaultSortFields[i]);
                }
            }
            $scope.sortField = cachedSortFields.length >0 ? cachedSortFields[0][0] : '';
            $scope.sortAscending = cachedSortFields.length >0 ? cachedSortFields[0][1] : true;
        };

    }]
  };
});

listComponents.directive('listInitFields', function() {
  return {
    restrict: 'E',
    require: '^listPanel',
    scope: {exportHeadersMap : '=', fields: '=' },
    link: function(scope, iElement, iAttrs, ListPanelController) {
        ListPanelController.fields = scope.fields;
        ListPanelController.exportHeadersMap = scope.exportHeadersMap;
        iAttrs.$set('list-panel-registered', true);
    },
  };
});
