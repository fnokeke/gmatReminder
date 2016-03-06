angular.module('starter.controllers', [])

  .run(function ($ionicPlatform, $rootScope) {

    //$ionicPlatform.ready(function () {
    //  // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    //  // for form inputs)
    //  if (window.cordova && window.cordova.plugins.Keyboard) {
    //    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    //  }
    //  if (window.StatusBar) {
    //    StatusBar.styleDefault();
    //  }
    //
    //  if (window.plugin && window.plugin.notification) {
    //    window.plugin.notification.local.setDefaults({
    //      autoCancel: true
    //    });
    //
    //    if (window.device && window.device.platform === 'iOS') {
    //      window.plugin.notification.local.registerPermission();
    //    }
    //
    //    window.plugin.notification.local.on('click', function (notification) {
    //      $timeout(function () {
    //        $rootScope.$broadcast('cordovaLocalNotification:click', notification);
    //      });
    //    });
    //
    //    window.plugin.notification.local.on('trigger', function (notification) {
    //      $timeout(function () {
    //        $rootScope.$broadcast('cordovaLocalNotification:trigger', notification);
    //      });
    //    });
    //  }
    //
    //
    //  console.log("ionic keyboard or statusBar done");
    //});
  })

  .controller('GuideCtrl', function ($scope, $state, $ionicSlideBoxDelegate) {

    // Called to navigate to the main app
    $scope.startApp = function () {
      $state.go('tab.account');
    };

    $scope.next = function () {
      $ionicSlideBoxDelegate.next();
    };

    $scope.previous = function () {
      $ionicSlideBoxDelegate.previous();
    };

    $scope.slideChanged = function (index) {
      $scope.slideIndex = index;
    };

  })

  .controller('DashCtrl', function ($scope, $state) {
    $scope.toGuide = function () {
      $state.go('guide');
    }
  })

  .controller('ChatsCtrl', function ($scope, $rootScope, $ionicPlatform, $timeout,
                                     $cordovaLocalNotification, VeritasServiceHTTP) {

      localStorage.whenLastUsed = '';
      localStorage.clickcount = 0;
      $scope.items = [];
      $scope.reminder = {
        time: new Date(localStorage.time),
        mode: localStorage.mode,
        deactivate: false,
        saveDisabled: true,
      };

      $scope.reactivateHack = function () {
        $scope.reminder.saveDisabled = false;
        $scope.showToast("admin mode granted.");
      }

      $scope.saveButtonUsed = function () {
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
        $timeout(function () {
          window.plugins.toast.showLongBottom(text);
        }, 100);
      };

      $scope.resetField = function (fieldname) {
        if (fieldname === 'time') {
          $scope.reminder.time = new Date(localStorage.time) || '';
        }
      };

      $scope.saveReminderValues = function () {

        if (!localStorage.studentId) {
          var msg = 'First submit participant code then try again.';
          $scope.showToast(msg);
          console.log(msg);
          $scope.resetField('time');
          return;
        }

        var response = confirm("Are you sure?\n(only one change per day allowed)");
        if (!response) return;

        localStorage.time = $scope.adjustDateToToday($scope.reminder.time);
        $scope.saveToServer(localStorage.time);

        var currentDate = new Date();
        localStorage.whenLastUsed = currentDate.getMonth() + '-' + currentDate.getDate();

        $scope.reminder.saveDisabled = true;
        if (!$scope.reminder.deactivate) {
          $scope.activateGMATReminder();
        }
      };

      $scope.saveToServer = function (datetimeStr) {

        var
          dt = new Date(datetimeStr),
          hrs = dt.getHours(),
          minutes = dt.getMinutes();

        VeritasServiceHTTP.reminder().save({
          student_id: localStorage.studentId,
          remind_time: hrs + ':' + minutes
        }, function (response) {
          console.log("time successfully saved; response = ", response);
        });
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

          $ionicPlatform.ready(function () {

            $cordovaLocalNotification.schedule({
              id: 999,
              title: 'GMAT Gentle Reminder',
              text: 'Time to practice (start within next 10 minutes)',
              every: 'day',
              at: timeFromNow
            });

            $rootScope.$on('$cordovaLocalNotification:click', function (event, notification, state) {
              if (notification.id === 999) {

                // launch external app
                var scheme;
                if (ionic.Platform.isIOS()) {
                  scheme = 'https://itunes.apple.com/us/app/gmat-question-bank/id943136266?mt=8';
                }
                else if (ionic.Platform.isAndroid()) {
                  scheme = 'com.veritas.mobile';
                }

                navigator.startApp.check(scheme, function (message) { /* success */
                    navigator.startApp.start(scheme, function (message) {  /* success */
                        $scope.showToast("Opening GMAT app...");
                      },
                      function (error) { /* error */
                        $scope.showToast("Error launching GMAT app...");
                      });
                  },
                  function (error) { /* error */
                    $scope.showToast('Install app');
                    window.open('https://play.google.com/store/apps/details?id=com.veritas.mobile', '_system', 'location=no');
                  });
              }
            });

          });
        };

      });

      $scope.$on('cordovaLocalNotification:trigger', function (notification, state) {
        $scope.showToast("trigger!!");
        alert(notification.id);
      });

      $scope.$on('cordovaLocalNotification:click', function (notification, state) {
        $scope.showToast("clicked!!");
        alert(notification.id);
      });

    }
  )

  .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    $scope.item = Chats.get($stateParams.item)
    //$scope.chat = Chats.get($stateParams.chatId);
  })

  .controller('AccountCtrl', function ($scope, VeritasServiceHTTP) {

    $scope.account = {
      code: localStorage.code || '',
      username: localStorage.email || '',
      password: localStorage.password || ''
    };

    $scope.submitCode = function (code) {

      VeritasServiceHTTP.practice().get({code: code}, function (response) {
        console.log("student info log:", response);

        localStorage.code = code;
        localStorage.email = response.account.email;
        localStorage.password = response.account.password;
        localStorage.studentId = response.account.student_id;

        $scope.account.username = response.account.email;
        $scope.account.password = response.account.password;

      }, function (response) {
        var msg = "Unknown error occurred.";
        if (response.status === 0) {
          msg = "Invalid code. Try again.";
          $scope.resetField('account');
        }
        console.log(msg);
        $scope.showToast(msg);
      });

    };

    $scope.resetField = function (fieldname) {
      if (fieldname === 'account') {
        $scope.account.code = '';
        $scope.account.username = '';
        $scope.account.password = '';
      }
    };

    // example: gax1209x093 ==> 12
    $scope.getIdFromCode = function (code) {
      return code.substr(2, 2);
    };

    $scope.showToast = function (text) {
      setTimeout(function () {
        //if ($ionicPlatform) {
        window.plugins.toast.showLongBottom(text);
        //} else {
        //  showDialog(text);
        //}
      }, 100);
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

    $scope.refreshScore = function () {

      VeritasServiceHTTP.scrape().get({code: localStorage.code}, function (response) {
        console.log("No of practices updated:", response.practices_updated);
      });

      VeritasServiceHTTP.practice().get({code: localStorage.code}, function (response) {

        response.practices.forEach(function (practice) {
          practice.taken_on = $scope.changeDateFormat(practice.taken_on);
        });

        $scope.practices = response.practices;

        if (response.practices.length === 0) {
          $scope.showToast("No data was fetched from your account.");
        } else {
          $scope.showToast("Update successful.");
        }

        var rewards = 1.23 * 5.00;
        console.log("rewards is:", rewards);
        var practiceName;
        response.practices.forEach(function (practice) {
          practice.rewards = '$' + rewards;
          practiceName = 'practice' + practice.id;
          localStorage[practiceName] =
            practice.id + ';' +
            practice.question_count + ';' +
            practice.taken_on + ';' +
            practice.duration + ';' +
            practice.percent_correct + ';' +
            practice.rewards;
        });

        console.log("$scope.practices:", $scope.practices);
      });

    };

    if (localStorage.studentId) {
      $scope.refreshScore();
    }
  });
//TODO: allow ios permissions for notification
//TODO: remove duplicating functions in scopes
