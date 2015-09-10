
var listPanelModule = angular.module('hipsciBrowser.listPanel', []);

listPanelModule.directive('listPanel', ['apiClient', '$location', function (apiClient, $location) {
  return {
    restrict: 'E',
    scope: false,
    link: function(scope, iElement, iAttrs, controller) {
      controller.documentType = scope.$eval(iAttrs.documentType);
      scope.exportData = controller.exportData;

      var firstView = true;
      if (controller.cache.lastUrl.length > 0) {
          if (Object.keys($location.search()).length ==0) {
              $location.url(controller.cache.lastUrl);
              firstView = false;
          }
      }
      if (firstView) {
          controller.cache.currentPage = 1;
          controller.cache.sortFields.length = 0;
      }

      var unbindWatch = scope.$watch(function() {
          var unregisteredCounter = 0;
          iElement.find('aggs-filter').each(function(index, el) {if ( ! el.attributes.hasOwnProperty('list-panel-registered')) {unregisteredCounter++;} });
          iElement.find('list-init-fields').each(function(index, el) {if ( ! el.attributes.hasOwnProperty('list-panel-registered')) {unregisteredCounter++;} });
          return unregisteredCounter;
        }, function(newValue) {
          if (newValue <= 0) {
              unbindWatch();
              if (controller.listTableCtrl) {
                controller.listTableCtrl.resetSortOrder();
                controller.listTableCtrl.compileTable(controller.fields);
              }
              controller.loadFromUrl(firstView);
              controller.routeUpdateListen();
          }
      });

    },
    controller: ['$timeout', '$location', 'routeCache', '$scope', function ($timeout, $location, routeCache, $scope) {
      var c = this;
      c.exportHeadersMap = {};
      c.apiStatus = {error: false, code: '', text: ''};
      c.delayedSearchActivated = false;
      c.aggsFilterCtrls = {};
      c.listTableCtrl = null;
      c.unbindRouteUpdate = null;
      c.hitsPerPage = 15;
      c.fields = [];

      c.cache = routeCache.get('listPanel', c.documentType);
      if (!c.cache.hasOwnProperty('lastUrl')) {
          jQuery.extend(c.cache, {
              currentPage: 1,
              numHits: 0,
              query: '',
              aggsFilters: {},
              sortFields: [],
              esResps : [],
              lastUrl : '',
          });
      }

      c.routeUpdateListen = function() {
          if (!c.unbindRouteUpdate) {
              c.unbindRouteUpdate = $scope.$on('$routeUpdate', function() {
                  c.cache.lastUrl = $location.url();
                  c.loadFromUrl();
                  });
          }
      }
      c.routeUpdateUnlisten = function() {
        if (c.unbindRouteUpdate) {
            c.unbindRouteUpdate();
            c.unbindRouteUpdate = null;
        }
      }

      c.loadFromUrl = function(firstView) {
          c.routeUpdateUnlisten();
          c.cache.query = $location.search()['q'] || '';
          for (var key in c.aggsFilterCtrls) {
              if (c.aggsFilterCtrls.hasOwnProperty(key)) {
                  c.aggsFilterCtrls[key].loadFromUrl(firstView);
              }
          }
          for (var key in c.aggsFilterCtrls) {
              if (c.aggsFilterCtrls.hasOwnProperty(key) && c.aggsFilterCtrls[key].unFilteredTermsReq) {
                  c.aggsOnlySearch(c.search);
                  return;
              }
          }
          c.search();
          c.routeUpdateListen();
      };

      var processResp = function(resp) {
          c.routeUpdateUnlisten();
          c.routeUpdateUnlisten();
          if (resp.hasOwnProperty('hits')) {
              c.cache.numHits = resp.hits.total;
              if (c.listTableCtrl) {
                  c.listTableCtrl.processHits(resp.hits.hits, c.fields);
              }
          }

          if (resp.hasOwnProperty('aggregations')) {
              jQuery.each(resp.aggregations, function(field, fieldResp) {
                  if (c.aggsFilterCtrls.hasOwnProperty(field)) {
                      c.aggsFilterCtrls[field].processAggResp(fieldResp);
                  }
              });
          }
          c.routeUpdateListen();
      };

      c.aggsOnlySearch = function(callback) {

        var searchBody = {aggs: {}};
        for (var field in c.aggsFilterCtrls) {
            if (c.aggsFilterCtrls.hasOwnProperty(field) && c.aggsFilterCtrls[field].hasOwnProperty('esAggRequest')) {
                searchBody.aggs[field] = c.aggsFilterCtrls[field].esAggRequest;
            }
        };
        searchBody.size = 0;
        apiClient.search( {
          type: c.documentType,
          body: searchBody,
        }).then(function(resp) {
            c.apiStatus.error = false;
            processResp(resp.data);
            callback();
        }, function(resp) {
            c.apiStatus.error = true;
            c.apiStatus.code = resp.status;
            c.apiStatus.text = resp.statusText;
        });
      }
  
      c.search = function() {
        c.delayedSearchActivated = false;
        var searchBody = {
          fields: c.fields,
          size: c.hitsPerPage,
          from: (c.cache.currentPage -1) * c.hitsPerPage
        };
        for (var i=0; i<c.cache.sortFields.length; i++) {
            searchBody.sort = searchBody.sort || [];
            var sortObj = {};
            sortObj[c.cache.sortFields[i][0]] = c.cache.sortFields[i][1] ? 'asc':'desc';
            searchBody.sort.push(sortObj);
        }

        var filterReqs = [];
        var aggReqs = {};
        for (var field in c.aggsFilterCtrls) {
            if (c.aggsFilterCtrls[field].esFilterRequest) {
                filterReqs.push(c.aggsFilterCtrls[field].esFilterRequest);
            }
            if (c.aggsFilterCtrls[field].esAggRequest) {
                aggReqs[field] = c.aggsFilterCtrls[field].esAggRequest;
            }
        }

        if (filterReqs.length == 1) {
            searchBody['query'] = {filtered: {filter: filterReqs[0]}};
        }
        else if (filterReqs.length > 1) {
            searchBody['query'] = {filtered: {filter: {and: filterReqs}}};
        }

        if (Object.keys(aggReqs).length >0) {
            searchBody['aggs'] = aggReqs;
        }

        if (c.cache.query.length >0) {
            var queryObj = {multi_match: {
                query: c.cache.query,
                fields: ['searchable.*'],
                fuzziness: 'AUTO',
                type: "most_fields",
                prefix_length: 2
            }};
            if (filterReqs.length >0) {
                searchBody.query.filtered['query'] = queryObj;
            }
            else {
                searchBody['query'] = queryObj;
            }
        }

        var bodyStr = JSON.stringify(searchBody);
        for (var i=c.cache.esResps.length-1; i>=0; i--) {
            var cachedResp = c.cache.esResps[i];
            if (cachedResp[0] == bodyStr) {
                c.cache.esResps.splice(i, 1);
                c.cache.esResps.push(cachedResp);
                processResp(cachedResp[1]);
                return;
            }
        }
        apiClient.search( {
          type: c.documentType,
          body: searchBody,
        }).then(function(resp) {
            c.apiStatus.error = false;
            c.cache.esResps.push([bodyStr, resp.data]);
            while (c.cache.esResps.length >10) {
                c.cache.esResps.shift();
            }
            processResp(resp.data);
        }, function(resp) {
            c.apiStatus.error = true;
            c.apiStatus.code = resp.status;
            c.apiStatus.text = resp.statusText;
        });

      };
  
      c.exportData = function(format) {
        var form = document.createElement('form');
        var columnNames = [];
        for (var i=0; i<c.fields.length; i++) {
            columnNames.push(c.exportHeadersMap[c.fields[i]]);
        }
        var searchBody = {
        fields: c.fields,
        column_names: columnNames,
        from: 0,
        size: c.cache.numHits,
        };
        for (var i=0; i<c.cache.sortFields.length; i++) {
            searchBody.sort = searchBody.sort || [];
            var sortObj = {};
            sortObj[c.cache.sortFields[i][0]] = c.cache.sortFields[i][1] ? 'asc':'desc';
            searchBody.sort.push(sortObj);
        }

        var filterReqs = [];
        for (var field in c.aggsFilterCtrls) {
            if (c.aggsFilterCtrls[field].esFilterRequest) {
                filterReqs.push(c.aggsFilterCtrls[field].esFilterRequest);
            }
        }

        if (filterReqs.length == 1) {
            searchBody['query'] = {filtered: {filter: filterReqs[0]}};
        }
        else if (filterReqs.length > 1) {
            searchBody['query'] = {filtered: {filter: {and: filterReqs}}};
        }

        return apiClient.exportData({type: c.documentType, body: searchBody, format: format});
      };
  
      c.clearFilters = function() {
          if (Object.keys($location.search()).length >0) {
              $location.search({});
          }
      };


      c.delayedSearch = function(event) {
          if (typeof event == 'object' && event.keyCode === 13) {
              $location.search('q', c.cache.query || null);
              return;
          }
          if (c.delayedSearchActivated) {
              return;
          }
          c.delayedSearchActivated = true;
          $timeout(function() {
              if (c.cache.query.length >0 && c.cache.query.length <4) {
                  c.delayedSearchActivated = false;
                  return;
              }
              if (c.delayedSearchActivated) {
                $location.search('q', c.cache.query || null);
              }
            }, 1000);
      };

    }]

  };
}]);
