angular.module('starter.controllers', [])

.controller('IntroCtrl', function($scope, $state, $ionicSlideBoxDelegate) {

  // Called to navigate to the main app
  $scope.startApp = function() {
    $state.go('tab.account');
  };

  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };

  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };

  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };

})

.controller('GuideCtrl', function($scope, $state, SavedAccount, Helper) {
  $scope.is_admin = SavedAccount.get(SavedAccount.ADMIN_MODE);
  $scope.has_deadline = SavedAccount.get(SavedAccount.ACCOUNT).has_deadline;
  $scope.has_contingency = SavedAccount.get(SavedAccount.ACCOUNT).has_contingency;
  $scope.is_mobile = Helper.is_mobile();
  $scope.is_android = Helper.is_android();
  $scope.app_link = Helper.is_ios() ? Helper.IOS_APP_LINK : Helper.ANDROID_APP_LINK;

  $scope.get_condition = function(condition) {
    var account = SavedAccount.get('account');
    if (condition === 'Deadline/Contingency') {
      console.log('got case 1');
      account.has_deadline = true;
      account.has_contingency = true;
    } else if (condition === 'Deadline/NO Contingency') {
      console.log('got case 2');
      account.has_deadline = true;
      account.has_contingency = false;
    } else if (condition === 'NO Deadline/Contingency') {
      console.log('got case 3');
      account.has_deadline = false;
      account.has_contingency = true;
    } else if (condition === 'NO Deadline/NO Contingency') {
      console.log('got case 4');
      account.has_deadline = false;
      account.has_contingency = false;
    }

    SavedAccount.set('account', account);
    $scope.has_deadline = SavedAccount.get('account').has_deadline
    $scope.has_contingency = SavedAccount.get('account').has_contingency
  };

  $scope.toGuide = function() {
    $state.go('intro');
  }
})

