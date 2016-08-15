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

.controller('GuideCtrl', function(Logger, $scope, $state, SavedAccount, Helper) {

  // log
  var type, data, today;
  today = new Date();
  data = {
    'tab': 'Guide at ' + today
  };
  type = 'screen';
  Logger.log_event(type, data);

  if (SavedAccount.get(SavedAccount.ACCOUNT)) {
    $scope.is_admin = SavedAccount.get(SavedAccount.ADMIN_MODE);
    $scope.has_deadline = SavedAccount.get(SavedAccount.ACCOUNT).has_deadline;
    $scope.has_contingency = SavedAccount.get(SavedAccount.ACCOUNT).has_contingency;
  }
  $scope.is_mobile = Helper.is_mobile();
  $scope.is_android = Helper.is_android();
  $scope.app_link = Helper.is_ios() ? Helper.IOS_APP_LINK : Helper.ANDROID_APP_LINK;

  $scope.open_install_link = function() {
    Helper.is_ios() ? Helper.open_url(Helper.IOS_APP_LINK) : Helper.open_url(
      Helper.ANDROID_APP_LINK);
  };

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

    SavedAccount.set(SavedAccount.ACCOUNT, account);
    $scope.has_deadline = SavedAccount.get(SavedAccount.ACCOUNT).has_deadline
    $scope.has_contingency = SavedAccount.get(SavedAccount.ACCOUNT).has_contingency
  };

  $scope.toGuide = function() {
    // log
    var type, data, today;
    today = new Date();
    data = {
      'button': 'start_guide at ' + today
    };
    type = 'clicked';
    Logger.log_event(type, data);

    $state.go('intro');
  }
})

