'use strict';

var listPanelModule = angular.module('hipsciBrowser.listPanel', []);

listPanelModule.directive('listPanel', ['apiClient', function (apiClient) {
  return {
    controllerAs: 'ListPanelCtrl',
    restrict: 'E',
    transclude: false,
    scope: false,
    compile: function(tElement, tAttrs) { 
    return {
    post: function(scope, iElement, iAttrs, controller) {
      controller.documentType = scope.$eval(iAttrs.documentType);

      var unbindWatch = scope.$watch(function() {
          var unregisteredCounter = 0;
          iElement.find('aggs-filter').each(function(index, el) {if ( ! el.attributes.hasOwnProperty('list-panel-registered')) {unregisteredCounter++;} });
          iElement.find('list-init-fields').each(function(index, el) {if ( ! el.attributes.hasOwnProperty('list-panel-registered')) {unregisteredCounter++;} });
          return unregisteredCounter;
        }, function(newValue) {
          if (newValue <= 0) {
              unbindWatch();
              if (typeof controller.tableInitCallback != 'undefined') {
                  controller.tableInitCallback(controller.fields);
              }
              controller.refreshSearch();
          }
      });

    }
    };},
    controller: ['$timeout', function ($timeout) {
      var controller = this;
      controller.currentPage = 1;
      controller.numPages = 0;
      controller.hitsPerPage = 15;
      controller.numHits = 0;
      controller.query = '';
      controller.fields = [];
      controller.exportHeadersMap = {};
      controller.sortFields = [];
      controller.apiError = false;

      controller.delayedSearchActivated = false;
      controller.cachedResps = [];

      var cachedHits = [];
      var filterReqs = {};
      var filterCallbacks = {};
      var aggReqs = {};
      var aggCallbacks = {};
      controller.tableInitCallback = function() {return;};
      controller.tableRespCallback = function() {return;};

      var processResp = function(resp) {
          controller.numHits = resp.hits.total;
          controller.numPages = Math.ceil(controller.numHits / controller.hitsPerPage);
          if (typeof controller.tableRespCallback != 'undefined') {
              controller.tableRespCallback(resp.hits.hits, controller.fields);
          }

          if (resp.hasOwnProperty('aggregations')) {
              var aggResps = resp['aggregations'];
              var aggKeys = Object.keys(aggReqs);
              for (var i=0; i<aggKeys.length; i++) {
                  if (aggCallbacks.hasOwnProperty(aggKeys[i])) {
                      var aggRespObjs = [];
                      var aggRespTopObj = aggResps.hasOwnProperty(aggKeys[i]) ? aggResps[aggKeys[i]] : aggResps;
                      for (var j=0; j<aggReqs[aggKeys[i]].length; j++) {
                          var aggKey = aggKeys[i]+'.'+j;
                          if (aggRespTopObj.hasOwnProperty(aggKey)) {
                              aggRespObjs[j] = aggRespTopObj[aggKey];
                          }
                      }
                  }
                  aggCallbacks[aggKeys[i]](aggRespObjs);
              }
          }
      };
  
      var search = function() {
        controller.delayedSearchActivated = false;
        var searchBody = {
          fields: controller.fields,
          size: controller.hitsPerPage,
          from: (controller.currentPage -1) * controller.hitsPerPage
        };
        for (var i=0; i<controller.sortFields.length; i++) {
            searchBody.sort = searchBody.sort || [];
            var sortObj = {};
            sortObj[controller.sortFields[i][0]] = controller.sortFields[i][1] ? 'asc':'desc';
            searchBody.sort.push(sortObj);
        }

        var filterKeys = Object.keys(filterReqs);
        var globalFilterKeys = [];
        for (var i=0; i<filterKeys.length; i++) {
            globalFilterKeys.push(filterKeys[i]);
        }

        if (globalFilterKeys.length >0) {
            if (globalFilterKeys.length == 1) {
                searchBody['query'] = {filtered: {filter: filterReqs[globalFilterKeys[0]]}};
            }
            else {
                var filterArr = [];
                for (var i=0; i<globalFilterKeys.length; i++) {
                    filterArr.push(filterReqs[globalFilterKeys[i]]);
                }
                searchBody['query'] = {filtered: {filter: {and: filterArr}}};
            }
        }

        var aggKeys = Object.keys(aggReqs);
        if (aggKeys.length >0) {
            searchBody['aggs'] = {};
            for (var i=0; i<aggKeys.length; i++) {
                var aggKey = aggKeys[i];
                for (var j=0; j<aggReqs[aggKey].length; j++) {
                    searchBody['aggs'][aggKey+'.'+j] = aggReqs[aggKey][j];
                }
            }
        }

        if (controller.query.length >0) {
            var queryObj = {multi_match: {
                query: controller.query,
                fields: ['searchable.*'],
                fuzziness: 'AUTO',
                type: "most_fields",
                prefix_length: 2
            }};
            if (globalFilterKeys.length >0) {
                searchBody.query.filtered['query'] = queryObj;
            }
            else {
                searchBody['query'] = queryObj;
            }
        }

        var bodyStr = JSON.stringify(searchBody);
        var cachedResp;
        for (var i=controller.cachedResps.length-1; i>=0; i--) {
            var cachedStrResp = controller.cachedResps[i];
            if (cachedStrResp[0] == bodyStr) {
                cachedResp = cachedStrResp[1];
                controller.cachedResps.splice(i, 1);
                controller.cachedResps.push(cachedStrResp);
                break;
            }
        }
        if (typeof cachedResp != 'undefined') {
            processResp(cachedResp);
        }
        else {
            apiClient.search( {
              type: controller.documentType,
              body: searchBody,
            }).then(function(resp) {
                controller.apiError = false;
                controller.cachedResps.push([bodyStr, resp.data]);
                while (controller.cachedResps.length >10) {
                    controller.cachedResps.shift();
                }
                processResp(resp.data);
            }, function(resp) {
                controller.apiError = true;
                controller.apiStatus = resp.status;
                controller.apiStatusText = resp.statusText;
            });

        }

      };
  
      controller.exportData = function(format) {
        var form = document.createElement('form');
        var columnNames = [];
        for (var i=0; i<controller.fields.length; i++) {
            columnNames.push(controller.exportHeadersMap[controller.fields[i]]);
        }
        var searchBody = {
        fields: controller.fields,
        column_names: columnNames,
        from: 0,
        size: controller.numHits,
        };
        for (var i=0; i<controller.sortFields.length; i++) {
            searchBody.sort = searchBody.sort || [];
            var sortObj = {};
            sortObj[controller.sortFields[i][0]] = controller.sortFields[i][1] ? 'asc':'desc';
            searchBody.sort.push(sortObj);
        }

        var filterKeys = Object.keys(filterReqs);
        if (filterKeys.length >0) {
            if (filterKeys.length == 1) {
                searchBody['query'] = {filtered: {filter: filterReqs[filterKeys[0]]}};
            }
            else {
                var filterArr = [];
                for (var i=0; i<filterKeys.length; i++) {
                    filterArr.push(filterReqs[filterKeys[i]]);
                }
                searchBody['query'] = {filtered: {filter: {and: filterArr}}};
            }
        }

        return apiClient.exportData({type: controller.documentType, body: searchBody, format: format});
      };
  
      controller.refreshSearch = function () {
        controller.currentPage = 1;
        search();
      };
      controller.setPage = function () {
          /*
        if (typeof displayResults == "undefined") {
          search();
        }
        else {
          controller.displayResults = displayResults
        }
      */
          search();
      };
      controller.registerFilter = function(filterName, filterReq, disableCallback) {
          if (typeof filterReq == 'undefined') {
              delete filterReqs[filterName];
              delete filterCallbacks[filterName];
          }
          else {
              filterReqs[filterName] = filterReq;
              filterCallbacks[filterName] = disableCallback;
          }
      };
      controller.clearFilters = function() {
          var filterKeys = Object.keys(filterReqs);
          if (filterKeys.length ==0) {
              return;
          }
          for (var i=0; i<filterKeys.length; i++) {
              if (filterCallbacks.hasOwnProperty(filterKeys[i])) {
                  filterCallbacks[filterKeys[i]]();
                  delete filterCallbacks[filterKeys[i]];
              };
              delete filterReqs[filterKeys[i]];
          }
          controller.refreshSearch();
      };

      controller.registerAggregate = function(aggName, aggReqArr, processCallback) {
          aggReqs[aggName] = aggReqArr;
          aggCallbacks[aggName] = processCallback;

      };

      controller.registerTable = function(tableInitCallback, tableRespCallback, sortFields) {
          controller.tableInitCallback = tableInitCallback;
          controller.tableRespCallback = tableRespCallback;
          controller.sortFields = sortFields;
          if (controller.cachedResps.length >0) {
              controller.tableInitCallback(controller.fields);
              controller.tableRespCallback(controller.cachedReps[controller.cachedResps.length-1]);
          }
      };

      controller.registerFields = function(fields, exportHeadersMap) {
          controller.fields = fields;
          controller.exportHeadersMap = exportHeadersMap;
      };

      controller.registerSortOrders = function(sortFields) {
          controller.sortFields = sortFields;
          controller.refreshSearch();
      };

      controller.delayedSearch = function(event) {
          if (typeof event == 'object' && event.keyCode === 13) {
              controller.refreshSearch();
              return;
          }
          if (controller.delayedSearchActivated) {
              return;
          }
          controller.delayedSearchActivated = true;
          $timeout(function() {
              if (controller.query.length >0 && controller.query.length <4) {
                  controller.delayedSearchActivated = false;
                  return;
              }
              if (controller.delayedSearchActivated)
                {controller.refreshSearch();}
            }, 1000);
      };

    }]

  };
}]);
