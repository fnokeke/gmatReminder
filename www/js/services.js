angular.module('starter.services', ['ngResource'])
  .value('nutritionConst', {
    'appId': '8abbcd8e',
    'appKey': '36e8d264537037ee7e832a41902ffe57'
  })

  .factory('DataServiceHTTP', function ($http, nutritionConst) {
    return {
      getByHTTP: function (_key) {

        return $http.get('https://api.nutritionix.com/v1_1/search/' + _key, {
          'params': {
            results: '0:50',
            appId: nutritionConst.appId,
            appKey: nutritionConst.appKey,
            // brand_id:'513fbc1283aa2dc80c00001f',
            fields: 'brand_id,item_name,item_id,brand_name,nf_calories,nf_total_fat'
          }
        });
      }
    }
  })

  .factory('VeritasServiceHTTP', function ($resource, $http) {

    return {
      practice: function () {
        return $resource('http://slm.smalldata.io/gmat/api/student/:code')
      },

      reminder: function() {
        return $resource('http://slm.smalldata.io/gmat/api/reminder');
      },

      scrape: function () {
        return $resource('http://slm.smalldata.io/gmat/api/student/scrape/:code')
      }
    };

//return {
//  getByHTTP: function (studentId) {
//    return $http.get(url + studentId);
//  }
//}
  })

  .factory('Chats', function () {

    // Might use a resource here that returns a JSON array

    // Some fake testing data
    var chats = [{
      id: 0,
      name: 'Ben Sparrow',
      lastText: 'You on your way?',
      face: 'img/ben.png'
    }, {
      id: 1,
      name: 'Max Lynx',
      lastText: 'Hey, it\'s me',
      face: 'img/max.png'
    }, {
      id: 2,
      name: 'Adam Bradleyson',
      lastText: 'I should buy a boat',
      face: 'img/adam.jpg'
    }, {
      id: 3,
      name: 'Perry Governor',
      lastText: 'Look at my mukluks!',
      face: 'img/perry.png'
    }, {
      id: 4,
      name: 'Mike Harrington',
      lastText: 'This is wicked good ice cream.',
      face: 'img/mike.png'
    }];

    return {
      all: function () {
        return chats;
      },
      remove: function (chat) {
        chats.splice(chats.indexOf(chat), 1);
      },
      get: function (chatId) {
        for (var i = 0; i < chats.length; i++) {
          if (chats[i].id === parseInt(chatId)) {
            return chats[i];
          }
        }
        return null;
      }
    };
  });