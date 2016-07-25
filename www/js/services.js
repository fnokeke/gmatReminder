angular.module('starter.services', ['ngResource'])

  .factory('Helper', function($timeout, $ionicLoading) {

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


      show_spinner: function() {
        $ionicLoading.show({
          template: '<p>One moment...</p><ion-spinner icon="lines"></ion-spinner>'
        });
      },


      hide_spinner: function() {
        $ionicLoading.hide();
      },


      show_and_hide_spinner: function() {
        this.show_spinner();

        var _this = this;
        $timeout(function () {
          _this.hide_spinner();
        }, 500);
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


  .factory('VeritasHTTP', function ($resource, Helper) {

    return {

      'query': function () {

        var TIMEOUT = 1000; //no of milliseconds
        var resource_error_handler = function(error) {
          Helper.hide_spinner(); // hide spinner in case of any active ones
          console.log('response error log:', error);
        };

        return $resource('', {}, {

          'get_account': {
                method: 'GET',
                url: 'http://slm.smalldata.io/gmat/api/student/:code',
                timeout: TIMEOUT,
                interceptor: {
                  responseError: resource_error_handler
                }
          },

          'scrape_account': {
                method: 'GET',
                url: 'http://slm.smalldata.io/gmat/scrape/:code',
                timeout: TIMEOUT * 60, // needs more time bcos of server ops
                interceptor: {
                  responseError: resource_error_handler
                }
          },

          'save_reminder': {
                method: 'POST',
                url: 'http://slm.smalldata.io/gmat/api/reminder',
                timeout: TIMEOUT,
                interceptor: {
                  responseError: resource_error_handler
                }
          }

        });
      }

    };
  })


  .factory('SavedAccount', function () {

    return {

      'ACCOUNT': 'account',
      'ADMIN_MODE': 'admin_mode',
      'PRACTICES': 'practices',
      'REMIND_TIME': 'remind_time',
      'REMINDER_LIMIT': 15,  // number of mins allwed after reminder shoots
      'WHEN_LAST_CHANGED': 'when_last_changed',

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
