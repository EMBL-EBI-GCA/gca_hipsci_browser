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

    this.fileFields = [
      {visible: true,  selectable: false, sortable: true,  esName: 'assay.type',       label: 'Assay'},
      {visible: true,  selectable: false, sortable: true,  esName: 'description',      label: 'Description'},
      {visible: true,  selectable: true,  sortable: false, esName: 'archive.ftpUrl',   label: 'File download'},
      {visible: true,  selectable: true,  sortable: true,  esName: 'archive.name',     label: 'Archive'},
      {visible: false, selectable: true,  sortable: true,  esName: 'archive.accession',label: 'Accession'},
      {visible: true, selectable: true,  sortable: true,  esName: 'assay.growingConditions', label: 'Culture'},
      {visible: false, selectable: true,  sortable: false,  esName: 'files.name', label: 'File name'},
      {visible: false, selectable: true,  sortable: false,  esName: 'files.md5', label: 'File md5'},

      {visible: false, selectable: false, esName: 'archive.url'},
      {visible: false, selectable: false, esName: 'samples.cellType'},
      {visible: false,  selectable: false, esName: 'samples.name'},
    ];
    
    for (var i=0; i<this.fileFields.length; i++) {
      var field = this.fileFields[i];
      if (field.visible || field.selectable) {
          field.th = '<th>'+field.label+'</th>'
          var hitStr = 'hit['+i+']';
          field.td = 
                field.esName == 'archive.ftpUrl' ? '<td><a ng-if="'+hitStr+'" ng-href="{{'+hitStr+'}}" target="_blank"><span class="glyphicon glyphicon-download-alt" aria-hidden="true" ></span></a></td>'
                : field.esName == 'archive.name' ? '<td class="name"><a ng-href="{{'+hitStr+'.url}}" target="_blank" ng-bind="'+hitStr+'.name"></a></td>'
                : field.esName == 'files.name' || field.esName == 'files.md5' ? '<td class="name"><div class="wide-td"><div ng-repeat="file in '+hitStr+'"><span ng-bind="file"></span><br ng-if="!$last"></div></div></td>'
               : '<td ng-bind="'+hitStr+'"></td>';
      }
    }
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

    this.fields = [
        {visible: true, selectable: false, sortable: true , esName: 'name', label: 'Name'},
        {visible: true, selectable: false, sortable: true , esName: 'sex.value', label: 'Sex'},
        {visible: true, selectable: false, sortable: true , esName: 'ethnicity', label: 'Ethnicity'},
        {visible: true, selectable: false, sortable: true , esName: 'diseaseStatus.value', label: 'Disease Status'},
        {visible: true, selectable: false, sortable: true , esName: 'age', label: 'Age'},
        {visible: true, selectable: false, sortable: true , esName: 'tissueProvider', label: 'Tissue Provider'},
        {visible: true, selectable: false, sortable: false, esName: 'bioSamplesAccession', label: 'Biosample'},
        {visible: true, selectable: false, sortable: false, esName: 'cellLines.name', label: 'Cell Lines'},
    ];

    for (var i=0; i<this.fields.length; i++) {
        var field = this.fields[i];
        if (field.visible || field.selectable) {
            field.th = 
                field.esName == 'bioSamplesAccession' ? '<th class="matrix-dot biosamplesaccession"><div><span>'+field.label+'</span></div></th>'
              :  field.esName == 'cellLines.name' ? '<th class="matrix-dot"><div><span>'+field.label+'</span></div></th>'
              : '<th>'+field.label+'</th>'
            var hitStr = 'hit['+i+']';
            field.td = 
                field.esName == 'bioSamplesAccession' ? '<td class="matrix-dot"><a ng-href="http://www.ebi.ac.uk/biosamples/sample/{{'+hitStr+'}}" target="_blank"><div class="matrix-dot-item biosample" popover="Biosample" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
              : field.esName == 'cellLines.name' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.join(\', \')}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.length"></span></div></td>'
              : field.esName == 'name' ? '<td class="name"><a ng-href="#/donors/{{'+hitStr+'}}" ng-bind="'+hitStr+'"</a></td>'
              : '<td ng-bind="'+hitStr+'"></td>'
        }
    }

    this.processHitFields = function(hitFields, fields) {
        var processedFields = [];
        for (var i=0; i<fields.length; i++) {
            var field = fields[i];
            processedFields[i] = ! hitFields.hasOwnProperty(field.esName) ? undefined
                    : field.esName == 'cellLines.name' ? hitFields[field.esName]
                    : hitFields[field.esName][0];
        }
        return processedFields;
    };



});

