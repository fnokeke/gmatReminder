angular.module('starter.services', ['ngResource'])
    
  .factory('VeritasServiceHTTP', function ($resource, $http) {

    return {
      practice: function () {
        return $resource('http://slm.smalldata.io/gmat/api/student/:code')
      },

      reminder: function() {
        return $resource('http://slm.smalldata.io/gmat/api/reminder');
      },

      scrape: function () {
        return $resource('http://slm.smalldata.io/gmat/scrape/:code')
      }
    };
  });

