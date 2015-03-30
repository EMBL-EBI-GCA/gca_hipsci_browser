'use strict';

var listUtils = angular.module('hipsciBrowser.listUtils', []);

listUtils.controller('DonorCtrl', function() {
    var controller=this;
    this.documentType = 'donor';
    this.initFields = ['name', 'sex', 'ethnicity', 'diseaseStatus', 'age', 'bioSamplesAccession', 'cellLines'];

    this.columnHeadersMap = {
        name: 'Name',
        sex: 'Sex',
        ethnicity: 'Ethnicity',
        diseaseStatus: 'Disease Status',
        age: 'Age',
        bioSamplesAccession: 'Biosample',
        cellLines: 'Cell Lines'
    };

    this.compileHead = function(fields) {
        var trChildren = [];
        for (var i=0; i<fields.length; i++) {
            var field = fields[i];
            trChildren.push(
                field == 'bioSamplesAccession' ? '<th class="matrix-dot biosamplesaccession"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
              :  field == 'cellLines' ? '<th class="matrix-dot"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
              : '<th class="sort">'+controller.columnHeadersMap[field]+'</th>'
            );
        }
        return trChildren;
    };

    this.compileRow = function(fields) {
        var trChildren = [];
        for (var i=0; i<fields.length; i++) {
            var field = fields[i];
            var hitStr = 'hit['+i+']';
            trChildren.push(
                field == 'bioSamplesAccession' ? '<td class="biosamplesaccession matrix-dot"><a ng-href="http://www.ebi.ac.uk/biosamples/sample/{{'+hitStr+'}}" popover="Biosample" popover-trigger="mouseenter" target="_blank">&#x25cf;</a></td>'
              : field == 'cellLines' ? '<td class="cellLines matrix-dot" popover="{{'+hitStr+'.join(\', \')}}" popover-trigger="mouseenter" ng-bind="'+hitStr+'.length"></td>'
              : field == 'name' ? '<td class="name"><a ng-href="#/donors/{{'+hitStr+'}}" ng-bind="'+hitStr+'"</a></td>'
              : '<td ng-bind="'+hitStr+'"></td>'
            );
        }
        return trChildren;
    };

    this.processHitFields = function(hitFields, fields) {
        var processedFields = [];
        for (var i=0; i<fields.length; i++) {
            var field = fields[i];
            processedFields[i] = ! hitFields.hasOwnProperty(field) ? undefined
                    : field == 'cellLines' ? hitFields[field]
                    : hitFields[field][0];
        }
        return processedFields;
    };



});

listUtils.controller('LineCtrl', function() {
    var controller = this;
    this.documentType = 'cellLine';
    this.initFields =  ['name', 'diseaseStatus', 'sex', 'sourceMaterial', 'tissueProvider', 'bioSamplesAccession', 'assays.exomeseq', 'assays.rnaseq', 'assays.gtarray', 'assays.gexarray', 'assays.mtarray'];
    this.assaysFields =  ['assays.exomeseq', 'assays.rnaseq', 'assays.gtarray', 'assays.gexarray', 'assays.mtarray'];

    this.columnHeadersMap = {
        name: 'Name',
        diseaseStatus: 'Disease Status',
        sex: 'Sex',
        sourceMaterial: 'Source Material',
        tissueProvider: 'TissueProvider',
        bioSamplesAccession: 'Biosample',
        'assays.exomeseq': 'exomeseq',
        'assays.rnaseq': 'rnaseq',
        'assays.gtarray': 'gtarray',
        'assays.gexarray': 'gexarray',
        'assays.mtarray': 'mtarray'
    };

    this.compileHead = function(fields) {
        var trChildren = [];
        for (var i=0; i<fields.length; i++) {
            var field = fields[i];
            trChildren.push(
                field == 'bioSamplesAccession' ? '<th class="matrix-dot biosamplesaccession"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
              :  field.match(/^assays/) ? '<th class="matrix-dot assay"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
              : '<th class="sort">'+controller.columnHeadersMap[field]+'</th>'
            );
        }
        return trChildren;
    };

    this.compileRow = function(fields) {
        var trChildren = [];
        for (var i=0; i<fields.length; i++) {
            var field = fields[i];
            var hitStr = 'hit['+i+']';
            trChildren.push(
                field == 'bioSamplesAccession' ? '<td class="biosamplesaccession matrix-dot"><a ng-href="http://www.ebi.ac.uk/biosamples/sample/{{'+hitStr+'}}" popover="Biosample" popover-trigger="mouseenter" target="_blank">&#x25cf;</a></td>'
              : field == 'name' ? '<td class="name"><a ng-href="#/lines/{{'+hitStr+'}}" ng-bind="'+hitStr+'"</a></td>'
              : field.match(/^assays/) ? '<td class="assay matrix-dot"><span class="assay" ng-class="{hasdata: '+hitStr+'}"><a ng-href="https://www.ebi.ac.uk/ega/studies/{{'+hitStr+'}}" popover="'+controller.columnHeadersMap[field]+'" popover-trigger="mouseenter" target="_blank">&#x25cf;</a></span></td>'
              : '<td ng-bind="'+hitStr+'"></td>'
            );
        }
        return trChildren;
    };

    this.processHitFields = function(hitFields, fields) {
        var processedFields = [];
        for (var i=0; i<fields.length; i++) {
            var field = fields[i];
            processedFields[i] = ! hitFields.hasOwnProperty(field) ? undefined
                    : hitFields[field][0];
        }
        return processedFields;
    };

});


