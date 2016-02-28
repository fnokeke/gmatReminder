angular.module('starter.controllers', [])

  .controller('DashCtrl', function ($scope) {
  })

  .controller('ChatsCtrl', function ($scope, DataServiceHTTP, Chats) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});

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

    $scope.startCountdown = function () {
      console.log("countdown started");
    };

    $scope.showNotification = function () {
      console.log("notification popup");
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
