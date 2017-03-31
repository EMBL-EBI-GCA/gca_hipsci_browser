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
        if ($scope.data.bankingStatus) {
            var banked = false;
            var bankingStatus = [];
            for (var i=0; i<$scope.data.bankingStatus.length; i++) {
                if (/shipped/i.test($scope.data.bankingStatus[i])) {
                    continue;
                }
                if ($scope.data.ecaccCatalogNumber && /banked.*ecacc/i.test($scope.data.bankingStatus[i])) {
                    $scope.data.purchaseUrl = 'http://www.phe-culturecollections.org.uk/products/celllines/ipsc/detail.jsp?refId='+$scope.data.ecaccCatalogNumber+'&collection=ecacc_ipsc';
                    bankingStatus.push({
                        text: $scope.data.bankingStatus[i],
                        url: $scope.data.purchaseUrl,
                    });
                    banked = true;
                }
                else if ($scope.data.ebiscName && /banked.*ebisc/i.test($scope.data.bankingStatus[i])) {
                    bankingStatus.push({
                        text: $scope.data.bankingStatus[i] + ' as ' + $scope.data.ebiscName,
                        url: 'https://cells.ebisc.org/'+$scope.data.ebiscName+'/',
                    });
                    banked = true;
                }
                else {
                    bankingStatus.push({
                        text: $scope.data.bankingStatus[i]
                    });
                }
            }
            if (banked) {
                bankingStatus = jQuery.grep(bankingStatus, function(obj) {return ! /selected/i.test(obj.text)});
            }
            $scope.data.bankingStatus = bankingStatus;
        }

        var proteomics = jQuery.grep($scope.data.assays, function(obj) {return obj.name === 'Proteomics' ? 1 : 0});
        if (proteomics.length > 0) {
          $scope.peptrackerUrl = proteomics[0].peptrackerURL;
        };
    }, function(resp) {
        $scope.apiError = true;
        $scope.apiStatus = resp.status;
        $scope.apiStatusText = resp.statusText;
    });


    this.assayToHref = function(assayObj) {
        if (assayObj.hasOwnProperty('archive') && assayObj.archive == 'EGA') {
            return 'https://ega-archive.org/studies/'+assayObj.study;
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
      {visible: false, selectable: true,  sortable: true,  esName: 'assay.instrument', label: 'Instrument'},
      {visible: true,  selectable: true,  sortable: false, esName: 'archive.ftpUrl',   label: 'File download'},
      {visible: true,  selectable: true,  sortable: true,  esName: 'archive.name',     label: 'Archive'},
      {visible: false, selectable: true,  sortable: true,  esName: 'archive.accession',label: 'Accession'},
      {visible: true, selectable: true,  sortable: true,  esName: 'samples.growingConditions', label: 'Culture'},
      {visible: true, selectable: true,  sortable: true,  esName: 'samples.passageNumber', label: 'Passage'},
      {visible: false, selectable: true,  sortable: false,  esName: 'files.name', label: 'File name'},
      {visible: false, selectable: true,  sortable: false,  esName: 'files.md5', label: 'File md5'},

      {visible: false, selectable: false, esName: 'archive.url'},
      {visible: false, selectable: false, esName: 'archive.openAccess'},
      {visible: false, selectable: false, esName: 'samples.cellType'},
      {visible: false,  selectable: false, esName: 'samples.name'},
    ];
    
    for (var i=0; i<this.fileFields.length; i++) {
      var field = this.fileFields[i];
      if (field.visible || field.selectable) {
        field.th = field.esName == 'assay.type' ? '<th>'+field.label+'<md-modal modal-md="assays" title="Assays"></md-modal></th>'
            : field.esName == 'archive.ftpUrl' ? '<th>'+field.label+'<md-modal modal-md="files-access" title="Data access"></md-modal></th>'
            : '<th>'+field.label+'</th>';
          var hitStr = 'hit['+i+']';
          field.td = 
                field.esName == 'samples.name' ? '<td class="name valign"><div class="chevron" ng-if="'+[hitStr]+'.length>5"><span class="glyphicon glyphicon-chevron-up" aria-hidden="true"></span></div><div ng-class="{\'tall-td\': '+[hitStr]+'.length>5}"><div ng-repeat="name in '+hitStr+'"><a ng-href="#/lines/{{name}}" ng-bind="name"></a><br ng-if="!$last"></div></div><div class="chevron bottom-chevron" ng-if="'+[hitStr]+'.length>5"><span class="glyphicon glyphicon-chevron-down" aria-hidden="true"></span></div></td>'
                : field.esName == 'archive.ftpUrl' ? '<td class="valign"><a ng-if="'+hitStr+'" ng-href="{{'+hitStr+'}}" target="_blank"><span class="glyphicon glyphicon-download-alt" aria-hidden="true" ></span></a></td>'
                : field.esName == 'archive.name' ? '<td class="name valign"><a ng-href="{{'+hitStr+'.url}}" target="_blank" ng-bind="'+hitStr+'.name"></a></td>'
                : field.esName == 'files.name' || field.esName == 'files.md5' ? '<td class="name valign"><div class="wide-td"><div ng-repeat="file in '+hitStr+'"><span ng-bind="file"></span><br ng-if="!$last"></div></div></td>'
               : '<td class="valign" ng-bind="'+hitStr+'"></td>';
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
            else if (fields[i].esName == 'samples.growingConditions' && hitFields.hasOwnProperty(fields[i].esName)) {
                var j = hitFields['samples.name'].indexOf($scope.ipscName);
                processedFields[i] = j>-1 ? hitFields[fields[i].esName][j] : undefined;
            }
            else if (fields[i].esName == 'samples.passageNumber' && hitFields.hasOwnProperty(fields[i].esName)) {
                var j = hitFields['samples.name'].indexOf($scope.ipscName);
                processedFields[i] = j>-1 ? hitFields[fields[i].esName][j] : undefined;
            }
            else if (fields[i].esName == 'archive.ftpUrl') {
                processedFields[i] = hitFields.hasOwnProperty(fields[i].esName) && hitFields.hasOwnProperty('archive.openAccess') && hitFields['archive.openAccess'][0] ? hitFields[fields[i].esName][0] : undefined;
            }
            else if (fields[i].esName == 'files.name' || fields[i].esName == 'files.md5' || fields[i].esName == 'samples.name') {
                processedFields[i] = hitFields.hasOwnProperty(fields[i].esName) ? hitFields[fields[i].esName] : [];
            }
            else {
                processedFields[i] = hitFields.hasOwnProperty(fields[i].esName) && hitFields[fields[i].esName].length == 1 ? hitFields[fields[i].esName][0] : undefined;
            }
        }
        return processedFields;
    };

  }
]);