listUtils.directive('listPanel', ['esClient', function (esClient) {
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
          iElement.find('list-table').each(function(index, el) {if ( ! el.attributes.hasOwnProperty('list-panel-registered')) {unregisteredCounter++;} });
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
      controller.hitsPerPage = 10;
      controller.numHits = 0;
      controller.query = '';
      controller.fields = [];
      controller.exportHeadersMap = {};
      controller.sortField = '';
      controller.sortAscending = true;

      controller.delayedSearchActivated = false;
      controller.cachedResps = [];

      var cachedHits = [];
      var filterReqs = {};
      var filterCallbacks = {};
      var aggReqs = {};
      var aggExcludeFilters = {};
      var aggCallbacks = {};
      controller.tableInitCallback = undefined;
      controller.tableRespCallback = undefined;

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
          from: (controller.currentPage -1) * controller.hitsPerPage,
        };
        if (typeof controller.sortField == 'string' && controller.sortField.length >0) {
            var sortObj = {};
            sortObj[controller.sortField] = controller.sortAscending ? 'asc' : 'desc';
            searchBody.sort = [sortObj];
        }

        var filterKeys = Object.keys(filterReqs);
        var aggExcludeFilterKeys = [];
        var globalFilterKeys = [];
        for (var i=0; i<filterKeys.length; i++) {
            if (aggExcludeFilters.hasOwnProperty(filterKeys[i])
                    && aggExcludeFilters[filterKeys[i]]) {
                aggExcludeFilterKeys.push(filterKeys[i]);
            }
            else {
                globalFilterKeys.push(filterKeys[i]);
            }
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

        if (aggExcludeFilterKeys.length >0) {
            if (aggExcludeFilterKeys.length == 1) {
                searchBody['post_filter'] = filterReqs[aggExcludeFilterKeys[0]];
            }
            else {
                var filterArr = [];
                for (var i=0; i<aggExcludeFilterKeys.length; i++) {
                    filterArr.push(filterReqs[aggExcludeFilterKeys[i]]);
                }
                searchBody['post_filter'] = {and: filterArr};
            }
        }

        var aggKeys = Object.keys(aggReqs);
        if (aggKeys.length >0) {
            searchBody['aggs'] = {};
            for (var i=0; i<aggKeys.length; i++) {
                var aggKey = aggKeys[i];
                var extraFilterKeys = [];
                for (var j=0; j<aggExcludeFilterKeys.length; j++) {
                    if (aggExcludeFilterKeys[j] != aggKey) {
                        extraFilterKeys.push(aggExcludeFilterKeys[j]);
                    }
                }
                if (extraFilterKeys.length >0) {
                    var filter;
                    if (extraFilterKeys.length ==1) {
                        searchBody['aggs'][aggKey] = {filter: filterReqs[extraFilterKeys[0]]};
                    }
                    else {
                        var extraFilterReqs = [];
                        for (var j=0; j<extraFilterKeys.length; j++) {
                            extraFilterReqs.push(filterReqs[extraFilterKeys[j]]);
                        }
                        searchBody['aggs'][aggKey] = {filter: {and: extraFilterReqs}};
                    }
                    searchBody['aggs'][aggKey]['aggs'] = {};
                    for (var j=0; j<aggReqs[aggKey].length; j++) {
                        searchBody['aggs'][aggKey]['aggs'][aggKey+'.'+j] = aggReqs[aggKey][j];
                    }
                    
                }
                else {
                    for (var j=0; j<aggReqs[aggKey].length; j++) {
                        searchBody['aggs'][aggKey+'.'+j] = aggReqs[aggKey][j];
                    }
                }
            }
        }

        if (controller.query.length >0) {
            if (globalFilterKeys.length >0) {
                searchBody.query.filtered['query'] = {fuzzy: {_all: controller.query}};
            }
            else {
                searchBody['query'] = {fuzzy: {_all: controller.query}};
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
            esClient.search( {
              index: 'hipsci',
              type: controller.documentType,
              body: searchBody,
            }).then(function(resp) {
                controller.cachedResps.push([bodyStr, resp]);
                while (controller.cachedResps.length >10) {
                    controller.cachedResps.shift();
                }
                processResp(resp);
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
        if (typeof controller.sortField == 'string' && controller.sortField.length >0) {
            var sortObj = {};
            sortObj[controller.sortField] = controller.sortAscending ? 'asc' : 'desc';
            searchBody.sort = [sortObj];
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

        //form.action='http://vg-rs-dev1:8000/api/hipsci/' + this.documentType + '/_search.' +format;
        //form.action='/api/hipsci/' + this.documentType + '/_search.' +format;
        form.action='http://127.0.0.1:3000/hipsci/' + controller.documentType + '/_search.' +format;
        form.method='POST';
        form.target="_self";
  
        var input = document.createElement("textarea");
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', 'json');
        input.value = JSON.stringify(searchBody);
        form.appendChild(input);
        form.style.display = 'none';
        document.body.appendChild(form);
        form.submit();
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

      controller.registerAggregate = function(aggName, aggReqArr, excludeFilter, processCallback) {
          aggReqs[aggName] = aggReqArr;
          aggExcludeFilters[aggName] = excludeFilter;
          aggCallbacks[aggName] = processCallback;

      };

      controller.registerTable = function(tableInitCallback, tableRespCallback) {
          controller.tableInitCallback = tableInitCallback;
          controller.tableRespCallback = tableRespCallback;
      };

      controller.registerFields = function(fields, exportHeadersMap) {
          controller.fields = fields;
          controller.exportHeadersMap = exportHeadersMap;
      };

      controller.registerSortOrder = function(field, asc) {
          controller.sortField = field;
          controller.sortAscending = asc;
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
          $timeout(function() {if (controller.delayedSearchActivated) {controller.refreshSearch();}}, 1000);
      };

    }]

  };
}]);
