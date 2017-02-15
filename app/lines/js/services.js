'use strict';

/* Services */

var services = angular.module('hipsciBrowser.services', []);

services.service('apiClient', ['$http', function($http) {
    return {
        getSource: function (searchObj) {
            var type = searchObj.hasOwnProperty('type') ? searchObj.type : '';
            var id = searchObj.id;
            var url = 'api/';
            url = url.concat(type, '/', id);
            return $http.get(url, {cache: true});
        },
        search: function (searchObj) {
            var type = searchObj.hasOwnProperty('type') ? searchObj.type : '';
            var body = searchObj.hasOwnProperty('body') ? searchObj.body : {};
            var url = 'api/';
            url = url.concat(type, '/_search');
            return $http.post(url, body);
        },
        exportData: function(searchObj) {
            var form = document.createElement('form');
            var type = searchObj.hasOwnProperty('type') ? searchObj.type : '';
            var body = searchObj.hasOwnProperty('body') ? searchObj.body : {};
            var format = searchObj.hasOwnProperty('format') ? searchObj.format : 'tsv';
            var filename = searchObj.hasOwnProperty('filename') ? searchObj.filename : type;
            var url = 'api/';
            url = url.concat(type, '/_search/', filename, '.', format);
            form.action= url;
            form.method='POST';
            form.target="_self";
      
            var input = document.createElement("textarea");
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', 'json');
            input.value = JSON.stringify(body);
            form.appendChild(input);
            form.style.display = 'none';
            document.body.appendChild(form);
            form.submit();
        }
    };
  }
]);

services.service('routeCache', ['$location', function($location) {
    var cache = {};
    this.get = function(ctrlName, id) {
        var path = $location.path();
        if (!cache.hasOwnProperty(path)) {
            cache[path] = {};
        }
        if (!cache[path].hasOwnProperty(ctrlName)) {
            cache[path][ctrlName] = {};
        }
        if (!cache[path][ctrlName].hasOwnProperty(id)) {
            cache[path][ctrlName][id] = {};
        }
        return cache[path][ctrlName][id];
    };
}]);

services.directive('mdModal', ['$modal', '$http', function($modal, $http) {
  return {
    restrict: 'E',
    scope: {
        modalMd: '@',
        title: '@',
    },
    template: '<a class="modal-link" href="" ng-click="showModal()"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></a>',
    link: function(scope, iElement, iAttrs, ctrls) {
        scope.showModal = function() {
            if (!scope.modalContent) {
                $http.get('md/'+scope.modalMd+'.md?ver=20160908b', {responseType: 'text', cache: true
                }).success(function(data) {
                    scope.modalContent = data;
                });
            }
            scope.modalInstance = $modal.open({
                templateUrl: 'partials/modal.html?ver=20160204',
                scope: scope,
            });
            scope.unbindRouteUpdate = scope.$on('$routeChangeStart', function(event, object) {
                scope.modalInstance.close();
                scope.unbindRouteUpdate();
            });
        };
    }
}}]);


