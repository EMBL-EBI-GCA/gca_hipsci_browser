'use strict';

var listUtils = angular.module('hipsciBrowser.listUtils', []);

listUtils.controller('DonorCtrl', function() {
    this.documentType = 'donor';
    this.fields = ['name', 'sex', 'ethnicity', 'diseaseStatus', 'age', 'bioSamplesAccession', 'cellLines'];
    this.columnHeaders = ['Name', 'Sex', 'Ethnicity', 'Disease Status', 'Age', 'Biosample', 'Cell Lines'];

    this.fieldType = function(field) {
        return field;
    };
    this.fieldMatrixClass = function(field) {
        var cssClass = this.fieldType(field).toLowerCase();
        if (cssClass == 'biosamplesaccession' || cssClass == 'celllines') {
            cssClass = cssClass + ' matrix-dot';
        }
        return cssClass;
    };

});

listUtils.controller('LineCtrl', function() {
    this.documentType = 'cellLine';
    this.fields =  ['name', 'diseaseStatus', 'sex', 'sourceMaterial', 'tissueProvider', 'bioSamplesAccession', 'assays.exomeseq', 'assays.rnaseq', 'assays.gtarray', 'assays.gexarray', 'assays.mtarray'];
    this.columnHeaders = ['Name', 'Disease Status', 'Sex', 'Source Material', 'Tissue Provider', 'Biosample', 'exomeseq', 'rnaseq', 'gtarray', 'gexarray', 'mtarray'];

    this.assaysFields =  ['assays.exomeseq', 'assays.rnaseq', 'assays.gtarray', 'assays.gexarray', 'assays.mtarray'];
    this.assaysHeaders = ['exomeseq', 'rnaseq', 'gtarray', 'gexarray', 'mtarray'];

    this.fieldType = function(field) {
        if (field.match(/^assays/)) {
            return 'assay';
        }
        return field;
    };
    this.fieldMatrixClass = function(field) {
        var cssClass = this.fieldType(field).toLowerCase();
        if (cssClass == 'assay' || cssClass == 'biosamplesaccession') {
            cssClass = cssClass + ' matrix-dot';
        }
        return cssClass;
    };
});


listUtils.directive('listPanel', ['esClient', function (esClient) {
  return {
    controllerAs: 'ListPanelCtrl',
    restrict: 'E',
    transclude: true,
    scope: true,
    link: function(scope, iElement, iAttrs, controller, transcludeFn) {
      transcludeFn(scope, function(clonedTranscludedContent) {
          iElement.append(clonedTranscludedContent);
      });
      controller.documentType = scope.$parent.$eval(iAttrs.documentType);
      controller.columnHeaders = scope.$parent.$eval(iAttrs.columnHeaders);
      controller.fields = scope.$parent.$eval(iAttrs.fields);

      iElement.find('aggs-filter').each(function() {controller.waitForAggs++;});
      if (controller.waitForAggs == 0) {
          controller.refreshSearch();
      }
    },
    controller: ['$timeout', function ($timeout) {
      var controller = this;
      controller.currentPage = 1;
      controller.numPages = 0;
      controller.hitsPerPage = 10;
      controller.displayResults = [];
      controller.numHits = 0;
      controller.query = '';

      controller.waitForAggs = 0;
      controller.delayedSearchActivated = false;

      var cachedHits = [];
      var filterReqs = {};
      var filterCallbacks = {};
      var aggReqs = {};
      var aggExcludeFilters = {};
      var aggCallbacks = {};
  
      var search = function() {
        controller.delayedSearchActivated = false;
        var searchBody = {
          fields: controller.fields,
          size: controller.hitsPerPage,
          from: (controller.currentPage -1) * controller.hitsPerPage,
        };

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


        return esClient.search( {
          index: 'hipsci',
          type: controller.documentType,
          body: searchBody,
        }).then(function(resp) {
          controller.numHits = resp.hits.total;
          controller.numPages = Math.ceil(controller.numHits / controller.hitsPerPage);
          var displayResults = [];
          for (var i=0; i<resp.hits.hits.length; i++) {
              var listItem = {};
              for (var field in resp.hits.hits[i].fields) {
                  // This is a temporary hack and I need to get rid of it.
                  if (field === 'cellLines') {
                      listItem[field] = resp.hits.hits[i].fields[field];
                  }
                  else {
                      listItem[field] = resp.hits.hits[i].fields[field][0];
                  }
              }
              displayResults.push(listItem);
          }
          controller.displayResults = displayResults;
          cachedHits[controller.currentPage] = controller.displayResults;

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
        });
      };
  
      controller.exportData = function(format) {
        var form = document.createElement('form');
        var searchBody = {
        fields: controller.fields,
        column_names: controller.columnHeaders,
        from: 0,
        size: controller.numHits,
        };

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
        cachedHits.length = 0;
        search();
      };
      controller.setPage = function () {
        var displayResults = cachedHits[controller.currentPage];
        if (typeof displayResults == "undefined") {
          search();
        }
        else {
          controller.displayResults = displayResults
        }
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
          controller.waitForAggs --;
          if (controller.waitForAggs <= 0) {
              controller.refreshSearch();
          }

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