.controller('ReminderCtrl', function($scope, $rootScope, $ionicPlatform, $timeout, $ionicPopup,
  $cordovaLocalNotification, Helper, SavedAccount, VeritasServiceHTTP, ConnectivityMonitor) {

  // SavedAccount.clear_all();
  $scope.load_reminder = function() {
    var wlc = SavedAccount.get(SavedAccount.WHEN_LAST_CHANGED);
    console.log(wlc)
    if (wlc) {
      wlc = new Date(wlc);
      console.log('wlc:', wlc);

      var today = new Date();
      console.log('today:', today);

      if (today.getDate() === wlc.getDate() && today.getMonth() === wlc.getMonth()) {
        $scope.is_disabled = true;
      } else {
        $scope.is_disabled = false;
        console.log('Reminder change possible.');
      }
    } else {
      console.log('wlc is null');
    }

    var remind_time = SavedAccount.get(SavedAccount.REMIND_TIME);
    if (remind_time) {
      $scope.remind_time = remind_time;
    }
  };
  $scope.load_reminder();

  $scope.save_reminder = function(remind_time) {
    console.log('remind_time submitted: ', remind_time);
    if (remind_time === undefined) {
      Helper.show_toast('Invalid date. Try again');
      return;
    }

    // TODO: update server when reminder is set: send timestamp, previous time, current time
    // TODO: remove any random functionality to re-enable buttons by double-tapping in hidden place
    // TODO: update how pariticipants receive their daily rewards based on their conditions
    // TODO: update Relative to Reminder to show number of mins between reminder activated time
    //     : and time the practice session was complete / if completed before reminder then change
    //     : it to 'before'
    // TODO: comment col should either be: empty, "3 NIS" or "Nothing"
    // TODO: reminder notification: no deadline/no practice else 'reminder to practice in 15 mins'
    // TODO: store all app analytics. Page change, button clicks, EVERYTHING!
    // TODO: change install link in guide to actual app link
    // TODO: add timeout to requests sent. check link: http://blog.xebia.com/cancelling-http-requests-for-fun-and-profit
    // TODO: add screen busy sign when page is busy
    // TODO: check if offline/online: http://www.nikola-breznjak.com/blog/codeproject/check-network-information-change-with-ionic-famework/
    // TODO: show enable sign when remind time is valid
    // TODO: disable user to be able to change alarm within a few minutes from reminder time?
    // TODO: put refresh button to be on top instead of below
    // TODO: have a generic string so you can easily change theme across app

    // TODO: fix relative_time
    // TODO: fix refresh button view
    // TODO: fix username/password view
    // TODO: look into flask REST api
    // TODO: fix tab refresh when clicked
    // TODO: add online practice mode to show
    <!-- TODO: Ask Ori if this option should be available -->

    if (!SavedAccount.is_valid_participant()) { // TODO: test that this line works
      Helper.show_toast('First submit participant code then you can set reminder.');
      return;
    }

    var confirmPopup = $ionicPopup.confirm({
      title: 'Set Daily Reminder',
      subTitle: '(can change only ONCE per day)',
      template: 'Are you sure you want to set reminder?'
    });

    confirmPopup.then(function(answer) {
      if (answer) {
        $scope.is_disabled = true;
        remind_time = Helper.adjust_date_to_today(remind_time);
        SavedAccount.set(SavedAccount.REMIND_TIME, remind_time);

        var today = new Date();
        SavedAccount.set(SavedAccount.WHEN_LAST_CHANGED, today);

        // update remind_dict to compute quiz completed time relative to reminder
        var rel_dict = SavedAccount.get(SavedAccount.RELATIVE_DICT) || {};
        var key = today.getFullYear() + '-' + today.getMonth() + '-' + today.getDate();
        rel_dict[key] = remind_time;
        SavedAccount.set(SavedAccount.RELATIVE_DICT, rel_dict);

        // update change list
        var chl = SavedAccount.get(SavedAccount.CHANGE_LIST);
        chl = chl ? chl : [];

        var hr_min_str = remind_time.getHours() + ':' + remind_time.getMinutes();
        chl.push({today: hr_min_str})
        SavedAccount.set(SavedAccount.CHANGE_LIST, chl);

        // save reminder time in server
        VeritasServiceHTTP.reminder().save({
          student_id: SavedAccount.get(SavedAccount.ACCOUNT).student_id,
          remind_time: hr_min_str
        }, function(success_resp) {
            console.log("reminder time successfully saved; response = ", success_resp);
        }, function(fail_resp) {
            console.log("failed to set reminder:", fail_resp);
        });

        // TODO: check that there is internet connection before saving
        // TODO: if not put a flag to save when network is back
        if (!$scope.deactivate) {
          $scope.activateGMATReminder();
        }

      }

    });

  };


  $scope.activate_admin_mode = function() { // TODO: Remove this hack part
    console.log('admin mode activated');
    $scope.is_disabled = false;
    Helper.show_toast("admin mode granted.");
  }


$scope.toggle_deactivate = function(state) {
    state ? $scope.deactivateGMATReminder() : $scope.activateGMATReminder();
  };


  $ionicPlatform.ready(function() {

    $scope.deactivateGMATReminder = function() {
      $cordovaLocalNotification.cancel(999).then(function(result) {
        Helper.show_toast("Reminder deactivated.");
      });
    };

    $scope.activateGMATReminder = function() {
      var remind_time = SavedAccount.get('remind_time');
      if (!remind_time) {
        Helper.show_toast("You need to set a reminder time first");
        return;
      }

      var
        currentTime = new Date(),
        alarmTime = new Date(remind_time),
        isToday = true;

      if (alarmTime < currentTime) {
        alarmTime.setDate(alarmTime.getDate() + 1);
        isToday = false;
      }

      var
        timeDiff = alarmTime - currentTime,
        timeFromNow = new Date(currentTime.getTime() + timeDiff),
        hrs_from_now = Math.round(((timeDiff / (3600 * 1000)) + 0.00001) *
          100) / 100, // 2dp
        msg;

      if (hrs_from_now === 1.0) {
        msg = " (in 1 hour)";
      } else if (hrs_from_now >= 1.01) {
        msg = " (in approx " + hrs_from_now + " hrs)";
      } else {
        var mins = Math.round(60 * hrs_from_now);
        msg = ' (in ' + mins + ' minute';
        msg = mins > 1 ? msg + 's)' : msg + ')';
      }

      var extractTime = function(datetimeValue) {
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
      } else {
        msg = "Next alarm: Tomorrow at " + extractTime(timeFromNow) + msg;
      }
      Helper.show_toast(msg);


      var notif_msg;
      if (SavedAccount.has_deadline() && SavedAccount.has_contingency()) {
        notif_msg = 'Practice in next 15 mins to earn 3 NIS.';
      } else if (!SavedAccount.has_deadline() && SavedAccount.has_contingency()) {
        notif_msg = 'Practice today to earn 3 NIS.';
      } else if (SavedAccount.has_deadline() && !SavedAccount.has_contingency()) {
        notif_msg = 'Practice in next 15 mins.';
      } else if (!SavedAccount.has_deadline() && !SavedAccount.has_contingency()) {
        notif_msg = 'Practice time.';
      }

      $cordovaLocalNotification.schedule({
        id: 999,
        title: 'GMAT Gentle Reminder',
        text: notif_msg,
        every: 'day',
        at: timeFromNow
      });

      $rootScope.$on('$cordovaLocalNotification:click', function(event, notification, state) {
        if (notification.id !== 999) {
          console.log('stopping...got diff notif id: ', notification.id);
          return;
        }

        // launch external app
        var scheme;
        if (Helper.is_ios()) { scheme = Helper.IOS_SCHEME; }
        else if (Helper.is_android()) { scheme = Helper.ANDROID_SCHEME; }

        navigator.startApp.check(scheme,

          function(check_success) {

            navigator.startApp.start(scheme,
              function(start_success) {
                Helper.show_toast("Opening GMAT app...");
              },

              function(start_error) {
                Helper.show_toast("Error launching GMAT app...");
              }
            );
          },

          function(check_error) {
            Helper.show_toast('You need to Install Veritas app');
            if (Helper.is_android()) { Helper.open_url(Helper.ANDROID_APP_LINK); }
            else if (Helper.is_ios()) { Helper.open_url(Helper.IOS_APP_LINK); }
          }
        ); //navigator.startApp

      }); // $rootScope.$on

    }; //activateGMATReminder

  });

  $scope.$on('cordovaLocalNotification:trigger', function(notification,
    state) {
    Helper.show_toast("trigger!!");
    alert(notification.id);
  });

  $scope.$on('cordovaLocalNotification:click', function(notification, state) {
    Helper.show_toast("clicked!!");
    alert(notification.id);
  });

})

