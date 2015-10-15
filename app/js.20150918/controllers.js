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

    this.initFields =  ['name', 'diseaseStatus.value', 'donor.sex.value', 'sourceMaterial.value', 'tissueProvider', 'openAccess', 'bankingStatus', 'bioSamplesAccession', 'calculated.assays'];
    this.assays = ['gtarray', 'gexarray', 'exomeseq', 'rnaseq', 'mtarray', 'proteomics', 'cellbiol-fn'];

    //this.assays = [ 'Genotyping array', 'Expression array', 'Exome-seq', 'RNA-seq', 'Methylation array', 'Proteomics', 'Cellular phenotyping', ];
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
        'calculated.assays': 'Assays data available',
    };

    this.compileHead = function(esFields) {
        var trChildren = [];
        for (var i=0; i<controller.initFields.length; i++) {
            var field = controller.initFields[i];
            if (field == 'calculated.assays') {
                for (var j=0; j<controller.assays.length; j++) {
                    trChildren.push(
                        '<th class="matrix-dot assay"><div><span>'+controller.assays[j]+'</span></div></th>'
                    );
                }
            }
            else {
                trChildren.push(
                    field == 'bioSamplesAccession' ? '<th class="matrix-dot biosamplesaccession"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
                  :  field == 'bankingStatus' ? '<th class="matrix-dot"><div><span>'+controller.columnHeadersMap[field]+'</span></div></th>'
                  :  field == 'openAccess' ? '<th class="matrix-dot"><div><span>Data access</span></div></th>'
                  : '<th class="sort">'+controller.columnHeadersMap[field]+'</th>'
                );
            }
        }
        return trChildren;
    };

    this.compileRow = function(esFields) {
        var trChildren = [];
        for (var i=0; i<esFields.length-1; i++) {
            var field = esFields[i];
            var hitStr = 'hit['+i+']';
            trChildren.push(
                field == 'bioSamplesAccession' ? '<td class="matrix-dot"><a ng-href="http://www.ebi.ac.uk/biosamples/sample/{{'+hitStr+'}}" target="_blank"><div class="matrix-dot-item biosample" popover="Biosample" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
              : field == 'bankingStatus' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.text}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.letter"></span></div></td>'
              : field == 'openAccess' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.text}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.letter"></span></div></td>'
              : field == 'name' ? '<td class="name"><a ng-href="#/lines/{{'+hitStr+'}}" ng-bind="'+hitStr+'"</a></td>'
              : '<td ng-bind="'+hitStr+'"></td>'
            );
        }
        for (var i=0; i<controller.assays.length; i++) {
            var hitStr = 'hit['+(i+esFields.length-1)+']';
            trChildren.push(
              '<td class="matrix-dot"><a ng-if="'+hitStr+'" ng-href="#/lines/{{'+hitStr+'}}"><div class="matrix-dot-item assay" popover="'+controller.assayNamesMap[controller.assays[i]]+'" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
            );
        }
        return trChildren;
    };

    this.processHitFields = function(hitFields, esFields) {
        var processedFields = [];
        for (var i=0; i<controller.initFields.length-1; i++) {
            var field = controller.initFields[i];
            if (field == 'bankingStatus') {
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
        if (hitFields.hasOwnProperty('calculated.assays')) {
            for (var j=0; j<controller.assays.length; j++) {
                processedFields.push(jQuery.inArray(controller.assayNamesMap[controller.assays[j]], hitFields['calculated.assays']) > -1 ? hitFields.name[0] : undefined);
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
              field == 'samples.name' ? '<td class="name"><a ng-if="'+hitStr+'.isIPS" ng-href="#/lines/{{'+hitStr+'.name}}" ng-bind="'+hitStr+'.name"></a><span ng-if="!'+hitStr+'.isIPS" ng-bind="'+hitStr+'.name" ></span></td>'
              : field == 'file' ? '<td class="name"><span ng-repeat="url in '+hitStr+'"><a ng-href="{{url}}"><span class="glyphicon glyphicon-download-alt" aria-hidden="true" style="padding-right:2px"></span></a></span></td>'
              : field == 'archive' ? '<td class="name"><a ng-href="{{'+hitStr+'.url}}" ng-bind="'+hitStr+'.name"></a></td>'
              : '<td ng-bind="'+hitStr+'"></td>'
            );
        }
        return trChildren;
    };

    this.processHitFields = function(hitFields, fields) {
        var processedFields = [];
        processedFields[0] = hitFields['samples.name'].length == 1 ? {name: hitFields['samples.name'][0], isIPS: hitFields['samples.cellType'][0] == 'iPSC' ? true : false}
                            : {name: hitFields['samples.name'].length + ' cell lines', isIPS: false};
        processedFields[1] = hitFields['assay.type'][0];
        processedFields[2] = hitFields.description[0];
        processedFields[3] = hitFields['files.url'];
        processedFields[4] = {
            name: hitFields.hasOwnProperty('archive.name') ? hitFields['archive.name'][0] : undefined,
            url: hitFields.hasOwnProperty('archive.url') ? hitFields['archive.url'][0] : undefined,
        };

        return processedFields;
    };


});
