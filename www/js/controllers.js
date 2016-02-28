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
      mode: localStorage.mode
    };
    $scope.reminder.saveDisabled = true;

    $scope.enableSaveButton = function () {
      console.log("value changed now");
      $scope.reminder.saveDisabled = false;
    };

    var getFormattedTime = function (datetimeValue) {
      var
        dt = new Date(datetimeValue),
        hrs = dt.getHours(),
        mins = dt.getMinutes();

      hrs = hrs < 10 ? '0' + hrs : hrs;
      mins = mins < 10 ? '0' + mins : mins;
      return hrs + ':' + mins;
    }

    $scope.saveReminderValues = function () {
      localStorage.time = $scope.reminder.time;
      localStorage.mode = $scope.reminder.mode;

      console.log("reminder.time:", $scope.reminder.time);
      console.log("reminder.time formatted:", getFormattedTime($scope.reminder.time));
      console.log("reminder.mode:", $scope.reminder.mode);
      $scope.reminder.saveDisabled = true;
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

    $ionicPlatform.ready(function () {

      $scope.scheduleSingleNotification = function () {
        $cordovaLocalNotification.schedule({
          id: 1,
          title: 'GMAT Practice Reminder',
          text: 'Start practicing within next 10 mins to receive your reward.',
          //data: {
          //  customProperty: 'custom value'
          //}
        }).then(function (result) {
          console.log('Notification 1 triggered');
        }).catch(
          function (reason) {
            console.log('Rejection error: (' + reason + ').');
          });
      };

      $scope.scheduleDelayedNotification = function () {
        var now = new Date().getTime();
        var _10SecondsFromNow = new Date(now + 10 * 1000);

        $cordovaLocalNotification.schedule({
          id: 2,
          title: 'Warning',
          text: 'Im so late',
          at: _10SecondsFromNow
        }).then(function (result) {
          console.log('Notification 2 triggered');
        });
      };

      $scope.scheduleEveryMinuteNotification = function () {
        $cordovaLocalNotification.schedule({
          id: 3,
          title: 'Warning',
          text: 'Dont fall asleep',
          every: 'minute'
        }).then(function (result) {
          console.log('Notification 3 triggered');
        });
      };

      $scope.scheduleGMATNotification = function () {
        var one_hour = 3600 * 1000;
        var one_minute = 60 * 1000;
        var now = new Date().getTime(),
          _hrs_from_now = new Date(now + 6 * one_hour),
          _mins_from_now = new Date(now + 3 * one_minute);
        $cordovaLocalNotification.schedule({
          id: 10,
          title: 'GMAT Gentle Reminder',
          text: 'Time to practice (start within next 10 minutes)',
          every: 'day',
          firstAt: _hrs_from_now
        }).then(function (result) {
          console.log('Notification 3 triggered');
        });
      };

      $scope.cancelGMATNotification = function () {
        $cordovaLocalNotification.cancel(10).then(function (result) {
          console.log('Notification 10 Canceled');
        });
      };

      $scope.updateSingleNotification = function () {
        $cordovaLocalNotification.update({
          id: 2,
          title: 'Warning Update',
          text: 'This is updated text!'
        }).then(function (result) {
          console.log('Notification 1 Updated');
        });
      };

      $scope.cancelSingleNotification = function () {
        $cordovaLocalNotification.cancel(3).then(function (result) {
          console.log('Notification 3 Canceled');
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
