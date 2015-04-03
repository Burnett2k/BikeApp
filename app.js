
/**
 * Module dependencies.
 */

var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var util = require('util');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var mongoose = require('mongoose');
var config = require('./config.js');
//requires installation of 'imagemagick' ubuntu package or possibly a windows
//env vir pointing to the installation
var im = require('imagemagick');

mongoose.connect('mongodb://localhost:27017/bikeApp', function(err){
	if(err) throw err;
});

//Models
var Bike = require('./models/bike.js');
var User = require('./models/user.js');
var MaintRec = require('./models/maintRec.js');
var imgDir = path.join('/public', 'img');

// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/

var app = express();

// all environments
app.set('host',config.host);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('AJ%K3l@1kj@i!UwqO!ps*324wS*!2xD324SALk'));
app.use(express.session({secret: 'A4323kLk21aw345SA81&&@!28sQA'}));
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
	//console.log(user);
	//console.log(userDB);
	User
	.findOne({gId: 
	user.id})
	.exec(function(err, userDB){
		//console.log("Attempting to add " + user.id + " " + user.displayName + " " + user.emails);
  		done(err, user);
	//});
	//	console.log("Deserialized: " + user.id);
	//console.log("In DB: " + userDB);
	if(!userDB){
		console.log("ID: " + user.id + " Email: " + user.email);
		new User({gId: user.id, email: user.emails[0].value, lastLogin: Date.now()}).save(function(err){ if (err) throw err;});
		console.log('Added: '+user.id);
	}
	else{
		//console.log('Found: ' +userDB._id + " " + userDB.gId);
		//console.log(userDB);
	}
	//done(null, user);
	});
});


passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: config.host + "/auth/google/callback",
    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/',ensureAuthenticated, function(req, res){
		res.render('index', {title: 'Bike Upkeep',
			host:config.host,
			user:req.user
		});
});

//get all bikes in database for specified user
app.get('/bikeList',ensureAuthenticated, function(req,res){
	Bike.find({gId:req.user.id}).exec(function(err, bikes){
		if(err) throw err;
		console.log('Finding bikes for ' + req.user.id);
		console.log(bikes);
		res.json(bikes);
	})
});

//New method using Mongoose
app.post('/createBike', ensureAuthenticated,  function(req, res){
                console.log("Brand: " +req.param('brand'));
                console.log("Model: " +req.param('model'));
                console.log("Year: " + req.param('year'));
				console.log("Bike Type: " + req.param('bikeType'));
                console.log("For user: " + req.user.id);
		console.log("Photo: " + req.files.photo.type);
		if(req.files.photo.name && req.files.photo.path){
		if(req.files.photo.type != 'image/jpeg'){
			res.redirect('/');
		}
		else{
		var photoName = req.files.photo.name;
		var newName = Math.floor(Math.random() * 100000) + Date.now().toString(36)+".JPG";
		fs.readFile(req.files.photo.path, function(err,data){
			var newPath = path.join(__dirname, imgDir, 'full', newName);
			var thumbPath = path.join(__dirname, imgDir, 'thumbs', newName);
			fs.exists(newPath, function(exists){
				while(exists){
					newName = Math.floor(Math.random() * 100000) + Date.now().toString(36) + ".JPG";
					newName = Math.floor(Math.random() * 100000) + Date.now().toString(36) + ".JPG";
					newPath = path.join(__dirname, imgDir, 'full', newName);
					thumbPath = path.join(__dirname, imgDir, 'thumbs', newName);
				}	
			});
			fs.writeFile(newPath, data, function(err){
				if(err) throw err;
				im.resize({
					srcPath: newPath,
					dstPath: thumbPath,
					//width: 200,
					height: 200
					},function(err, stdout, stderr){
						if(err) throw err;
						console.log("Resized to 100x100px");
						if(req.files.photo.name && req.files.photo.path){res.redirect('/')}
					});
				});
		});
		}
		}	
        new Bike({
                brand: req.param('brand'),
                model: req.param('model'),
                year: req.param('year'),
				type: req.param('bikeType'),
		gId:  req.user.id,
		img: newName,
		lastUpdated: Date.now()
        }).save(function(err){if (err) throw err;
		if(req.files.photo.name && req.files.photo.path){}
              	else{res.redirect('/');}
		
        });
});
 
