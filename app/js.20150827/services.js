'use strict';

/* Services */

var services = angular.module('hipsciBrowser.services', []);

services.service('apiClient', ['$http', function($http) {
    return {
        getSource: function (searchObj) {
            var type = searchObj.hasOwnProperty('type') ? searchObj.type : '';
            var id = searchObj.id;
            var url = 'http://www.hipsci.org/lines/api/';
            url = url.concat(type, '/', id);
            return $http.get(url, {cache: true});
        },
        search: function (searchObj) {
            var type = searchObj.hasOwnProperty('type') ? searchObj.type : '';
            var body = searchObj.hasOwnProperty('body') ? searchObj.body : {};
            var url = 'http://www.hipsci.org/lines/api/';
            url = url.concat(type, '/', '_search');
            return $http.post(url, body);
        },
        exportData: function(searchObj) {
            var form = document.createElement('form');
            var type = searchObj.hasOwnProperty('type') ? searchObj.type : '';
            var body = searchObj.hasOwnProperty('body') ? searchObj.body : {};
            var format = searchObj.hasOwnProperty('format') ? searchObj.format : 'tsv';
            var url = 'http://www.hipsci.org/lines/api/';
            url = url.concat(type, '/', '_search' , '.', format);
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