.controller('AccountCtrl', function($scope, $timeout, $ionicLoading, $sce, Helper, SavedAccount,
                                    VeritasServiceHTTP, ConnectivityMonitor) {
  $scope.practices = SavedAccount.get(SavedAccount.PRACTICES);
  $scope.practices = $scope.practices ? $scope.practices : [];

  $scope.account = SavedAccount.get(SavedAccount.ACCOUNT);
  $scope.account = $scope.account ? $scope.account : {};


  $scope.show_relative = function(taken_on, reminder_when_taken) {
    if (!reminder_when_taken || !taken_on)
      return;

    var hr_min = reminder_when_taken.remind_time.split(':'); // hr:mm:ss
    var remind_time = new Date(reminder_when_taken.created_at); // datetime
    remind_time.setHours(parseInt(hr_min[0]));
    remind_time.setMinutes(parseInt(hr_min[1]));
    var remind_total = remind_time.getHours() * 60 + remind_time.getMinutes();

    taken_on = new Date(taken_on);
    var taken_total = taken_on.getHours() * 60 + taken_on.getMinutes();
    var mins_diff = Math.abs(remind_total - taken_total);

    var has_deadline = SavedAccount.get(SavedAccount.ACCOUNT).has_deadline;
    remind_total = has_deadline
                      ? remind_total + SavedAccount.REMINDER_LIMIT
                      : remind_total;

    if (taken_total <= remind_total) {
       return $scope.convert_display(mins_diff) + ' before reminder';
    } else {
       return $scope.convert_display(mins_diff) + ' after reminder';
    }
  };


  $scope.convert_display = function(num_of_mins) {
    if (num_of_mins <= 1)  {
      return '1 min';
    } else if (num_of_mins < 60) {
      return num_of_mins + ' mins';
    }

    num_of_hrs = (Math.round(10 * num_of_mins / 60.0)) / 10; // 1dp
    if (num_of_hrs === 1.0) {
      return "1 hour";
    } else if (num_of_hrs >= 1.01) {
      return num_of_hrs + " hrs";
    }

  };


  $scope.show_comment = function(time_spent, questions_solved) {
    if (parseInt(questions_solved) < 3) {
      return $sce.trustAsHtml('Questions too few &#10007');
    }

    if (SavedAccount.get(SavedAccount.ACCOUNT).has_contingency) {
      var mins = time_spent.split('m')[0];
      mins = parseInt(mins.substr(mins.length - 2));

      if (mins < 3) {
        return $sce.trustAsHtml('Time too short &#10007');
      } else if (mins >= 3) {
        return $sce.trustAsHtml('3 NIS &#10004');
      }

    }

  };

  // code for student (id=1): W05L3yVIw
  // code for student (id=2): ZZAVB37ha
  $scope.submit_code = function(code) {
    // make sure admin mode is always disabled for every user unless special code used
    SavedAccount.set(SavedAccount.ADMIN_MODE, false);

    if (code === 'oriactivated1') {
      code = 'W05L3yVIw';
      Helper.show_toast('Admin mode activated with practice sessions.');
      SavedAccount.set(SavedAccount.ADMIN_MODE, true);

    } else if (code === 'oriactivated2') {
      code = 'ZZAVB37ha';
      Helper.show_toast('Admin mode activated.');
      SavedAccount.set(SavedAccount.ADMIN_MODE, true);
    }

    if (!ConnectivityMonitor.is_online()) {
      Helper.show_toast('You have no network connection.');
      return;
    }

    if (!code) {
      Helper.show_toast('Cannot submit empty code entry.');
      return;
    }

    var account = SavedAccount.get(SavedAccount.ACCOUNT);
    if (account) {
      account.code = code;
    } else {
      account = {
        'code': code
      };
    }

    $scope.fetch_remote_info(code);

    // show busy signal and timeout

    // Setup the loader
    // $ionicLoading.show({
    //   content: 'Loading',
    //   animation: 'fade-in',
    //   showBackdrop: true,
    //   maxWidth: 200,
    //   showDelay: 0
    // });
    //
    // // Set a timeout to clear loader, however you would actually call the $ionicLoading.hide(); method whenever everything is ready or loaded.
    // $timeout(function () {
    //   // $scope.fetch_remote_info(code);
    //   $ionicLoading.hide();
    // }, 2000);
    //
  };

  $scope.fetch_remote_info = function(account_code) {
    VeritasServiceHTTP.practice().get({
        code: account_code
      },

      function(response) {
        console.log("Success! Student info:", response);

        if (response.account) {
          var account = {
            'code': account_code,
            'student_id': response.account.student_id,
            'username': response.account.email,
            'password': response.account.password,
            'has_deadline': response.has_deadline,
            'has_contingency': response.has_contingency
          };

          SavedAccount.set(SavedAccount.ACCOUNT, account);
          $scope.account.username = account.username;
          $scope.account.password = account.password;
          Helper.show_toast('Successfully fetched account details.');
        }

        if (response.practices) {
          SavedAccount.set(SavedAccount.PRACTICES, response.practices);
          $scope.practices = response.practices;
        }
      },

      function(response) {
        console.log("Failed. Response:", response);
        $scope.resetField(SavedAccount.ACCOUNT);
        Helper.show_toast('Invalid code. Try again.');
      });
  };

  $scope.resetField = function(field) {
    if (field === SavedAccount.REMIND_TIME) {
      $scope.remind_time = SavedAccount.get(SavedAccount.REMIND_TIME);
    } else if (field === SavedAccount.ACCOUNT) {
      var account = SavedAccount.get(SavedAccount.ACCOUNT) || {
        code: '',
        username: '',
        password: ''
      };
      $scope.account.code = account.code;
      $scope.account.username = account.username;
      $scope.account.password = account.password;
      $scope.practices = [];
    }
  };

  $scope.isValidPractice = function(practice) {
    return Math.random() > 0.5;
  }

  $scope.refresh_score = function() {
    if (!ConnectivityMonitor.is_online()) {
      Helper.show_toast('You have no network connection.');
      return;
    }

    if (!SavedAccount.is_valid_participant()) {
      Helper.show_toast(
        'You have no account yet. Submit your code first.');
      return;
    }

    VeritasServiceHTTP.scrape().get({
      code: SavedAccount.get(SavedAccount.ACCOUNT).code
    }, function(response) {
      console.log('scrape response:',response);
      Helper.show_toast("No of practices updated:", response.practices_updated);
    }, function(error) {
      console.log('error');
    });

    VeritasServiceHTTP.practice().get({
      code: SavedAccount.get(SavedAccount.ACCOUNT).code
    }, function(response) {
      console.log('response:', response)

      if (!response.practices) {
        Helper.show_toast('No updated practice sessions.');
      } else {
        Helper.show_toast("Update successful.");
        $scope.practices = response.practices;
        SavedAccount.set(SavedAccount.PRACTICES, response.practices);
      }

    }, function(error) {
      Helper.show_toast('Sorry could not refresh. Try again later.');
      console.log('error:', error);
    });

  };

});