services.factory('lineTableVars', function lineTableVarsFactory() {
  var f = {};
  f.assays = [
              {short: 'gtarray', long: 'Genotyping array'},
              {short: 'gexarray', long: 'Expression array'},
              {short: 'exomeseq', long: 'Exome-seq'},
              {short: 'rnaseq', long: 'RNA-seq'},
              {short: 'wgs-seq', long: 'Whole genome sequencing'},
              {short: 'mtarray', long: 'Methylation array'},
              {short: 'proteomics', long: 'Proteomics'},
              {short: 'cellbiol-fn', long: 'Cellular phenotyping'},
        ];

  f.fields = [
        {visible: true,  sortable: true,  selectable: false, esName: 'name', label: 'Name'},
        {visible: false,  sortable: true,  selectable: true,  esName: 'cellType.value', label: 'Cell Type'},
        {visible: true,  sortable: true,  selectable: true,  esName: 'diseaseStatus.value', label: 'Disease Status'},
        {visible: true,  sortable: true,  selectable: true,  esName: 'donor.sex.value', label: 'Sex'},
        {visible: false, sortable: true,  selectable: true,  esName: 'donor.ethnicity', label: 'Ethnicity'},
        {visible: false, sortable: true,  selectable: true,  esName: 'donor.age', label: 'Age'},
        {visible: true,  sortable: true,  selectable: true,  esName: 'sourceMaterial.value', label: 'Source Material'},
        {visible: true,  sortable: true,  selectable: true,  esName: 'tissueProvider', label: 'Tissue Provider'},
        {visible: false, sortable: true,  selectable: true,  esName: 'reprogramming.methodOfDerivation', label: 'Method of derivation'},
        {visible: false, sortable: true,  selectable: true,  esName: 'reprogramming.dateOfDerivation', label: 'Date of derivation'},
        {visible: true,  sortable: false, selectable: false, esName: 'bioSamplesAccession', label: 'Biosample'},
        {visible: true,  sortable: false, selectable: false, esName: 'openAccess', label: 'Open access data'},
        {visible: true,  sortable: false, selectable: false, esName: 'bankingStatus', label: 'Bank status'},

        {visible: true,  sortable: false, selectable: false, esName: 'assays.name', label: 'Assays data available'},
        {visible: true, sortable: false, selectable: false, esName: 'ecaccCatalogNumber', label: 'ECACC catalog number'},
    ];
    for (var i=0; i<f.fields.length; i++) {
        var field = f.fields[i];
        if (field.visible || field.selectable) {
            field.th = 
                field.esName == 'bioSamplesAccession' ? '<th class="matrix-dot"><div><span>'+field.label+'</span></div></th>'
              : field.esName == 'bankingStatus' ? '<th class="matrix-dot"><div><span>'+field.label+'</span><md-modal modal-md="banking_status" title="Banked status"></md-modal></div></th>'
              : field.esName == 'openAccess' ? '<th class="matrix-dot"><div><span>Data access</span><md-modal modal-md="access" title="Data access"></md-modal></div></th>'
              : field.esName == 'assays.name' ? '<th ng-repeat="assay in compileParams.assays" class="matrix-dot assay"><div><span ng-bind="assay.short"></span></div></th>'
              : field.esName == 'diseaseStatus.value' ? '<th>'+field.label+'<md-modal modal-md="disease" title="Disease status"></md-modal></th>'
              : field.esName == 'ecaccCatalogNumber' ? '<th class="purchase-button"></th>'
              : '<th>'+field.label+'</th>'
            var hitStr = 'hit['+i+']';
            field.td = 
                field.esName == 'bioSamplesAccession' ? '<td class="matrix-dot"><a ng-href="http://www.ebi.ac.uk/biosamples/sample/{{'+hitStr+'}}" target="_blank"><div class="matrix-dot-item biosample" popover="Biosample" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
              : field.esName == 'bankingStatus' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.text}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.letter"></span></div></td>'
              : field.esName == 'openAccess' ? '<td class="matrix-dot"><div class="matrix-dot-item" popover="{{'+hitStr+'.text}}" popover-trigger="mouseenter"><span ng-bind="'+hitStr+'.letter"></span></div></td>'
              : field.esName == 'name' ? '<td class="name"><a ng-href="#/lines/{{'+hitStr+'}}" ng-bind="'+hitStr+'"</a></td>'
              : field.esName == 'assays.name' ? '<td ng-repeat="assay in compileParams.assays" class="matrix-dot"><a ng-if="'+hitStr+'[$index]" ng-href="#/lines/{{hit[0]}}/{{assay.short}}"><div class="matrix-dot-item assay" popover="{{assay.long}}" popover-trigger="mouseenter">&#x25cf;</div></a></td>'
              : field.esName == 'ecaccCatalogNumber' ? '<td class="purchase-button"><a ng-if="'+hitStr+'" class="btn btn-sm btn-primary" ng-href="{{'+hitStr+'}}" target="_blank"><span class="glyphicon glyphicon-shopping-cart" aria-hidden="true"></span> Purchase</a></td>'
              : '<td ng-bind="'+hitStr+'"></td>'
        }
    }

    f.processHitFields = function(hitFields, fields) {
        var processedFields = [];

        var purchaseUrl;
        var iPurchaseUrl;

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
                    if (/ecacc/i.test(processedFields[i].text)) {
                      purchaseUrl = 'http://www.phe-culturecollections.org.uk/products/celllines/ipsc/detail.jsp?refId='+hitFields.ecaccCatalogNumber[0]+'&collection=ecacc_ipsc';
                    }
                }
            }
            else if (field.esName == 'ecaccCatalogNumber') {
              iPurchaseUrl = i;
            }
            else if (field.esName == 'openAccess') {
                processedFields[i] = {letter: '', text: ''};
                if (hitFields.hasOwnProperty(field.esName)) {
                    processedFields[i].text = hitFields[field.esName][0] ? 'Open access' : 'Managed access';
                    processedFields[i].letter = hitFields[field.esName][0] ? 'O' : 'M';
                }
            }
            else if (field.esName == 'assays.name') {
                processedFields[i] = [];
                for (var j=0; j<f.assays.length; j++) {
                    processedFields[i].push(jQuery.inArray(f.assays[j].long, hitFields[field.esName]) > -1 ? true: false);
                }
            }
            else {
                processedFields[i] = ! hitFields.hasOwnProperty(field.esName) ? undefined
                        : hitFields[field.esName][0];
            }
        }
        if (iPurchaseUrl) {
          processedFields[iPurchaseUrl] = purchaseUrl;
        }
        return processedFields;
    };

    var bankingSortOrder = {};
    bankingSortOrder['Banked at ECACC'] = 1;
    bankingSortOrder['Banked at EBiSC'] = 2;
    bankingSortOrder['Selected for banking'] = 3;
    bankingSortOrder['Pending selection'] = 4;
    f.bankingSortFn = function(a, b) {
        return (bankingSortOrder[a.term] && bankingSortOrder[b.term]) ? bankingSortOrder[a.term] - bankingSortOrder[b.term] || b.unfilteredCount - a.unfilteredCount
                : bankingSortOrder[a.term] ? -1
                : bankingSortOrder[b.term] ? 1
                : b.unfilteredCount - a.unfilteredCount;
    };

    return f;
});
