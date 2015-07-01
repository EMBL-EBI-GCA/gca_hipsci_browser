'use strict';

/* Controllers */

var controllers = angular.module('hipsciBrowser.controllers', []);

controllers.controller('LineDetailCtrl', ['$scope', '$routeParams', 'apiClient',
  function($scope, $routeParams, apiClient) {
    $scope.ipscName = $routeParams.ipscName;
    $scope.apiError = false;
    $scope.apiSuccess = false;
    $scope.data = apiClient.getSource({
        type: 'cellLine',
        id: $routeParams.ipscName
    }).then(function(resp) {
        $scope.apiSuccess = true;
        $scope.data = resp.data['_source'];
    }, function(resp) {
        $scope.apiError = true;
        $scope.apiStatus = resp.status;
        $scope.apiStatusText = resp.statusText;
    });

    this.assayToHref = function(assayObj) {
        if (assayObj.hasOwnProperty('archive') && assayObj.archive == 'EGA') {
            return 'https://www.ebi.ac.uk/ega/studies/'+assayObj.study;
        }
        if (assayObj.hasOwnProperty('archive') && assayObj.archive == 'ENA') {
            return 'http://www.ebi.ac.uk/ena/data/view/'+assayObj.study;
        }
        if (assayObj.hasOwnProperty('archive') && assayObj.archive == 'FTP') {
            return 'ftp://ftp.hipsci.ebi.ac.uk'+assayObj.path;
        }
    };
  }
]);

controllers.controller('DonorDetailCtrl', ['$scope', '$routeParams', 'apiClient',
  function($scope, $routeParams, apiClient) {
    $scope.donorName = $routeParams.donorName;
    $scope.apiError = false;
    $scope.apiSuccess = false;
    $scope.data = apiClient.getSource({
        index: 'hipsci',
        type: 'donor',
        id: $routeParams.donorName
    }).then(function(resp) {
        $scope.apiSuccess = true;
        $scope.data = resp.data['_source'];
    }, function(resp) {
        $scope.apiError = true;
        $scope.apiStatus = resp.status;
        $scope.apiStatusText = resp.statusText;
    });
  }
]);


