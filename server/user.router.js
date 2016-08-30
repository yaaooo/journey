// Grab models from database
var db = require('./db');
var User = db.model('user');
var Journey = db.model('journey');
var Post = db.model('post');

// Request Module to make Pixabay API calls 
var rp = require('request-promise');

// Bluebird Module to handle Async calls
var Promise = require('bluebird');

// Set up Router
var router = require('express').Router();

// Checking if User Exists
router.get('/:userId', function(req,res,next){
	var userId = req.params.userId;
	return User.find({ where: {id: userId} })
	.then(function(user){
		if(user !== null){
			return res.send("User exists");
		}else{
			return res.send("User doesn't exist");
		}
	})
});

// Retrieving User Journeys
router.get('/:userId/journeys', function(req,res,next){
	var userId = req.params.userId;
	return User.findOne({ 
		where: { id: userId }, 
		include: [
			{
				model: Journey,
				include: [Post]
			}
		]
	})
	.catch(next);
});


// Retrieving One Journey
router.get('/:userId/journeys/:journeyId', function(req,res,next){
	var journeyId = req.params.userId;
	return Journey.findOne({
		where: { id: journeyId },
		include: [Post]
	})
	.catch(next);
});


// First time User -- Persisting User Journeys
router.post('/:userId/journeys', function(req,res,next){
	var userId = req.params.userId;
	// Journey Array Basic = journey array without country sources added 
	var journeyArr = req.body.journeys;
	console.log("Journeys sent by client: ", req.body.journeys);
	// Check if user already exists on database
	return User.findOne({ where: { id: userId } })
	.then(function(foundUser){
		if(foundUser !== null){
			return res.status(409).send("User already exists");
		}else{
			// Create User
			User.create({ id: userId })
			.then(function(newUser){
				console.log("Journeys with source are: ", journeyArr);	
				return Promise.map(journeyArr, function(journey){
					return newUser.createJourney({
						name: journey.name,
						source: journey.source || "No Source"
					})
					.then(function(createdJourney){
						journey.id = createdJourney.id
						return journey;
					})
				})
			})
			.then(function(updatedJourneyArr){
				console.log("Journeys with db ids are: ", updatedJourneyArr);
				res.status(200).send(updatedJourneyArr);
				return Promise.map(updatedJourneyArr, function(updatedJourney){
					return Journey.findOne({ where: { id: updatedJourney.id } })
					.then(function(foundJourney){
						return Promise.map(updatedJourney.posts, function(post){
							foundJourney.createPost({
								fbpostid: post.id,
								journeyid: foundJourney.id,
								story: post.story,
								message: post.message,
								source: post.source,
								country: post.country,
								created: post.time,
								likes: post.likes	
							})
						})	
					})
				})
			})
		}
	})
	.catch(next);
});


module.exports = router;
