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

    $scope.adjustDateToToday = function (datetimeValue) {
      var
        today = new Date(),
        dt = new Date(datetimeValue),
        hrs = dt.getHours(),
        mins = dt.getMinutes();

      today.setHours(hrs);
      today.setMinutes(mins);
      return today;
    }

    $scope.showToast = function (text) {
      setTimeout(function () {
        //if ($ionicPlatform) {
        window.plugins.toast.showLongBottom(text);
        //} else {
        //  showDialog(text);
        //}
      }, 100);
    };

    $scope.saveReminderValues = function () {
      localStorage.time = $scope.adjustDateToToday($scope.reminder.time);
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

        $cordovaLocalNotification.cancel(999).then(function (result) {
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
        var isToday = true;
        if (alarmTime < currentTime) {
          alarmTime.setDate(alarmTime.getDate() + 1);
          isToday = false;
        }

        var
          timeDiff = alarmTime - currentTime,
          timeFromNow = new Date(currentTime.getTime() + timeDiff),
          hrsFromNow = Math.round(((timeDiff / (3600 * 1000)) + 0.00001) * 100) / 100, // 2dp
          msg;

        if (hrsFromNow === 1.0) {
          msg = " (in 1 hour)";
        } else if (hrsFromNow >= 1.01) {
          msg = " (in approx " + hrsFromNow + " hrs)";
        } else {
          var mins = Math.round(60 * hrsFromNow);
          msg = ' (in ' + mins + ' minute';
          msg = mins > 1 ? msg + 's)' : msg + ')';
        }

        var extractTime = function (datetimeValue) {
          var
            hrs = datetimeValue.getHours(),
            mins = datetimeValue.getMinutes(),
            amPM;

          amPM = hrs < 12 ? 'am' : 'pm';
          hrs %= 12;
          hrs = hrs < 10 ? '0' + hrs : hrs;
          mins = mins < 10 ? '0' + mins : mins;

          return hrs + ':' + mins + ' ' + amPM;
        }

        if (isToday) {
          msg = "Next alarm: Today at " + extractTime(timeFromNow) + msg;
        }
        else {
          msg = "Next alarm: Tomorrow at " + extractTime(timeFromNow) + msg;
        }
        console.log(msg);
        $scope.showToast(msg);

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
