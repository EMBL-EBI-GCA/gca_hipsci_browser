
var listPanelModule = angular.module('hipsciBrowser.listPanel', []);

listPanelModule.directive('listPanel', ['apiClient', '$location', function (apiClient, $location) {
  return {
    restrict: 'E',
    scope: false,
    link: function(scope, iElement, iAttrs, controller) {
      controller.documentType = scope.$eval(iAttrs.documentType);
      controller.exportFilename = scope.$eval(iAttrs.exportFilename);
      scope.exportData = controller.exportData;

      var firstView = true;
      var newUrl = $location.url();
      if (controller.cache.lastUrl.length > 0) {
          if (newUrl.indexOf('?') == -1 ) {
              $location.url(controller.cache.lastUrl);
              firstView = false;
          }
          else if (newUrl === controller.cache.lastUrl) {
              firstView = false;
          }
      }
      if (firstView) {
          controller.cache.currentPage = 1;
          controller.cache.sortFields.length = 0;
          controller.cache.lastUrl = newUrl;
      }

      var unbindWatch = scope.$watch(function() {
          var unregisteredCounter = 0;
          iElement.find('aggs-filter').each(function(index, el) {if ( ! el.attributes.hasOwnProperty('list-panel-registered')) {unregisteredCounter++;} });
          iElement.find('invisible-filter').each(function(index, el) {if ( ! el.attributes.hasOwnProperty('list-panel-registered')) {unregisteredCounter++;} });
          iElement.find('list-init-fields').each(function(index, el) {if ( ! el.attributes.hasOwnProperty('list-panel-registered')) {unregisteredCounter++;} });
          return unregisteredCounter;
        }, function(newValue) {
          if (newValue <= 0) {
              unbindWatch();
              if (controller.listTableCtrl) {
                controller.listTableCtrl.resetSortOrder(firstView);
                controller.listTableCtrl.compileTable(controller.cache.htmlFields);
              }
              controller.loadFromUrl(firstView);
          }
      });

    },
    controller: ['$timeout', '$location', 'routeCache', '$scope', function ($timeout, $location, routeCache, $scope) {
      var c = this;
      c.exportHeaders = [];
      c.apiStatus = {error: false, code: '', text: ''};
      c.delayedSearchActivated = false;
      c.aggsFilterCtrls = {};
      c.listTableCtrl = null;
      c.unbindRouteUpdate = null;
      c.hitsPerPage = 25;
      c.fields = [];
      c.exportFields = [];
      c.exportFieldHeaders = [];
      c.lastUrlChange = null;

      c.cache = routeCache.get('listPanel', c.documentType);
      if (!c.cache.hasOwnProperty('lastUrl')) {
          jQuery.extend(c.cache, {
              currentPage: 1,
              numHits: 0,
              query: '',
              aggsFilters: {},
              sortFields: [],
              esResps : [],
              lastUrl: '',
              htmlFields: [],
          });
      }

      c.routeUpdateListen = function() {
          c.lastUrlChange = $location.url();
          if (!c.unbindRouteUpdate) {
              c.unbindRouteUpdate = $scope.$on('$routeUpdate', function(event, object) {
                  var newUrl = $location.url();
                  if (newUrl === c.lastUrlChange) {
                      return;
                  }
                  if (newUrl.indexOf('?') == -1 && c.lastUrlChange) {
                      $location.url(c.lastUrlChange);
                      return;
                  }
                  c.lastUrlChange = newUrl;
                  c.routeUpdateUnlisten();
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

      c.loadFromUrl = function(firstView, routeChangeFn) {
          c.routeUpdateUnlisten();
          if (routeChangeFn) {
              routeChangeFn();
          }
          c.cache.lastUrl = $location.url();
          c.cache.query = $location.search()['q'] || '';
          var unfiltTermsRequired = false;
          for (var key in c.aggsFilterCtrls) {
              if (c.aggsFilterCtrls.hasOwnProperty(key) && c.aggsFilterCtrls[key].hasOwnProperty('loadFromUrl')) {
                  unfiltTermsRequired = c.aggsFilterCtrls[key].loadFromUrl(firstView) ? true : unfiltTermsRequired;
              }
          }
          if (unfiltTermsRequired && c.cache.lastUrl.indexOf('?') >-1) {
              c.aggsOnlySearch(c.search);
              return;
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
                  c.listTableCtrl.processHits(resp.hits.hits, c.cache.htmlFields);
              }
          }

          if (resp.hasOwnProperty('aggregations')) {
              for (var field in c.aggsFilterCtrls) {
                  if (c.aggsFilterCtrls.hasOwnProperty(field) && c.aggsFilterCtrls[field].hasOwnProperty('processAggResp')) {
                      var thisResp = resp.aggregations[field];
                      if (!thisResp && resp.aggregations['unfiltered']) {
                          thisResp = resp.aggregations['unfiltered'][field];
                      }
                      if (thisResp) {
                          if (thisResp.hasOwnProperty(field)) {
                              thisResp = thisResp[field];
                          }
                          c.aggsFilterCtrls[field].processAggResp(thisResp);
                      }
                  }
              }

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

        var postFilterReqArr = [];
        var globalFilterReqArr = []
        //var filterReqArr = [];
        var filterReqObj = {};
        var postFilteredFields = [];
        //var filteredFields = [];
        var filtAggFields = [];
        var unfiltAggFields = [];
        var aggReqs = {};
        for (var field in c.aggsFilterCtrls) {
            if (c.aggsFilterCtrls[field].esFilterRequest) {
                filterReqObj[field] = c.aggsFilterCtrls[field].esFilterRequest;
                if (c.aggsFilterCtrls[field].esFilterIsGlobal) {
                    globalFilterReqArr.push(c.aggsFilterCtrls[field].esFilterRequest);
                }
                else {
                    postFilterReqArr.push(c.aggsFilterCtrls[field].esFilterRequest);
                    postFilteredFields.push(field);
                }
            }
            if (c.aggsFilterCtrls[field].esAggRequest) {
                aggReqs[field] = c.aggsFilterCtrls[field].esAggRequest;
                if (c.aggsFilterCtrls[field].esFilterRequest && !c.aggsFilterCtrls[field].esFilterIsGlobal) {
                    filtAggFields.push(field);
                }
                else {
                    unfiltAggFields.push(field);
                }
            }
        }

        if (postFilterReqArr.length == 1) {
            searchBody['post_filter'] = postFilterReqArr[0];
        }
        else if (postFilterReqArr.length > 1) {
            searchBody['post_filter'] = {and: postFilterReqArr};
        }

        if (postFilterReqArr.length >0) {
            searchBody['aggs'] = {};
            if (unfiltAggFields.length >0) {
                searchBody.aggs['unfiltered'] = {filter: searchBody.post_filter, aggs:{} };
                for (var i=0; i<unfiltAggFields.length; i++) {
                    searchBody.aggs.unfiltered.aggs[unfiltAggFields[i]] = aggReqs[unfiltAggFields[i]];
                }
            }
            for (var i=0; i<filtAggFields.length; i++) {
                var extraFilters = jQuery.grep(postFilteredFields, function(filtField) {return filtField === filtAggFields[i] ? false : true});
                if (extraFilters.length == 0) {
                    searchBody.aggs[filtAggFields[i]] = aggReqs[filtAggFields[i]];
                }
                else if (extraFilters.length == 1) {
                    searchBody.aggs[filtAggFields[i]] = {aggs: {}, filter: filterReqObj[extraFilters[0]]};
                    searchBody.aggs[filtAggFields[i]].aggs[filtAggFields[i]] = aggReqs[filtAggFields[i]];
                }
                else {
                    searchBody.aggs[filtAggFields[i]] = {aggs: {}, filter: {and: []}};
                    searchBody.aggs[filtAggFields[i]].aggs[filtAggFields[i]] = aggReqs[filtAggFields[i]];
                    for (var j=0; j<extraFilters.length; j++) {
                        searchBody.aggs[filtAggFields[i]].filter.and.push(filterReqObj[extraFilters[j]]);
                    }
                }
            }
        }
        else if (filtAggFields.length >0 || unfiltAggFields.length >0) {
            searchBody['aggs'] = aggReqs;
        }

        if (c.cache.query.length >0 || globalFilterReqArr.length >0) {
            searchBody.query = {};
        }
        if (globalFilterReqArr.length >0) {
            searchBody.query.filtered = {}
        }

        if (c.cache.query.length >0) {
            var multiMatch = {
                query: c.cache.query,
                fields: ['searchable.free', 'searchable.fixed^3'],
                type: "most_fields",
            };
            if (globalFilterReqArr.length >0) {
                searchBody.query.filtered.query = {multi_match:  multiMatch};
            }
            else {
                searchBody.query.multi_match = multiMatch;
            }
        }

        if (globalFilterReqArr.length ==1) {
            searchBody.query.filtered.filter = globalFilterReqArr[0];
        }
        else if (globalFilterReqArr.length >1) {
            searchBody.query.filtered.filter = {and: globalFilterReqArr};
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
        var searchBody = {
        fields: c.exportFields,
        column_names: c.exportFieldHeaders,
        from: 0,
        size: c.cache.numHits,
        };
        for (var i=0; i<c.cache.sortFields.length; i++) {
            searchBody.sort = searchBody.sort || [];
            var sortObj = {};
            sortObj[c.cache.sortFields[i][0]] = c.cache.sortFields[i][1] ? 'asc':'desc';
            searchBody.sort.push(sortObj);
        }

        var filterReqArr = [];
        for (var field in c.aggsFilterCtrls) {
            if (c.aggsFilterCtrls[field].esFilterRequest) {
                filterReqArr.push(c.aggsFilterCtrls[field].esFilterRequest);
            }
        }

        if (filterReqArr.length == 1) {
            searchBody['query'] = {filtered: {filter: filterReqArr[0]}};
        }
        else if (filterReqArr.length > 1) {
            searchBody['query'] = {filtered: {filter: {and: filterReqArr}}};
        }

        if (c.cache.query.length >0) {
            var queryObj = {multi_match: {
                query: c.cache.query,
                fields: ['searchable.free', 'searchable.fixed^3'],
                type: "most_fields",
            }};
            if (filterReqArr.length >0) {
                searchBody.query.filtered['query'] = queryObj;
            }
            else {
                searchBody['query'] = queryObj;
            }
        }

        return apiClient.exportData({type: c.documentType, body: searchBody, format: format, filename: c.exportFilename});
      };
  
      c.clearFilters = function() {
          if (Object.keys($location.search()).length >0) {
              c.loadFromUrl( false, function() {$location.search({})});
          }
      };


      c.delayedSearch = function(event) {
          if (typeof event == 'object' && event.keyCode === 13) {
              c.loadFromUrl(false, function() { $location.search('q', c.cache.query || null);});
              return;
          }
          if (c.delayedSearchActivated) {
              return;
          }
          c.delayedSearchActivated = true;
          $timeout(function() {
              c.delayedSearchActivated = false;
              if (c.cache.query.length ==0) {
                  c.loadFromUrl(false, function() { $location.search('q', null);});
              }
              if (c.cache.query.length >3) {
                  c.loadFromUrl(false, function() { $location.search('q', c.cache.query);});
              }
            }, 1000);
      };

    }]

  };
}]);
