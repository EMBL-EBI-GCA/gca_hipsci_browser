'use strict';

/* Controllers */

var controllers = angular.module('ebiscBrowser.controllers', []);

controllers.controller('LineDetailCtrl', ['$scope', '$routeParams', 'esClient',
  function($scope, $routeParams, esClient) {
    $scope.data = esClient.getSource({
        index: 'hipsci',
        type: 'cellLine',
        id: $routeParams.ipscName
    }).then(function(resp) {
        $scope.data = resp;
    });
  }
]);

controllers.controller('DonorDetailCtrl', ['$scope', '$routeParams', 'esClient',
  function($scope, $routeParams, esClient) {
    $scope.data = esClient.getSource({
        index: 'hipsci',
        type: 'donor',
        id: $routeParams.donorName
    }).then(function(resp) {
        $scope.data = resp;
    });
  }
]);

function listController($scope, $routeParams, itemSearcher) {
    $scope.searchParams = {
        documentType: 'donor',
        page: 0,
        size: 10,
        query: '',
        fields: ['name', 'sex'],
        columnHeaders: ['Name', 'Sex']
    };

    //child class should override this function;
    $scope.fieldToHref = function(fieldName, fieldValue) {
          return null;
  };

    $scope.search = function() {
        itemSearcher.search($scope.searchParams)
        .then(function(resp) {
            $scope.data = resp.hits.hits;
            $scope.numHits = resp.hits.total;
            for (var i=0; i<$scope.data.length; i++) {
                $scope.data[i].columnHrefs = {};
                for (var j=0; j<$scope.searchParams.fields.length; j++) {
                    var field = $scope.searchParams.fields[j];
                    if ($scope.data[i].fields[field] == null) continue;
                    $scope.data[i].columnHrefs[field] = $scope.fieldToHref(field, $scope.data[i].fields[field][0]);
                }
            }
        });
    };

    $scope.exportData = function(format) {
        var searchParams = $scope.searchParams;
        searchParams.page = 0;
        searchParams.size = $scope.numHits;
        itemSearcher.exportData(searchParams, format);
    };

    $scope.loadNext = function() {
        $scope.searchParams.page++;
        $scope.search();
    };

    $scope.loadPrevious = function() {
        $scope.searchParams.page--;
        $scope.search();
    };

};
listController.$inject = ['$scope', '$routeParams', 'itemSearcher'];


controllers.controller('DonorListCtrl', ['$scope', '$injector',
  function($scope, $injector) {
      $injector.invoke(listController, this, {$scope: $scope});
      $scope.searchParams.documentType = 'donor';
      $scope.searchParams.fields = ['name', 'sex'];
      $scope.searchParams.columnHeaders = ['Name', 'Sex'];

      $scope.fieldToHref = function(fieldName, fieldValue) {
          if (fieldName == 'name') {
              return "#/donors/" + fieldValue;
          }
          return null;
      };

      $scope.search();
  }
]);

controllers.controller('LineListCtrl', ['$scope', '$injector',
  function($scope, $injector) {
      $injector.invoke(listController, this, {$scope: $scope});
      $scope.searchParams.documentType = 'cellLine';
      $scope.searchParams.fields = ['name', 'donor', 'bioSamplesAccession'];
      $scope.searchParams.columnHeaders = ['Name', 'Donor', 'Biosamples ID'];

      $scope.fieldToHref = function(fieldName, fieldValue) {
          if (fieldName == 'name') {
              return "#/lines/" + fieldValue;
          }
          if (fieldName == 'bioSamplesAccession') {
              return "http://www.ebi.ac.uk/biosamples/sample/" + fieldValue;
          }
          return null;
      };

      $scope.search();
  }
]);

