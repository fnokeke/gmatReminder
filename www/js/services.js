angular.module('starter.services', ['ngResource'])

  .factory('Helper', function($timeout) {

    return {
      IOS_APP_LINK: 'https://itunes.apple.com/us/app/gmat-question-bank/id943136266?mt=8',
      ANDROID_APP_LINK: 'https://play.google.com/store/apps/details?id=com.veritas.mobile',
      IOS_SCHEME: 'https://itunes.apple.com/us/app/gmat-question-bank/id943136266?mt=8',
      ANDROID_SCHEME: 'com.veritas.mobile',

      show_toast: function(text) {
        if (this.is_mobile()) {
          $timeout(function() {
            window.plugins.toast.showLongBottom(text);
          }, 100);
        } else {
          console.log(text);
        }
      },

      is_mobile: function() {
        return this.is_android() || this.is_ios();
      },

      is_android: function() {
        return ionic.Platform.isAndroid();
      },

      is_ios: function() {
        return ionic.Platform.isIOS();
      },

      open_url: function(url) {
        window.open(url, '_system', 'location=no');
      },

    };
  })

  .factory('ConnectivityMonitor', function($rootScope, $cordovaNetwork) {

    return {
      is_online: function(){
        if(ionic.Platform.isWebView()){
          return $cordovaNetwork.isOnline();
        } else {
          return navigator.onLine;
        }
      },

      start_watching: function(){
          if (ionic.Platform.isWebView()){

            $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
              console.log("went online");
            });

            $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
              console.log("went offline");
            });

          } else {

            window.addEventListener("online", function(e) {
              console.log("went online");
            }, false);

            window.addEventListener("offline", function(e) {
              console.log("went offline");
            }, false);
          }
      }
    }
  })

  .factory('VeritasServiceHTTP', function ($resource) {
    // var timeout = 5000; //no of milliseconds

    return {
      practice: function () {
        return $resource('http://slm.smalldata.io/gmat/api/student/:code');
                          // {'timeout': timeout});
      },

      reminder: function() {
        return $resource('http://slm.smalldata.io/gmat/api/reminder');
      },

      scrape: function () {
        return $resource('http://slm.smalldata.io/gmat/scrape/:code');
      }

    };
  })


  .factory('SavedAccount', function () {

    return {

      'ACCOUNT': 'account',
      'ADMIN_MODE': 'admin_mode',
      'PRACTICES': 'practices',
      'WHEN_LAST_CHANGED': 'when_last_changed',
      'CHANGE_LIST': 'change_list',
      'TIME_DICT': 'time_dict',
      'REMINDER_LIMIT': 15,  // number of mins allwed after reminder shoots

      is_admin_mode: function() {
        console.log('admin_mode called.');
        console.log('current admin mode: ', this.get('admin_mode'));
        return this.get(this.ADMIN_MODE);
      },

      is_valid_participant: function () {
        return localStorage.getItem('account');
      },

      has_deadline: function() {
        if (this.get(this.ACCOUNT)) {
          return this.get(this.ACCOUNT).has_deadline;
        }
      },

      has_contingency: function() {
        if (this.get(this.ACCOUNT)) {
          return this.get(this.ACCOUNT).has_contingency;
        }
      },

      set: function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
      },


      get: function(key) {
        if (key=='remind_time') {
          var value = JSON.parse(localStorage.getItem(key));
          return this.adjust_date_to_today(value);
        }

        return JSON.parse(localStorage.getItem(key));
      },


      adjust_date_to_today: function(dt) {
        if (typeof(dt) === 'string' && dt.length <= 5 && dt.length > 0) { // 'hh:mm'
          var dt_arr = dt.split(':');
          dt = new Date();
          dt.setHours(parseInt(dt_arr[0]));
          dt.setMinutes(parseInt(dt_arr[1]));
        }

        if (dt) {
          var
            today = new Date();
            dt = new Date(dt);

          today.setHours(dt.getHours());
          today.setMinutes(dt.getMinutes());
          today.setMilliseconds(0);
          today.setSeconds(0);

          return today;
        }
      },


      clear_all: function() {
        console.log("**********************");
        localStorage.clear();
        console.log("Saved account wiped clean");;
        console.log("**********************");
      },

      append_practice: function(item) {

      }




    };

  });