controllers.controller('LineAssayCtrl', ['$scope', '$routeParams', '$location', 'apiClient', '$modal',
  function($scope, $routeParams, $location, apiClient, $modal) {
    var c = this;
    $scope.ipscName = $routeParams.ipscName;
    $scope.apiError = false;
    $scope.apiSuccess = false;
    var assayMap = {
                'gtarray': 'Genotyping array',
                'gexarray': 'Expression array',
                'exomeseq': 'Exome-seq',
                'rnaseq': 'RNA-seq',
                'wgs': 'Whole genome sequencing',
                'mtarray': 'Methylation array',
                'proteomics': 'Proteomics',
                'cellbiol-fn': 'Cellular phenotyping',
        };
    $scope.assay = assayMap[$routeParams.assay];
    if (!$scope.assay) {
        $location.path('lines/'+$scope.ipscName);
    }

    $scope.files = apiClient.search({
        type: 'file',
        body: {
          size: 50,
          query: {
              filtered: {
                  filter: {
                      and: [
                          {term: {'samples.name': $scope.ipscName}},
                          {term: {'assay.type': $scope.assay}}
                      ]
                  }
              }
          }
        }
    }).then(function(resp) {
        $scope.apiSuccess = true;
        $scope.files = resp.data['hits']['hits'];
        for (var i=0; i<$scope.files.length; i++) {
            for (var j=0; j<$scope.files[i]._source.samples.length; j++) {
                if ($scope.files[i]._source.samples[j].name == $scope.ipscName) {
                    $scope.files[i].growingConditions = $scope.files[i]._source.samples[j]['growingConditions'];
                    $scope.files[i].passageNumber = $scope.files[i]._source.samples[j]['passageNumber'];
                    break;
                }
            }
        }
    }, function(resp) {
        $scope.apiError = true;
        $scope.apiStatus = resp.status;
        $scope.apiStatusText = resp.statusText;
    });

    $scope.lineData = apiClient.getSource({
        type: 'cellLine',
        id: $routeParams.ipscName
    }).then(function(resp) {
        $scope.apiSuccess = true;
        $scope.lineData = resp.data['_source'];
        $scope.lineData.bankingStatus = $scope.lineData.bankingStatus ? jQuery.grep($scope.lineData.bankingStatus, function(str) {return ! /shipped/i.test(str)}) : undefined;
        if ($scope.assay !== 'Proteomics') {
          return;
        }
        var proteomics = jQuery.grep($scope.lineData.assays, function(obj) {return obj.name === 'Proteomics' ? 1 : 0});
        if (proteomics.length > 0) {
          $scope.peptrackerUrl = proteomics[0].peptrackerURL;
        };
    }, function(resp) {
        $scope.apiError = true;
        $scope.apiStatus = resp.status;
        $scope.apiStatusText = resp.statusText;
    });

    $scope.showEGAModal = function(archive) {
      if (archive && archive.name === 'EGA' && archive.accessionType === 'DATASET_ID') {
        $scope.egaModal = {
            datasetId: archive.accession,
            archiveUrl: archive.url
        };
        var modalInstance = $modal.open({
          templateUrl: 'partials/ega_modal.html?ver=20160506',
          scope: $scope
        });
        c.unbindEgaModal = $scope.$on('$routeChangeStart', function(event, object) {
            modalInstance.close();
            c.unbindEgaModal();
        });
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
    this.exportFilename = 'hipsci_donors';

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
                field.esName == 'bioSamplesAccession' ? '<th class="matrix-dot"><div><span>'+field.label+'</span></div></th>'
              : field.esName == 'cellLines.name' ? '<th class="matrix-dot"><div><span>'+field.label+'</span></div></th>'
              : field.esName == 'diseaseStatus.value' ? '<th>'+field.label+'</th>'
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

controllers.controller('LineListCtrl', ['routeCache', 'lineTableVars', function(routeCache, lineTableVars) {
    var controller = this;
    this.documentType = 'cellLine';
    this.exportFilename = 'hipsci_lines';

    this.assays = lineTableVars.assays;
    this.fields = lineTableVars.fields;
    this.processHitFields = lineTableVars.processHitFields;
    this.bankingSortFn = lineTableVars.bankingSortFn;

    this.tickedPublishFilter = true;

    this.panelLines = {
      fd: [
        {name: "HPSI0613i-zisa_3", ecaccId: "77650017"},
        {name: "HPSI0813i-voas_2", ecaccId: "77650254"},
        {name: "HPSI0513i-cuau_2", ecaccId: "77650222"},
        {name: "HPSI0713i-kaks_3", ecaccId: "77650234"},
      ],
      ff: [
        {name: "HPSI0214i-wibj_2", ecaccId: "77650057"},
        {name: "HPSI0214i-kucg_2", ecaccId: "77650065"},
        {name: "HPSI0314i-hoik_1", ecaccId: "77650129"},
        {name: "HPSI0314i-sojd_3", ecaccId: "77650126"},
      ]
    };

    this.cache = routeCache.get('lineList', 'lineList');

}]);

controllers.controller('FileListCtrl', function() {
    var controller=this;
    this.documentType = 'file';
    this.exportFilename = 'hipsci_files';

    this.htmlFields = [
      {visible: true,  selectable: false, sortable: true,  esName: 'samples.name',     label: 'Cell line'},
      {visible: true,  selectable: false, sortable: true,  esName: 'assay.type',       label: 'Assay'},
      {visible: true,  selectable: false, sortable: true,  esName: 'description',      label: 'Description'},
      {visible: false, selectable: true,  sortable: true,  esName: 'assay.instrument', label: 'Instrument'},
      {visible: true,  selectable: true,  sortable: false, esName: 'archive.ftpUrl',   label: 'File download'},
      {visible: true,  selectable: true,  sortable: true,  esName: 'archive.name',     label: 'Archive'},
      {visible: false, selectable: true,  sortable: true,  esName: 'archive.accession',label: 'Accession'},
      {visible: false, selectable: true,  sortable: true,  esName: 'samples.sex',      label: 'Sex'},
      {visible: false, selectable: true,  sortable: true,  esName: 'samples.growingConditions', label: 'Culture'},
      {visible: false, selectable: true,  sortable: true,  esName: 'samples.passageNumber', label: 'Passage'},
      {visible: false, selectable: true,  sortable: false,  esName: 'files.name', label: 'File name'},
      {visible: false, selectable: true,  sortable: false,  esName: 'files.md5', label: 'File md5'},

      {visible: false, selectable: false, esName: 'archive.url'},
      {visible: false, selectable: false, esName: 'archive.openAccess'},
      {visible: false, selectable: false, esName: 'samples.cellType'},
    ];

    this.exportFields = [
      {esName: 'files.name',       label: 'File name'},
      {esName: 'files.md5',        label: 'md5'},
      {esName: 'archive.ftpUrl',   label: 'FTP url'},
      {esName: 'assay.type',       label: 'Assay'},
      {esName: 'description',      label: 'Description'},
      {esName: 'assay.instrument', label: 'Instrument'},
      {esName: 'samples.name',     label: 'Cell line'},
      {esName: 'samples.cellType', label: 'Cell type'},
      {esName: 'samples.bioSamplesAccession', label: 'Biosample'},
      {esName: 'archive.name',     label: 'Archive'},
      {esName: 'archive.accessionType', label: 'Accession type'},
      {esName: 'archive.accession',label: 'Accession'},
      {esName: 'archive.url',      label: 'Archive url'},
      {esName: 'samples.growingConditions', label: 'Cell line growing conditions for this assay'},
      {esName: 'samples.passageNumber', label: 'Cell line passage number for this assay'},
      {esName: 'samples.diseaseStatus', label: 'Disease status'},
      {esName: 'samples.sex',      label: 'Sex'},
      {esName: 'assay.description',label: 'Assay description'},
    ];

    for (var i=0; i<this.htmlFields.length; i++) {
        var field = this.htmlFields[i];
        if (field.visible || field.selectable) {
            field.th = field.esName == 'assay.type' ? '<th>'+field.label+'<md-modal modal-md="assays" title="Assays"></md-modal></th>'
                : field.esName == 'archive.ftpUrl' ? '<th>'+field.label+'<md-modal modal-md="files-access" title="Data access"></md-modal></th>'
                : '<th>'+field.label+'</th>';
            var hitStr = 'hit['+i+']';
            field.td = 
                  field.esName == 'samples.name' ? '<td class="name valign"><div class="chevron" ng-if="'+[hitStr]+'.length>5"><span class="glyphicon glyphicon-chevron-up" aria-hidden="true"></span></div><div ng-class="{\'tall-td\': '+[hitStr]+'.length>5}"><div ng-repeat="name in '+hitStr+'"><a ng-href="#/lines/{{name}}" ng-bind="name"></a><br ng-if="!$last"></div></div><div class="chevron bottom-chevron" ng-if="'+[hitStr]+'.length>5"><span class="glyphicon glyphicon-chevron-down" aria-hidden="true"></span></div></td>'
                  : field.esName == 'archive.ftpUrl' ? '<td class="valign"><a ng-if="'+hitStr+'" ng-href="{{'+hitStr+'}}" target="_blank"><span class="glyphicon glyphicon-download-alt" aria-hidden="true" ></span></a></td>'
                  : field.esName == 'archive.name' ? '<td class="valign"><a ng-href="{{'+hitStr+'.url}}" target="_blank" ng-bind="'+hitStr+'.name"></a></td>'
                  : field.esName == 'files.name' || field.esName == 'files.md5' ? '<td class="name valign"><div class="wide-td"><div ng-repeat="file in '+hitStr+'"><span ng-bind="file"></span><br ng-if="!$last"></div></div></td>'
                  : '<td class="valign" ng-bind="'+hitStr+'"></td>'
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
            else if (fields[i].esName == 'archive.ftpUrl') {
                processedFields[i] = hitFields.hasOwnProperty(fields[i].esName) && hitFields.hasOwnProperty('archive.openAccess') && hitFields['archive.openAccess'][0] ? hitFields[fields[i].esName][0] : undefined;
            }
            else if (fields[i].esName == 'files.name' || fields[i].esName == 'files.md5' || fields[i].esName == 'samples.name') {
                processedFields[i] = hitFields.hasOwnProperty(fields[i].esName) ? hitFields[fields[i].esName] : [];
            }
            else {
                processedFields[i] = hitFields.hasOwnProperty(fields[i].esName) && hitFields[fields[i].esName].length == 1 ? hitFields[fields[i].esName][0] : undefined;
            }
        }
        return processedFields;
    };


});

controllers.controller('DatasetTableCtrl', ['$scope', 'apiClient', '$modal',
  function($scope, apiClient, $modal) {
    var c = this;
    c.apiError = false;
    c.apiSuccess = false;
    c.cohorts = [];
    $scope.cohortDatasets = {};

    c.assays = [
                'Genotyping array',
                'Expression array',
                'Exome-seq',
                'RNA-seq',
                'Methylation array',
    ];

    c.showModal = function(cohort, assay) {
      $scope.selectedAssay = assay;
      $scope.selectedCohort = cohort['_source'];
      var modalInstance = $modal.open({
        templateUrl: 'partials/ega_dataset_modal.html?ver=20161114',
        scope: $scope
      });
      c.unbindModal = $scope.$on('$routeChangeStart', function(event, object) {
          modalInstance.close();
          c.unbindModal();
      });
    }

    apiClient.search({
        type: 'cohort',
        body: {
          size: -1,
          sort: {"donors.count": "desc"}
        }
    }).then(function(resp) {
        c.apiSuccess = true;
        c.cohorts = resp.data['hits']['hits'];
        for (var i=0; i< c.cohorts.length; i++) {
          var hit = c.cohorts[i]['_source'];
          if (hit.name === 'Normal') {
            hit.name = 'Normal, managed access';
          }
          var datasets = {}
          for (var j=0; j< hit.datasets.length; j++) {
            var dataset = hit.datasets[j];
            if (dataset.hasOwnProperty('assay')) {
              datasets[dataset.assay] = dataset;
            }
          }
          $scope.cohortDatasets[hit.name] = datasets;
        }
    }, function(resp) {
        c.apiError = true;
        c.apiStatus = resp.status;
        c.apiStatusText = resp.statusText;
    });
  }
]);

controllers.controller('CohortDetailCtrl', ['$routeParams', 'apiClient', '$http', 'lineTableVars',
  function($routeParams, apiClient, $http, lineTableVars) {
    var c = this;
    c.apiError = false;
    c.apiSuccess = false;
    c.documentType = 'cellLine';
    c.exportFilename = 'hipsci-'+$routeParams.cohortId;
    c.tickedPublishFilter = true;

    c.assays = lineTableVars.assays;
    c.fields = lineTableVars.fields;
    c.processHitFields = lineTableVars.processHitFields;
    c.bankingSortFn = lineTableVars.bankingSortFn;

    apiClient.getSource({
        index: 'hipsci',
        type: 'cohort',
        id: $routeParams.cohortId,
    }).then(function(resp) {
        c.apiSuccess = true;
        if (resp.data.hasOwnProperty('_source') && resp.data._source.hasOwnProperty('disease') && resp.data._source.disease.hasOwnProperty('value')) {
          c.disease = resp.data._source.disease.value;
          console.log(c.disease);
        }
    }, function(resp) {
        c.apiError = true;
        c.apiStatus = resp.status;
        c.apiStatusText = resp.statusText;
    });

    $http.get('md/cohorts/'+$routeParams.cohortId+'.md?ver=20170321', {responseType: 'text', cache: true
      }).success(function(data) {
          c.mdContent = data;
      });
  }
]);

controllers.controller('AssayDetailCtrl', ['$routeParams', '$http', 'lineTableVars',
  function($routeParams, $http, lineTableVars) {
    var c = this;
    c.documentType = 'cellLine';
    c.exportFilename = 'hipsci-'+$routeParams.assayName;
    c.tickedPublishFilter = true;

    c.assays = lineTableVars.assays;
    c.fields = lineTableVars.fields;
    c.processHitFields = lineTableVars.processHitFields;
    c.bankingSortFn = lineTableVars.bankingSortFn;

    for (var i=0; i<c.assays.length; i++) {
      if (c.assays[i].short === $routeParams.assayName) {
        c.assayName = c.assays[i].long;
        c.assayShortName = c.assays[i].short;
      }
    }
    if (!c.assayName) {
      c.routeError = '404 Not Found';
    }

    $http.get('md/assays/'+$routeParams.assayName+'.md?ver=20160908b', {responseType: 'text', cache: true
      }).success(function(data) {
          c.mdContent = data;
      });
  }
]);
