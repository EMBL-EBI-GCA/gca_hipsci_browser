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
        $scope.data.bankingStatus = jQuery.grep($scope.data.bankingStatus, function(str) {return ! /shipped/i.test(str)});
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
        $scope.data.bankingStatus = {};
        for (var i=0; i<$scope.data.cellLines.length; i++) {
            var cellLine = $scope.data.cellLines[i];
            var joinedBankingStatus = cellLine.bankingStatus.join();
            var bankingStatus = joinedBankingStatus.match(/banked/i) ? 'banked'
                            : joinedBankingStatus.match(/pending/i) ? 'pending'
                            : joinedBankingStatus.match(/not selected/i) ? 'notselected'
                            : joinedBankingStatus.match(/selected/i) ? 'selected'
                            : '';
            if (! $scope.data.bankingStatus.hasOwnProperty(bankingStatus)) {
                $scope.data.bankingStatus[bankingStatus] = [];
            }
            $scope.data.bankingStatus[bankingStatus].push(cellLine.name);            
        }
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
    this.initFields = ['name', 'sex.value', 'ethnicity', 'diseaseStatus.value', 'age', 'tissueProvider', 'bioSamplesAccession', 'cellLines.name'];

    this.columnHeadersMap = {
        name: 'Name',
        'sex.value': 'Sex',
        ethnicity: 'Ethnicity',
        'diseaseStatus.value': 'Disease Status',
        age: 'Age',
        tissueProvider: 'Tissue Provider',
        bioSamplesAccession: 'Biosample',
        'cellLines.name': 'Cell Lines',
    };

    this.compileHead = function(fields) {
        var trChildren = [];
        for (var i=0; i<fields.length; i++) {
            var field = fields[i];
            trChildren.push(
                field == 'bioSamplesAccession' ? '<th class="matrix-dot biosamplesaccession"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
              :  field == 'cellLines.name' ? '<th class="matrix-dot"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
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
              : field == 'cellLines.name' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.join(\', \')}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.length"></span></div></td>'
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
                    : field == 'cellLines.name' ? hitFields[field]
                    : hitFields[field][0];
        }
        return processedFields;
    };



});

