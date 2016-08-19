app.factory('facebookFactory', function($q){
	var facebookFactory = {}

	var toPrint = "";
	
	facebookFactory.statusChangeCallback = function(response) {
		console.log('statusChangeCallback');
		console.log(response);
		// The response object is returned with a status field that lets the
		// app know the current login status of the person.
		// Full docs on the response object can be found in the documentation
		// for FB.getLoginStatus().
		if (response.status === 'connected') {
		  // Logged into your app and Facebook.
		  document.getElementById("logInLanding").style.display = 'none';
		  return facebookFactory.whenConnected();
		} else if (response.status === 'not_authorized') {
		  // The person is logged into Facebook, but not your app.
		  document.getElementById("logInLanding").style.display = 'block';
		  
		} else {
		  // The person is not logged into Facebook, so we're not sure if
		  // they are logged into this app or not.
		  document.getElementById("logInLanding").style.display = 'block';
		  
		}
	}

	facebookFactory.whenConnected = function(){
		var	deferred = $q.defer(); 
		FB.api('me?fields=name,picture.type(large)', function(response) {
			if(!response || response.error){
				deferred.reject('Error occurred');
			}else{
				deferred.resolve({
					name: response.name,
					source: response.picture.data.url
				});
			}	
		});
		return deferred.promise;
	}

	facebookFactory.treeFlipper = function(friends){
	  	var countries = [];
	  	friends.forEach(function(fbfriend){
	  		if(fbfriend.feed != undefined){
	  			fbfriend.feed.data.forEach(function(post){
	  				if(post.place !=undefined){
	  					if(post.place.location != undefined){
	  						var country = {};
	  						country.name = post.place.location.country;
	  						country.places = [];
	  						var place = {};
	  						place.id = post.place.id;
	  						place.name = post.place.name;
	  						place.friends = [];

	  						country.places.push(place);

	  						var friend = {};
	  						friend.name = fbfriend.name;
	  						friend.id = fbfriend.id;
	  						friend.source = fbfriend.picture.data.url;

	  						place.friends.push(friend);

	  						countries.push(country);
	  					}
	  				}
	  			});
	  		}
	  	});
	  	var pretty = JSON.stringify(countries, null, "\t") ;
	  	document.getElementById("dataDiv").appendChild(document.createTextNode(pretty));
		//console.log(countries);
		return countries;
	}
	
	facebookFactory.logIntoFb = function(){
		checkLoginState();
		 FB.login(function(response) {
		   checkLoginState();
		 }, {scope: 'public_profile,email,user_tagged_places,user_friends'});
	}

	facebookFactory.getPlacePic = function(idStr){
		var deferred = $q.defer(); 
		var query = idStr+"?fields=name,cover,picture.type(large)"
		FB.api(query, function(response){
			var place = response;
			var name = place.name;
			var src;
			if(!place.cover){
				src = place.cover.source;
			}else if(place.picture != undefined){
				src = place.picture.data.url;
			}else{
				src = "";
			}
			deferred.resolve({
				name: name,
				source: src
			});
		});
		return deferred.promise;
	};

	facebookFactory.getCountries = function(){
		var deferred = $q.defer();
		var query = 'me/friends?fields=id,name,picture.type(large),feed.limit(1000).since(2016-08-01T00:00:00){id,created_time,place{id, name, location{country}},story,message,full_picture}';
		FB.api(query, function(response){
			var countries = treeFlipper(response.data);
			deferred.resolve(countries);
		});
		return deferred.promise;
	};

	  // This function is called when someone finishes with the Login
	  // Button.  See the onlogin handler attached to it in the sample
	  // code below.
	  function checkLoginState() {
	  	FB.getLoginStatus(function(response) {
	  		statusChangeCallback(response);
	  	});
	  }


	  // Load the SDK asynchronously
	  (function(d, s, id) {
	  	var js, fjs = d.getElementsByTagName(s)[0];
	  	if (d.getElementById(id)) return;
	  	js = d.createElement(s); js.id = id;
	  	js.src = "//connect.facebook.net/en_US/sdk.js";
	  	fjs.parentNode.insertBefore(js, fjs);
	  }(document, 'script', 'facebook-jssdk'));


	  return facebookFactory;



	})

