'use strict';

var listComponents = angular.module('hipsciBrowser.listComponents', []);

listComponents.directive('listPagination', function() {
  return {
    restrict: 'E',
    scope: false,
    template: '<pagination total-items="listPanelCtrl.cache.numHits"'
        +' ng-model="listPanelCtrl.cache.currentPage" ng-change="listPanelCtrl.loadFromUrl()"'
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
    scope: true,
    template: '<div class="search-box"><input ng-model="listPanelCtrl.cache.query"'
            + 'ng-change="listPanelCtrl.delayedSearch()" ng-keypress="listPanelCtrl.delayedSearch($event)" placeholder="{{label}}"></input></div>',
    require: '^listPanel',
    link: function(scope, iElement, iAttrs, listPanelCtrl) {
        scope.label = iAttrs.label || 'Search';
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

listComponents.directive('invisibleFilter', function() {
  return {
    restrict: 'E',
    scope: {
        field: '@',
        term: '@',
    },
    require: ['invisibleFilter', '^listPanel'],
    controller: ['$scope', '$location', function($scope, $location) {
        var c = this;
        c.createFilterRequest = function(term) {
            c.esFilterRequest = {term: {}};
            c.esFilterRequest.term[$scope.field] = term;
        };
        c.esFilterIsGlobal = true;

    }],
    link: function(scope, iElement, iAttrs, ctrls) {
        var invisibleFilterCtrl = ctrls[0];
        var listPanelCtrl = ctrls[1];
        listPanelCtrl.aggsFilterCtrls[scope.field] = invisibleFilterCtrl;
        invisibleFilterCtrl.createFilterRequest(scope.$parent.$eval(scope.term));
        iAttrs.$set('list-panel-registered', true);
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
    templateUrl: 'partials.20151020/uiFacet.html',
    controller: ['$scope', '$location', function($scope, $location) {
        var c = this;
        c.esAggRequest = { terms: {field: $scope.field, size: 20}};
        c.esFilterRequest = null;
        var cache = null;
        c.esFilterIsGlobal = $scope.multiBoolean === 'and' ? true : false;

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
                $scope.aggs = cache.aggs;
                if (numFiltTermsBefore != numFiltTermsAfter) {
                    c.filteredTermsToUrl();
                }
                c.createFilterRequest();
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
                return true;
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
            || function(a, b) {return b.unfilteredCount - a.unfilteredCount};

        listPanelCtrl.aggsFilterCtrls[scope.field] = aggsFilterCtrl;
        aggsFilterCtrl.initCache(listPanelCtrl);

        scope.ulMaxHeight = 0;
        var ulElem = iElement.find("ul").first();
        scope.buttonRequired = function() {
            if (! scope.collapsed) {
                return true;
            }
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
            listPanelCtrl.loadFromUrl(false, function() { aggsFilterCtrl.filteredTermsToUrl();});
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
        processHitFields: '=',
        compileParams: '=',
        defaultSortFields: '@',
        trClass: '@'
    },
    require: ['listTable', '^listPanel'],
    template: '<table><thead ><tr></tr></thead><tbody></tbody></table>',
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
            $scope.fields = fields;
            var tableEl = this.iElement.find('table');
            var headTrEl = tableEl.find('thead > tr');
            var rowEl = $('<tr ng-repeat="hit in processedHits"></tr>');
            tableEl.find('tbody').append(rowEl);
            if ($scope.trClass) {
                headTrEl.addClass($scope.trClass);
            }

            for (var i=0; i<fields.length; i++) {
                if (fields[i].visible || fields[i].selectable) {
                    var thEl = $(fields[i].th || '<th></th>');
                    var tdEl = $(fields[i].td || '<td></td>');

                    if (fields[i].sortable) {
                        var fieldsStr = "'"+fields[i].esName+"'";
                        thEl.attr('ng-class', '{sortAsc: (sortField=='+fieldsStr+' && sortAscending), sortDesc: (sortField=='+fieldsStr+' && !sortAscending)}');
                        thEl.attr('ng-click', 'registerSortOrder('+fieldsStr+')');
                        thEl.addClass('sort');
                    }
                    if (fields[i].selectable) {
                        thEl.attr('ng-if', 'fields['+i+'].visible');
                        tdEl.attr('ng-if', 'fields['+i+'].visible');
                    }
                    headTrEl.append(thEl);
                    rowEl.append(tdEl);

                }
            }

            var linkFunc = $compile(tableEl);
            linkFunc($scope);
        };

        this.resetSortOrder = function(firstView) {
            if (firstView) {
                cachedSortFields.length = 0;
                Array.prototype.push.apply(cachedSortFields, this.defaultSortFields);
            }
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
    scope: {htmlFields : '=', exportFields: '=', text: '@'},
    link: function(scope, iElement, iAttrs, ListPanelController) {
        if( ListPanelController.cache.htmlFields.length == 0) {
            ListPanelController.cache.htmlFields = scope.htmlFields
        }
        for (var i=0; i<scope.htmlFields.length; i++) {
            ListPanelController.fields.push(scope.htmlFields[i].esName);
        }
        for (var i=0; i<scope.exportFields.length; i++) {
            ListPanelController.exportFields.push(scope.exportFields[i].esName);
            ListPanelController.exportFieldHeaders.push(scope.exportFields[i].label);
        }
        iAttrs.$set('list-panel-registered', true);
    },
  };
});

listComponents.directive('listSelectColumns', ['$timeout', function($timeout) {
  return {
    restrict: 'E',
    scope: true,
    template: '<div class="btn-group" dropdown is-open="isOpen">'
    +'<button id="selColBtn" type="button" class="btn btn-primary dropdown-toggle">More columns<span class="caret"></span></button>'
    + '<ul class="dropdown-menu" role="menu" aria-labelledby="selColBtn">'
    + '<li role="menuItem" ng-repeat="field in listPanelCtrl.cache.htmlFields | filter: {selectable: true}">'
    + '<div class="checkbox"><label><input type="checkbox" ng-model="field.visible" ng-change="keepOpen()"><span ng-bind="field.label"></span></label></div>'
    +'</li></ul></div>',
    require: '^listPanel',
    link: function(scope, iElement, iAttr, listPanelCtrl) {
        scope.listPanelCtrl = listPanelCtrl;
        scope.isOpen = false;
        scope.keepOpen = function() {
            $timeout(function() {
            scope.isOpen = true;
            });
        }
    },
  };
}]);