controllers.controller('LineListCtrl', function() {
    var controller = this;
    this.documentType = 'cellLine';

    this.assays = [
                {short: 'gtarray', long: 'Genotyping array'},
                {short: 'gexarray', long: 'Expression array'},
                {short: 'exomeseq', long: 'Exome-seq'},
                {short: 'rnaseq', long: 'RNA-seq'},
                {short: 'mtarray', long: 'Methylation array'},
                {short: 'proteomics', long: 'Proteomics'},
                {short: 'cellbiol-fn', long: 'Cellular phenotyping'},
        ];

    this.fields = [
        {visible: true,  sortable: true,  selectable: false, esName: 'name', label: 'Name'},
        {visible: false,  sortable: true,  selectable: true,  esName: 'cellType.value', label: 'Cell Type'},
        {visible: true,  sortable: true,  selectable: true,  esName: 'diseaseStatus.value', label: 'Disease Status'},
        {visible: true,  sortable: true,  selectable: true,  esName: 'donor.sex.value', label: 'Sex'},
        {visible: false, sortable: true,  selectable: true,  esName: 'donor.ethnicity', label: 'Ethnicity'},
        {visible: true,  sortable: true,  selectable: true,  esName: 'sourceMaterial.value', label: 'Source Material'},
        {visible: true,  sortable: true,  selectable: true,  esName: 'tissueProvider', label: 'Tissue Provider'},
        {visible: false, sortable: true,  selectable: true,  esName: 'reprogramming.methodOfDerivation', label: 'Method of derivation'},
        {visible: false, sortable: true,  selectable: true,  esName: 'reprogramming.dateOfDerivation', label: 'Date of derivation'},
        {visible: true,  sortable: false, selectable: false, esName: 'bioSamplesAccession', label: 'Biosample'},
        {visible: true,  sortable: false, selectable: false, esName: 'openAccess', label: 'Open access data'},
        {visible: true,  sortable: false, selectable: false, esName: 'bankingStatus', label: 'Bank status'},

        {visible: true,  sortable: false, selectable: false, esName: 'calculated.assays', label: 'Assays data available'},
    ];

    for (var i=0; i<this.fields.length; i++) {
        var field = this.fields[i];
        if (field.visible || field.selectable) {
            field.th = 
                field.esName == 'bioSamplesAccession' ? '<th class="matrix-dot biosamplesaccession"><div><span>'+field.label+'</span></div></th>'
              : field.esName == 'bankingStatus' ? '<th class="matrix-dot"><div><span>'+field.label+'</span></div></th>'
              : field.esName == 'openAccess' ? '<th class="matrix-dot"><div><span>Data access</span></div></th>'
              : field.esName == 'calculated.assays' ? '<th ng-repeat="assay in compileParams.assays" class="matrix-dot assay"><div><span ng-bind="assay.short"></span></div></th>'
              : '<th>'+field.label+'</th>'
            var hitStr = 'hit['+i+']';
            field.td = 
                field.esName == 'bioSamplesAccession' ? '<td class="matrix-dot"><a ng-href="http://www.ebi.ac.uk/biosamples/sample/{{'+hitStr+'}}" target="_blank"><div class="matrix-dot-item biosample" popover="Biosample" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
              : field.esName == 'bankingStatus' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.text}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.letter"></span></div></td>'
              : field.esName == 'openAccess' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.text}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.letter"></span></div></td>'
              : field.esName == 'name' ? '<td class="name"><a ng-href="#/lines/{{'+hitStr+'}}" ng-bind="'+hitStr+'"</a></td>'
              : field.esName == 'calculated.assays' ? '<td ng-repeat="assay in compileParams.assays" class="matrix-dot"><a ng-if="'+hitStr+'[$index]" ng-href="#/lines/{{hit[0]}}"><div class="matrix-dot-item assay" popover="{{assay.long}}" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
              : '<td ng-bind="'+hitStr+'"></td>'
        }
    }

    this.processHitFields = function(hitFields, fields) {
        var processedFields = [];
        for (var i=0; i<fields.length; i++) {
            var field = fields[i];
            if (field.esName == 'bankingStatus') {
                processedFields[i] = {letter: '', text: ''};
                if (hitFields.hasOwnProperty(field.esName)) {
                    processedFields[i].text = jQuery.grep(hitFields[field.esName], function(str) {return ! /shipped/i.test(str)}).join(', ');
                    processedFields[i].letter = /banked/i.test(processedFields[i].text) ? 'B'
                                            : /pending/i.test(processedFields[i].text) ? 'P'
                                            : /not selected/i.test(processedFields[i].text) ? 'N'
                                            : /selected/i.test(processedFields[i].text) ? 'S'
                                            : '';
                }
            }
            else if (field.esName == 'openAccess') {
                processedFields[i] = {letter: '', text: ''};
                if (hitFields.hasOwnProperty(field.esName)) {
                    processedFields[i].text = hitFields[field.esName][0] ? 'Open access' : 'Managed access';
                    processedFields[i].letter = hitFields[field.esName][0] ? 'O' : 'M';
                }
            }
            else if (field.esName == 'calculated.assays') {
                processedFields[i] = [];
                for (var j=0; j<controller.assays.length; j++) {
                    processedFields[i].push(jQuery.inArray(controller.assays[j].long, hitFields[field.esName]) > -1 ? true: false);
                }
            }
            else {
                processedFields[i] = ! hitFields.hasOwnProperty(field.esName) ? undefined
                        : hitFields[field.esName][0];
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

    this.htmlFields = [
      {visible: true,  selectable: false, sortable: true,  esName: 'samples.name',     label: 'Cell line'},
      {visible: true,  selectable: false, sortable: true,  esName: 'assay.type',       label: 'Assay'},
      {visible: true,  selectable: false, sortable: true,  esName: 'description',      label: 'Description'},
      {visible: true,  selectable: true,  sortable: false, esName: 'archive.ftpUrl',   label: 'File download'},
      {visible: true,  selectable: true,  sortable: true,  esName: 'archive.name',     label: 'Archive'},
      {visible: false, selectable: true,  sortable: true,  esName: 'archive.accession',label: 'Accession'},
      {visible: false, selectable: true,  sortable: true,  esName: 'samples.sex',      label: 'Sex'},
      {visible: false, selectable: true,  sortable: true,  esName: 'assay.growingConditions', label: 'Culture'},
      {visible: false, selectable: true,  sortable: false,  esName: 'files.name', label: 'File name'},
      {visible: false, selectable: true,  sortable: false,  esName: 'files.md5', label: 'File md5'},

      {visible: false, selectable: false, esName: 'archive.url'},
      {visible: false, selectable: false, esName: 'samples.cellType'},
    ];

    this.exportFields = [
      {esName: 'files.name',       label: 'File name'},
      {esName: 'files.md5',        label: 'md5'},
      {esName: 'archive.ftpUrl',   label: 'FTP url'},
      {esName: 'assay.type',       label: 'Assay'},
      {esName: 'description',      label: 'Description'},
      {esName: 'samples.name',     label: 'Cell line'},
      {esName: 'samples.cellType', label: 'Cell type'},
      {esName: 'samples.bioSamplesAccession', label: 'Biosample'},
      {esName: 'archive.name',     label: 'Archive'},
      {esName: 'archive.accessionType', label: 'Accession type'},
      {esName: 'archive.accession',label: 'Accession'},
      {esName: 'archive.url',      label: 'Archive url'},
      {esName: 'assay.growingConditions', label: 'Cell line growing conditions for this assay'},
      {esName: 'samples.diseaseStatus', label: 'Disease status'},
      {esName: 'samples.sex',      label: 'Sex'},
      {esName: 'assay.description',label: 'Assay description'},
    ];

    for (var i=0; i<this.htmlFields.length; i++) {
        var field = this.htmlFields[i];
        if (field.visible || field.selectable) {
            field.th = '<th>'+field.label+'</th>';
            var hitStr = 'hit['+i+']';
            field.td = 
                  field.esName == 'samples.name' ? '<td class="name"><a ng-href="#/lines/{{'+hitStr+'}}" ng-bind="'+hitStr+'"></a></td>'
                  : field.esName == 'archive.ftpUrl' ? '<td><a ng-if="'+hitStr+'" ng-href="{{'+hitStr+'}}" target="_blank"><span class="glyphicon glyphicon-download-alt" aria-hidden="true" ></span></a></td>'
                  : field.esName == 'archive.name' ? '<td><a ng-href="{{'+hitStr+'.url}}" target="_blank" ng-bind="'+hitStr+'.name"></a></td>'
                  : field.esName == 'files.name' || field.esName == 'files.md5' ? '<td style="white-space: nowrap; max-width: 300px"><div style="overflow: scroll"><div ng-repeat="file in '+hitStr+'"><span ng-bind="file"></span><br ng-if="!$last"></div></div></td>'
                  : '<td ng-bind="'+hitStr+'"></td>'
        }
    }

    this.processHitFields = function(hitFields, fields) {
        var processedFields = [];
        for (var i=0; i<fields.length; i++) {
            if (fields[i].esName == 'archive.name') {
                processedFields[i] = {
                    name: hitFields.hasOwnProperty('archive.name') ? hitFields['archive.name'][0] : undefined,
                    url: hitFields.hasOwnProperty('archive.url') ? hitFields['archive.url'][0] : undefined,
                }
            }
            else if (fields[i].esName == 'files.name' || fields[i].esName == 'files.md5') {
                processedFields[i] = hitFields.hasOwnProperty(fields[i].esName) ? hitFields[fields[i].esName] : [];
            }
            else {
                processedFields[i] = hitFields.hasOwnProperty(fields[i].esName) && hitFields[fields[i].esName].length == 1 ? hitFields[fields[i].esName][0] : undefined;
            }
        }
        return processedFields;
    };


});