//Still working on the maint rec portion
app.post('/saveMaintRec', ensureAuthenticated, function(req,res){
	if(req.param('recId')){
	MaintRec.update(
	{id:req.param('recId')},
	{comment: req.param('comment'), lastUpdated:Date.now()}
	,function(err,numAffected){
		if(err) throw err;
		res.redirect('/')
	});

	}
	else{
	console.log("Adding maint rec for Bike id: " + req.param('maint-bike-id'));
	console.log("Comment: " + req.param('maint-rec-comment'));
	new MaintRec({
		bike: req.param('maint-bike-id'),
		comment: req.param('maint-rec-comment'),
		lastUpdated: Date.now()
	}).save(function(err){if(err) throw err;
		res.redirect('/');
	});
	}
});

//For viewing image thumbs (no viewing of full image allowed)
app.get('/img/thumbs/:file',ensureAuthenticated, function(req,res){
        file = req.params.file;
        var img = fs.readFileSync(__dirname + imgDir + "/thumbs/" + file);
        res.writeHead(200, {'Content-Type' : 'img/jpg'});
        res.end(img,'binary');
});


//New method using Mongoose
//Finds record, checks to see if 'img' is set, removes images, deletes rec
app.post('/removeBike/:_id', ensureAuthenticated, function(req,res){
	Bike.findOne({_id:req.param('_id'),gId:req.user.id}
	,function(err,bikeDB){
	if(err) throw err;
        if(bikeDB.img){
                fs.unlink(path.join(__dirname, imgDir, 'full', bikeDB.img), function(err){
                        if(err) throw err;
                });
                fs.unlink(path.join(__dirname, imgDir, 'thumbs', bikeDB.img), function(err){
                        if (err) throw err;
                });
        }
	MaintRec.find({bike:req.param('_id')}).remove(function(err){if (err) throw err;});
	}).remove(function(err){if (err) throw err;
	res.redirect('/')
	});
});

app.post('/updateBike', ensureAuthenticated, function(req,res,next){
	if(req.param('uBrand') && req.param('uModel')){
	Bike.update(
	{
		_id:req.param('uId'),
		gId:req.user.id},
	{
		brand: req.param('uBrand'), 
		model: req.param('uModel'), 
		year: req.param('uYear'),
		type: req.param('uBikeType'),
		lastUpdated:Date.now()
	}
	,function(err,numAffected){
		if(err) throw err;
		else{
			console.log("Updating: " + req.param('uId'));
			console.log("Brand: " + req.param('uBrand'));
			console.log("Model: " + req.param('uModel'));
			console.log("Year: " + req.param('uYear'));
			console.log("Bike Type: " + req.param('uBikeType'));
		}
		res.redirect('/')
	});
	}
	else{
		console.log('Update requires model and brand!');
		res.redirect('/')
	}

});

app.get('/login', function(req, res){
  res.render('login', {title: 'BikeApp', host:config.host});
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
                                            "https://www.googleapis.com/auth/userinfo.email"] }),
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
  });


// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

/*
Old (possibly useful) code

//var DbHandler = require('./dbHandler.js').DbHandler;
//var dbHandler = new DbHandler('localhost',27017,{w:0});


Old method using dbHandler MongoDB driver
app.post('/removeBike/:_id',function(req,res){
        dbHandler.removeBike(req.param('_id'), function(error, docs){
                res.redirect('/')
        });
});

Old method using dbHandler
app.post('/createBike', function(req, res){
        dbHandler.saveNewBike({
                brand: req.param('brand'),
                model: req.param('model'),
                year: req.param('year')
                }, function(error, docs){
                        console.log("Brand: "+req.param('brand'));
                        console.log("Model: "+req.param('model'));
                        console.log("Year: "+req.param('year'));
                        res.redirect('/')
        });
});

app.get('/', function(req,res){
        dbHandler.getAllBikes(function(error, docs){
                res.render('index', {title: 'Bike app',
                        bikes:docs,
                        user:req.user
                });
        })
});

Old method using dbHandler
app.get('/getAllBikes', function(req, res){
        dbHandler.getAllBikes(function(error, docs){
         res.render('getAllBikes', { title: 'Show all bikes',
                        bikes:docs
                });
        })
});


*/
