angular.module('starter.controllers', [])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
      console.log("ionic keyboard or statusBar done");
    });
  })


  .controller('DashCtrl', function ($scope) {
  })

  .controller('ChatsCtrl', function ($scope, DataServiceHTTP, $cordovaLocalNotification, $ionicPlatform, Chats) {
    $scope.items = [];
    $scope.reminder = {
      time: new Date(localStorage.time),
      mode: localStorage.mode,
      deactivate: false,
      saveDisabled: true
    };

    $scope.enableSaveButton = function () {
      $scope.reminder.saveDisabled = false;
    };

    var adjustDateToToday = function (datetimeValue) {
      var
        today = new Date(),
        dt = new Date(datetimeValue),
        hrs = dt.getHours(),
        mins = dt.getMinutes();

      today.setHours(hrs);
      today.setMinutes(mins);
      return today;
    }

    $scope.saveReminderValues = function () {
      localStorage.time = adjustDateToToday($scope.reminder.time) ;
      console.log("reminder.time:", localStorage.time);
      $scope.reminder.saveDisabled = true;

      if (!$scope.reminder.deactivate) {
        $scope.activateGMATReminder();
      }
    };

    $scope.testNutrition = function () {
      console.log("testing nutrition.");

      // use the $http based service
      var promise = DataServiceHTTP.getAll($scope.searchTerm);
      promise.then(function (_response) {
        //console.debug(" The data " + JSON.stringify(_response.data));
        console.log("API response:", _response);
        $scope.items = _response.data.hits;
      }).catch(
        function (reason) {
          console.log('Rejection error: (' + reason + ').');
        });

    };

    $scope.chats = Chats.all();
    $scope.remove = function (chat) {
      Chats.remove(chat);
    };

    $scope.toggleSwitched = function () {
      $scope.reminder.deactivate ? $scope.deactivateGMATReminder() : $scope.activateGMATReminder();
    };

    $ionicPlatform.ready(function () {

      $scope.deactivateGMATReminder = function () {
        console.log("GMAT reminder deactivated.")

        $cordovaLocalNotification.cancel(999).then(function(result) {
          console.log('Notification 999 Canceled');
        });
      };

      $scope.activateGMATReminder = function () {
        console.log("GMAT reminder activated.");

        if (!localStorage.time) {
          console.log("oops, time not set yet. Updated time to now.");
          localStorage.time = new Date();
        }

        var currentTime = new Date();
        var alarmTime = new Date(localStorage.time);
        if (alarmTime < currentTime) {
          alarmTime.setDate(alarmTime.getDate() + 1);
        }
        var timeDiff = alarmTime - currentTime;
        var timeFromNow = new Date(currentTime.getTime() + timeDiff);
        console.log("timeFromNow", timeFromNow);
        console.log("hrs before alarm:", timeDiff/(3600*1000));

        $cordovaLocalNotification.schedule({
          id: 999,
          title: 'GMAT Gentle Reminder',
          text: 'Time to practice (start within next 10 minutes)',
          every: 'day',
          at: timeFromNow
        }).then(function (result) {
          console.log('Notification gmat triggered:', result);
        });
      };

    });

  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    $scope.item = Chats.get($stateParams.item)
    //$scope.chat = Chats.get($stateParams.chatId);
  })

  .controller('AccountCtrl', function ($scope) {
    $scope.settings = {
      enableFriends: true
    };
  });
