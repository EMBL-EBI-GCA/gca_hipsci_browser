'use strict';

/* Controllers */

var controllers = angular.module('hipsciBrowser.controllers', []);

controllers.controller('LineDetailCtrl', ['$scope', '$routeParams', 'apiClient',
  function($scope, $routeParams, apiClient) {
    $scope.data = apiClient.getSource({
        type: 'cellLine',
        id: $routeParams.ipscName
    }).success(function(resp) {
        console.log(resp);
        $scope.data = resp['_source'];
    });
  }
]);

controllers.controller('DonorDetailCtrl', ['$scope', '$routeParams', 'apiClient',
  function($scope, $routeParams, apiClient) {
    $scope.data = apiClient.getSource({
        index: 'hipsci',
        type: 'donor',
        id: $routeParams.donorName
    }).success(function(resp) {
        $scope.data = resp['_source'];
    });
  }
]);


controllers.controller('DonorListCtrl', function() {
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

controllers.controller('LineListCtrl', function() {
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
              : field.match(/^assays/) ? '<td class="assay matrix-dot"><span class="assay"><a ng-if="'+hitStr+'" ng-href="https://www.ebi.ac.uk/ega/studies/{{'+hitStr+'}}" popover="'+controller.columnHeadersMap[field]+'" popover-trigger="mouseenter" target="_blank"><span ng-if="'+hitStr+'">&#x25cf;</span></a></span></td>'
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