controllers.controller('DonorListCtrl', function() {
    var controller=this;
    this.documentType = 'donor';
    this.initFields = ['name', 'sex.value', 'ethnicity', 'diseaseStatus.value', 'age', 'tissueProvider', 'bioSamplesAccession', 'cellLines'];

    this.columnHeadersMap = {
        name: 'Name',
        'sex.value': 'Sex',
        ethnicity: 'Ethnicity',
        'diseaseStatus.value': 'Disease Status',
        age: 'Age',
        tissueProvider: 'Tissue Provider',
        bioSamplesAccession: 'Biosample',
        cellLines: 'Cell Lines',
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
                field == 'bioSamplesAccession' ? '<td class="matrix-dot"><a ng-href="http://www.ebi.ac.uk/biosamples/sample/{{'+hitStr+'}}" target="_blank"><div class="matrix-dot-item biosample" popover="Biosample" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
              : field == 'cellLines' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.join(\', \')}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.length"></span></div></td>'
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
    this.initHtmlFields =  ['name', 'diseaseStatus.value', 'sex.value', 'sourceMaterial.value', 'tissueProvider', 'openAccess', 'bankingStatus', 'bioSamplesAccession',
        'gtarray', 'gexarray', 'exomeseq', 'rnaseq', 'mtarray', 'proteomics', 'cellbiol-fn' ];

    var assaysLocations = {'gtarray':'archive', 'gexarray':'archive', 'exomeseq':'archive', 'rnaseq':'archive', 'mtarray':'archive', 'proteomics':'ftp', 'cellbiol-fn':'ftp'};
    this.assaysFields = [];
    for (var field in assaysLocations) {
        if (assaysLocations[field] == 'archive') {
            this.assaysFields.push('assays.'+field+'.archive');
        }
        else if (assaysLocations[field] == 'ftp') {
            this.assaysFields.push('assays.'+field+'.archive');
        }
    }

    this.htmlFieldsToEsFields = function(htmlFields) {
        var esFields = [];
        for (var i=0; i<htmlFields.length; i++) {
            var field = htmlFields[i];
            if (assaysLocations.hasOwnProperty(field)) {
                if (assaysLocations[field] == 'archive') {
                    esFields.push('assays.' + field + '.archive');
                    esFields.push('assays.' + field + '.study');
                }
                else if (assaysLocations[field] == 'ftp') {
                    esFields.push('assays.' + field + '.path');
                }
            }
            else {
                esFields.push(field);
            }
        }
        return esFields;
    };

    this.initEsFields = this.htmlFieldsToEsFields(this.initHtmlFields);
    this.htmlFields = this.initHtmlFields;

    this.assayNamesMap = {
        gtarray: 'Genotyping array',
        gexarray: 'Expression array',
        exomeseq: 'Exome-seq',
        rnaseq: 'RNA-seq',
        mtarray: 'Methylation array',
        proteomics: 'Proteomics',
        'cellbiol-fn': 'Cellular phenotyping',
    };

    this.columnHeadersMap = {
        name: 'Name',
        'diseaseStatus.value': 'Disease Status',
        'sex.value': 'Sex',
        'sourceMaterial.value': 'Source Material',
        tissueProvider: 'Tissue Provider',
        bioSamplesAccession: 'Biosample',
        openAccess: 'Open access data',
        bankingStatus: 'Bank status',
    };
    this.filterFieldsMap = {};

    for (var assay in this.assayNamesMap) {
        if (assaysLocations[field] == 'archive') {
            this.columnHeadersMap['assays.'+ assay+ '.archive'] = this.assayNamesMap[assay] + ' archive';
            this.columnHeadersMap['assays.'+ assay+ '.study'] = this.assayNamesMap[assay] + ' study accession';
        }
        else if (assaysLocations[field] == 'ftp') {
            this.assaysFields.push('assays.'+field+'.archive');
            this.columnHeadersMap['assays.'+ assay+ '.path'] = this.assayNamesMap[assay] + ' ftp path';
        }
        this.filterFieldsMap['assays.'+ assay+ '.archive'] = this.assayNamesMap[assay];
    }
    console.log(this.columnHeadersMap);

    this.openAccessMap = {
        'T': 'Open access',
        'F': 'Managed access',
    };

    this.compileHead = function(esFields) {
        var trChildren = [];
        for (var i=0; i<controller.htmlFields.length; i++) {
            var field = controller.htmlFields[i];
            trChildren.push(
                field == 'bioSamplesAccession' ? '<th class="matrix-dot biosamplesaccession"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
              :  field == 'bankingStatus' ? '<th class="matrix-dot"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
              :  field == 'openAccess' ? '<th class="matrix-dot"><div><span>Data access</span></div></th>'
              :  assaysLocations.hasOwnProperty(field) ? '<th class="matrix-dot assay"><div><span>'+controller.assayNamesMap[field]+'</span></div></th>'
              : '<th class="sort">'+controller.columnHeadersMap[field]+'</th>'
            );
        }
        return trChildren;
    };

    this.compileRow = function(esFields) {
        var trChildren = [];
        for (var i=0; i<controller.htmlFields.length; i++) {
            var field = controller.htmlFields[i];
            var hitStr = 'hit['+i+']';
            trChildren.push(
                field == 'bioSamplesAccession' ? '<td class="matrix-dot"><a ng-href="http://www.ebi.ac.uk/biosamples/sample/{{'+hitStr+'}}" target="_blank"><div class="matrix-dot-item biosample" popover="Biosample" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
              : field == 'bankingStatus' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.text}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.letter"></span></div></td>'
              : field == 'openAccess' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.text}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.letter"></span></div></td>'
              : field == 'name' ? '<td class="name"><a ng-href="#/lines/{{'+hitStr+'}}" ng-bind="'+hitStr+'"</a></td>'
              : assaysLocations.hasOwnProperty(field) ? '<td class="matrix-dot"><a ng-if="'+hitStr+'" ng-href="{{'+hitStr+'}}" target="_blank"><div class="matrix-dot-item assay" popover="'+field+'" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
              : '<td ng-bind="'+hitStr+'"></td>'
            );
        }
        return trChildren;
    };

    this.processHitFields = function(hitFields, esFields) {
        var processedFields = [];
        for (var i=0; i<controller.htmlFields.length; i++) {
            var field = controller.htmlFields[i];
            if (hitFields.hasOwnProperty('assays.'+field+'.archive') && assaysLocations[field] == 'archive') {
                var archive = hitFields['assays.'+field+'.archive'][0];
                var study = hitFields['assays.'+field+'.study'][0];
                processedFields[i] = archive == 'EGA' ? 'https://www.ebi.ac.uk/ega/studies/'+study
                                : archive == 'ENA' ? 'http://www.ebi.ac.uk/ena/data/view/'+study
                                : undefined;
            }
            else if (hitFields.hasOwnProperty('assays.'+field+'.path') && assaysLocations[field] == 'ftp') {
                var path = hitFields['assays.'+field+'.path'][0];
                processedFields[i] = 'ftp://ftp.hipsci.ebi.ac.uk'+path;
            }
            else if (field == 'bankingStatus') {
                processedFields[i] = {letter: '', text: ''};
                if (hitFields.hasOwnProperty(field)) {
                    processedFields[i].text = hitFields[field][0];
                    processedFields[i].letter = hitFields[field][0].substr(0,1);
                }
            }
            else if (field == 'openAccess') {
                processedFields[i] = {letter: '', text: ''};
                if (hitFields.hasOwnProperty(field)) {
                    processedFields[i].text = hitFields[field][0] ? 'Open access' : 'Managed access';
                    processedFields[i].letter = hitFields[field][0] ? 'O' : 'M';
                }
            }
            else {
                processedFields[i] = ! hitFields.hasOwnProperty(field) ? undefined
                        : hitFields[field][0];
            }
        }
        return processedFields;
    };

});