controllers.controller('LineListCtrl', function() {
    var controller = this;
    this.documentType = 'cellLine';
    this.initHtmlFields =  ['name', 'diseaseStatus.value', 'donor.sex.value', 'sourceMaterial.value', 'tissueProvider', 'openAccess', 'bankingStatus', 'bioSamplesAccession',
        'gtarray', 'gexarray', 'exomeseq', 'rnaseq', 'mtarray', 'proteomics', 'cellbiol-fn' ];

    var assaysLocations = {'gtarray':'archive', 'gexarray':'archive', 'exomeseq':'archive', 'rnaseq':'archive', 'mtarray':'archive', 'proteomics':'ftp', 'cellbiol-fn':'ftp'};
    this.assaysFields = [];
    for (var field in assaysLocations) {
        if (assaysLocations[field] == 'archive') {
            this.assaysFields.push('assays.'+field+'.archive');
        }
        else if (assaysLocations[field] == 'ftp') {
            this.assaysFields.push('assays.'+field+'.path');
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
        'donor.sex.value': 'Sex',
        'sourceMaterial.value': 'Source Material',
        tissueProvider: 'Tissue Provider',
        bioSamplesAccession: 'Biosample',
        openAccess: 'Open access data',
        bankingStatus: 'Bank status',
    };
    this.filterFieldsMap = {};

    for (var assay in this.assayNamesMap) {
        if (assaysLocations[assay] == 'archive') {
            this.columnHeadersMap['assays.'+ assay+ '.archive'] = this.assayNamesMap[assay] + ' archive';
            this.columnHeadersMap['assays.'+ assay+ '.study'] = this.assayNamesMap[assay] + ' study accession';
            this.filterFieldsMap['assays.'+ assay+ '.archive'] = this.assayNamesMap[assay];
        }
        else if (assaysLocations[assay] == 'ftp') {
            this.columnHeadersMap['assays.'+ assay+ '.path'] = this.assayNamesMap[assay] + ' ftp path';
            this.filterFieldsMap['assays.'+ assay+ '.path'] = this.assayNamesMap[assay];
        }
    }

    this.compileHead = function(esFields) {
        var trChildren = [];
        for (var i=0; i<controller.htmlFields.length; i++) {
            var field = controller.htmlFields[i];
            trChildren.push(
                field == 'bioSamplesAccession' ? '<th class="matrix-dot biosamplesaccession"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
              :  field == 'bankingStatus' ? '<th class="matrix-dot"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
              :  field == 'openAccess' ? '<th class="matrix-dot"><div><span>Data access</span></div></th>'
              :  assaysLocations.hasOwnProperty(field) ? '<th class="matrix-dot assay"><div><span>'+field+'</span></div></th>'
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
              : assaysLocations.hasOwnProperty(field) ? '<td class="matrix-dot"><a ng-if="'+hitStr+'" ng-href="{{'+hitStr+'}}" target="_blank"><div class="matrix-dot-item assay" popover="'+controller.assayNamesMap[field]+'" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
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
                    processedFields[i].text = jQuery.grep(hitFields[field], function(str) {return ! /shipped/i.test(str)}).join(', ');
                    processedFields[i].letter = /banked/i.test(processedFields[i].text) ? 'B'
                                            : /pending/i.test(processedFields[i].text) ? 'P'
                                            : /not selected/i.test(processedFields[i].text) ? 'N'
                                            : /selected/i.test(processedFields[i].text) ? 'S'
                                            : '';
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

    var bankingStatusSortRegex = [/banked/i, /^selected/i, /pending/i]
    this.bankingStatusSort = function(a,b) {
        for (var i=0; i<bankingStatusSortRegex.length; i++) {
            var a_passes = bankingStatusSortRegex[i].test(a.term) ? 1 : 0;
            var b_passes = bankingStatusSortRegex[i].test(b.term) ? 1 : 0;
            if (a_passes != b_passes) {
                return b_passes - a_passes;
            }
        }
    };

});

controllers.controller('FileListCtrl', function() {
    var controller=this;
    this.documentType = 'file';
    this.esFields = ['files.name', 'files.md5', 'files.url', 'assay.type', 'description', 'samples.name', 'samples.cellType',
        'samples.bioSamplesAccession', 'archive.name', 'archive.accessionType',
        'archive.accession', 'archive.url',
        'assay.growingConditions', 'samples.diseaseStatus', 'samples.sex', 'assay.description'];

    this.columnHeadersMap = {
        'files.name': 'File name',
        'files.md5': 'md5',
        'files.url': 'File url',
        'assay.type': 'Assay',
        'description': 'Description',
        'samples.name': 'Cell line',
        'samples.cellType': 'Cell type',
        'samples.bioSamplesAccession': 'Biosample',
        'archive.name': 'Archive',
        'archive.accessionType': 'Accession type',
        'archive.accession': 'Accession',
        'archive.url': 'Archive url',
        'assay.growingConditions': 'Cell line growing conditions for this assay',
        'samples.diseaseStatus': 'Disease status',
        'samples.sex': 'Sex',
        'assay.description': 'Assay description',
    };

    this.htmlFields = [
        'samples.name', 'assay.type', 'description', 'file', 'archive'
    ];

    this.htmlHeadersMap = {
        'samples.name': 'Cell line',
        'assay.type': 'Assay',
        'description': 'Description',
        'file': 'File download',
        'archive': 'Archive'
    };

    this.compileHead = function(fields) {
        var trChildren = [];
        for (var i=0; i<controller.htmlFields.length; i++) {
            var field = controller.htmlFields[i];
            trChildren.push(
              '<th class="sort">'+controller.htmlHeadersMap[field]+'</th>'
            );
        }
        return trChildren;
    };

    this.compileRow = function(fields) {
        var trChildren = [];
        for (var i=0; i<controller.htmlFields.length; i++) {
            var field = controller.htmlFields[i];
            var hitStr = 'hit['+i+']';
            trChildren.push(
              field == 'samples.name' ? '<td class="name"><div ng-repeat="sample in '+hitStr+'"><a ng-if="sample.isIPS" ng-href="#/lines/{{sample.name}}" ng-bind="sample.name"></a><span ng-if="!sample.isIPS" ng-bind="sample.name" ></span></div></td>'
              : field == 'file' ? '<td class="name"><span ng-repeat="url in '+hitStr+'"><a ng-href="{{url}}"><span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span></a></span></td>'
              : field == 'archive' ? '<td class="name"><a ng-href="{{'+hitStr+'.url}}" ng-bind="'+hitStr+'.name"></a></td>'
              : '<td ng-bind="'+hitStr+'"></td>'
            );
        }
        return trChildren;
    };

    this.processHitFields = function(hitFields, fields) {
        var processedFields = [];
        processedFields[0] = [];
        processedFields[1] = hitFields['assay.type'][0];
        processedFields[2] = hitFields.description[0];
        processedFields[3] = hitFields['files.url'];
        processedFields[4] = {
            name: hitFields.hasOwnProperty('archive.name') ? hitFields['archive.name'][0] : undefined,
            url: hitFields.hasOwnProperty('archive.url') ? hitFields['archive.url'][0] : undefined,
        };

        for (var i=0; i<hitFields['samples.name'].length; i++) {
            processedFields[0].push({ name: hitFields['samples.name'][i], isIPS: hitFields['samples.cellType'][i] == 'iPSC' ? true : false});
        }
        return processedFields;
    };


});