.controller('ReminderCtrl', function($scope, $rootScope, $ionicPlatform,
  $ionicPopup, $cordovaLocalNotification, Helper, SavedAccount, VeritasHTTP,
  ConnectivityMonitor, Logger) {

  // log
  var type, data, today;
  today = new Date();
  data = {
    'tab': 'Reminder at ' + today
  };
  type = 'screen';
  Logger.log_event(type, data);

  $scope.should_disable_reminder = function() {
    var wlc = SavedAccount.get(SavedAccount.WHEN_LAST_CHANGED);
    if (!wlc) {
      console.log('wlc is null');
      return false;
    }

    wlc = new Date(wlc);
    var today = new Date();

    return today.getDate() === wlc.getDate() &&
      today.getMonth() === wlc.getMonth();

  };

  $scope.load_reminder = function() {
    $scope.is_disabled = $scope.should_disable_reminder();
    console.log(SavedAccount.REMIND_TIME);
    var remind_time = SavedAccount.get(SavedAccount.REMIND_TIME);
    $scope.remind_time = remind_time;
  };
  $scope.load_reminder();

  if ($scope.should_disable_reminder())
    $scope.reminder_msg = 'Cannot change reminder until tomorrow';

  $scope.is_admin = SavedAccount.get(SavedAccount.ADMIN_MODE);
  console.log('is_admin reminder:', $scope.is_admin);

  $scope.admin_reactivate_button = function() {
    $scope.is_disabled = false;
    Helper.show_toast('Save Button re-activated by Admin.');
  }

  $scope.save_reminder = function(remind_time_arg) {
    if (!ConnectivityMonitor.is_online()) {
      Helper.show_toast('You need network connection to save reminder.');
      return;
    }

    if (remind_time_arg === undefined) {
      Helper.show_toast('Invalid date. Try again');
      return;
    }

    if (!SavedAccount.is_valid_participant()) {
      Helper.show_toast(
        'First submit participant code then you can set reminder.');
      $scope.remind_time = null;
      return;
    }

    var confirmPopup = $ionicPopup.confirm({
      title: 'Set Daily Reminder',
      subTitle: '(can change only ONCE per day)',
      template: 'Are you sure you want to set reminder?'
    });

    // TODO: offline logging management
    var curr_remind_time = $scope.remind_time;
    confirmPopup.then(function(answer) {
      if (!answer) {
        $scope.reminder_msg = 'You do not have any reminder set.';
      } else {

        var remind_time = SavedAccount.adjust_date_to_today(
          remind_time_arg);
        var hr_min_str = remind_time.getHours() + ':' + remind_time.getMinutes();

        // save reminder time in server
        VeritasHTTP.query().save_reminder({
          student_id: SavedAccount.get(SavedAccount.ACCOUNT).student_id,
          remind_time: hr_min_str
        }, function(success_resp) {
          var today = new Date();
          SavedAccount.set(SavedAccount.WHEN_LAST_CHANGED, today);
          SavedAccount.set(SavedAccount.REMIND_TIME, remind_time);

          $scope.is_disabled = true;
          $scope.reminder_msg =
            'Cannot change reminder until tomorrow.';
          $scope.activateGMATReminder();

          Helper.show_toast('Reminder successfully saved.');
        }, function(error_resp) {
          Helper.show_toast(
            "Uh oh, can't update reminder. Pls contact Admin.");
          console.log(error_resp);

          $scope.remind_time = null;
          $scope.is_disabled = false;
          $scope.reminder_msg =
            'Reminder failed to set. Pls contact Admin.';
        });
      } // end else
    }); // end confirmPopup

    // log
    var type, data, today;
    today = new Date();
    data = {
      'button': 'save_reminder at ' + today
    };
    type = 'clicked';
    Logger.log_event(type, data);
  };


  $scope.activate_admin_mode = function() {
    console.log('admin mode activated');
    $scope.is_disabled = false;
    Helper.show_toast("admin mode granted.");
  }


  $scope.toggle_deactivate = function(state) {
    // log
    var type, data, today;
    today = new Date();
    data = {
      'button': 'deactivate_reminder at ' + today
    };
    type = 'clicked';
    Logger.log_event(type, data);

    state ? $scope.deactivateGMATReminder() : $scope.activateGMATReminder();
  };


  $ionicPlatform.ready(function() {

    $scope.deactivateGMATReminder = function() {
      $cordovaLocalNotification.cancel(999).then(function(result) {
        Helper.show_toast("Reminder deactivated.");

        var hr_min_str = '00:00:00:XXXX'
        VeritasHTTP.query().save_reminder({
          student_id: SavedAccount.get(SavedAccount.ACCOUNT).student_id,
          remind_time: hr_min_str
        }, function(success_resp) {
          console.log(
            "deactivate successfully saved; response = ",
            success_resp);
        });

      });
    };

    $scope.activateGMATReminder = function() {
      var remind_time = SavedAccount.get(SavedAccount.REMIND_TIME);
      if (!remind_time) {
        Helper.show_toast(
          "Cannot activate reminder until time is set.");
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
        hrs_from_now = Math.round(((timeDiff / (3600 * 1000)) +
            0.00001) *
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
        msg = "Next alarm: Today at " + extractTime(timeFromNow) +
          msg;
      } else {
        msg = "Next alarm: Tomorrow at " + extractTime(timeFromNow) +
          msg;
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

      $rootScope.$on('$cordovaLocalNotification:click', function(
        event, notification, state) {
        if (notification.id !== 999) {
          console.log('stopping...got diff notif id: ',
            notification.id);
          return;
        }

        // launch external app
        var scheme;
        if (Helper.is_ios()) {
          scheme = Helper.IOS_SCHEME;
        } else if (Helper.is_android()) {
          scheme = Helper.ANDROID_SCHEME;
        }

        navigator.startApp.check(scheme,

          function(check_success) {

            navigator.startApp.start(scheme,
              function(start_success) {
                Helper.show_toast("Opening GMAT app...");
              },

              function(start_error) {
                Helper.show_toast(
                  "Error launching GMAT app...");
              }
            );
          },

          function(check_error) {
            Helper.show_toast('You need to Install Veritas app');
            if (Helper.is_android()) {
              Helper.open_url(Helper.ANDROID_APP_LINK);
            } else if (Helper.is_ios()) {
              Helper.open_url(Helper.IOS_APP_LINK);
            }
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

.controller('AccountCtrl', function($scope, $interval, $sce, Helper,
  SavedAccount,
  ConnectivityMonitor, VeritasHTTP, Logger) {

  // log
  var type, data, today;
  today = new Date();
  data = {
    'tab': 'Account at ' + today
  };
  type = 'screen';
  Logger.log_event(type, data);

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
    remind_total = has_deadline ? remind_total + SavedAccount.REMINDER_LIMIT :
      remind_total;

    if (taken_total <= remind_total) {
      return $scope.convert_display(mins_diff) + ' before reminder';
    } else {
      return $scope.convert_display(mins_diff) + ' after reminder';
    }
  };


  $scope.convert_display = function(num_of_mins) {
    if (num_of_mins <= 1) {
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


  var unique_dates = {};
  $scope.show_comment = function(time_spent, questions_solved, taken_on) {
    if (parseInt(questions_solved) < 3) {
      return $sce.trustAsHtml('Questions too few &#10007');
    }

    var mins = time_spent.split('m')[0];
    mins = parseInt(mins.substr(mins.length - 2));

    // if user spent a short amount of time then practice session is invalid
    // if they spent the minimum time required then show 3 NIS if user has contingency
    // otherwise just show checkmark
    // 3 NIS reward is received only once per day. Any other valid session receives no reward
    if (mins < 3) {
      return $sce.trustAsHtml('Time too short &#10007');
    } else if (SavedAccount.get(SavedAccount.ACCOUNT).has_contingency) {
      var key = new Date(taken_on)
      key = key.getFullYear() + '-' + key.getMonth() + '-' + key.getDate();
      if (key in unique_dates) {
        return $sce.trustAsHtml('&#10004');
      } else {
        unique_dates[key] = 1
        return $sce.trustAsHtml('3 NIS &#10004');
      }

    } else {
      return $sce.trustAsHtml('&#10004');
    }

  };

  // code for student (id=1): W05L3yVIw
  // code for student (id=2): ZZAVB37ha
  $scope.submit_code = function(code) {
    Helper.show_and_hide_spinner();

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

    $scope.fetch_account_details(code, first_time = true);

    // log
    var type, data, today;
    today = new Date();
    data = {
      'button': 'submit_code at ' + today
    };
    type = 'clicked';
    Logger.log_event(type, data);
  };


  $scope.fetch_account_details = function(account_code, first_time) {

    VeritasHTTP.query().get_account({
        code: account_code
      },

      function(response) { // success
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
          if (first_time) {
            Helper.show_toast('Successfully fetched account details.');
          }
        }

        if (response.practices) {
          SavedAccount.set(SavedAccount.PRACTICES, response.practices);
          $scope.practices = response.practices;
        }
      },

      function(fail_resp) { // failure
        $scope.resetField(SavedAccount.ACCOUNT);
        Helper.show_toast('Invalid code.');
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
  };

  $scope.refresh_score = function() {
    Helper.show_and_hide_spinner();

    if (!ConnectivityMonitor.is_online()) {
      Helper.show_toast('You have no network connection.');
      Helper.hide_spinner();
      return;
    }

    if (!SavedAccount.is_valid_participant()) {
      Helper.show_toast(
        'You have no account yet. Submit your code first.');
      Helper.hide_spinner();
      return;
    }

    $scope.scrape_and_get_practice();

    // log app version
    var today, phone, data, type;
    today = new Date();
    phone = Helper.is_android() ? 'android' : 'iOS';
    data = {
      'version': Helper.APP_VERSION + ' ' + phone + ' at ' + today
    };
    type = 'installed';
    Logger.log_event(type, data);

    // log refresh score
    type = 'clicked';
    data = {
      'button': 'refresh_score at ' + today
    };
    Logger.log_event(type, data);
  };


  $scope.scrape_and_get_practice = function() {
    VeritasHTTP.query().scrape_account({
        code: SavedAccount.get(SavedAccount.ACCOUNT).code
      },
      function(success) {
        console.log('scrape response:', success);
        success.practices_updated > 0 ? Helper.show_toast("Updated: " +
            success.practices_updated + ' practice session(s).') :
          Helper.show_toast('No updated sessions.');
        $scope.fetch_account_details(SavedAccount.get(SavedAccount.ACCOUNT)
          .code);
      }
    );

  };


}); // AccountCtrl
