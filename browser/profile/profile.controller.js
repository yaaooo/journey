'use strict';

app.controller('ProfileCtrl', function($scope, $state, $stateParams) {
    $scope.profileId = $stateParams.id;
});