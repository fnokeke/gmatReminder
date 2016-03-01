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

  .controller('ChatsCtrl', function ($scope, DataServiceHTTP, $cordovaLocalNotification, $ionicPlatform,
                                     Chats, $cordovaInAppBrowser) {
    localStorage.studentId = 2;
    localStorage.whenLastUsed = '';
    localStorage.clickcount = 0;
    $scope.items = [];
    $scope.reminder = {
      time: new Date(localStorage.time),
      mode: localStorage.mode,
      deactivate: false,
      saveDisabled: true,
    };

    $scope.saveButtonUsed = function() {
      var currentDate = new Date();
      currentDate = currentDate.getMonth() + '-' + currentDate.getDate();

      return localStorage.whenLastUsed === currentDate;
    }

    $scope.enableSaveButton = function () {
      var msg;
      if (!$scope.saveButtonUsed()) {
        $scope.reminder.saveDisabled = false;
      } else if (localStorage.clickcount >= 3) {
        msg = ("Whoa! What'd I say? Only one change per day :)");
      } else {
        msg = ("Only one change allowed per day :)");
        localStorage.clickcount++;
      }
      console.log(msg);
      $scope.showToast(msg);
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
      var response = confirm("Are you sure? (only one change per day allowed)");
      if (!response) return;

      localStorage.time = $scope.adjustDateToToday($scope.reminder.time);
      var currentDate = new Date();
      localStorage.whenLastUsed = currentDate.getMonth() + '-' + currentDate.getDate();

      $scope.reminder.saveDisabled = true;
      if (!$scope.reminder.deactivate) {
        $scope.activateGMATReminder();
      }
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
        $scope.showToast("Reminder deactivated.");

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

  .controller('AccountCtrl', function ($scope, VeritasServiceHTTP) {
    $scope.settings = {
      enableFriends: true
    };

    $scope.changeDateFormat = function (dateStr) {
      var onlyDate = dateStr.split("T")[0];
      onlyDate = onlyDate.split("-"); //yyyy-mm-dd

      var
        monthIndex = parseInt(onlyDate[1]),
        day = parseInt(onlyDate[2]),
        months = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

      return months[monthIndex - 1] + ' ' + day;
    }

    $scope.getVeritasData = function () {
      VeritasServiceHTTP.get({studentId: localStorage.studentId}, function (response) {

        response.practices.forEach(function (practice) {
          practice.taken_on = $scope.changeDateFormat(practice.taken_on);
        });

        $scope.practices = response.practices;

        var practiceName;
        response.practices.forEach(function (practice) {
          practiceName = 'practice' + practice.id;
          localStorage[practiceName] =
            practice.id + ';' +
            practice.question_count + ';' +
            practice.taken_on + ';' +
            practice.duration + ';' +
            practice.percent_correct + ';' +
            '5.00';
        });

        console.log("$scope.practices:", $scope.practices);
      });

    };
  });
