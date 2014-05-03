
module.exports = function(app) {

	var path = require('path');
	var core = require('./core.js');
	var sitemap = require('./sitemap.json');

	/*==========================
	    Routes: GET
	==========================*/


	// HOME ====================================================================
	app.get('/', function(req, res){
		res.render('home.jade', {
			title: 'Home',
		});
	});

	// SITEMAP =================================================================
	app.get('/sitemap', function(req, res){
		res.json(sitemap);
	});

	// CONTACT =================================================================
	app.get('/contact', function(req, res){
		res.render('contact.jade', {
			title: 'Contact',
		});
	});
	// PICTURES ===============================================================
	app.get('/pictures', function(req, res){
		
		var path = Object.keys(req.body)[0];
		// TODO: insert a regex to prevent injection here (eval) (think about the case when there is nothing)
		core.getImages(path, function(err,data){
			if (err)
				res.writeHead(500, err.message).send();
 			else
 				res.json(data);
		});
		
	});
	// RESTRICTED & LOGIN ======================================================

	app.get('/restricted', restrict, function(req, res){
	  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
	});

	app.get('/logout', function(req, res){
	  // destroy the user's session to log them out
	  // will be re-created next request
	  req.session.destroy(function(){
	    res.redirect('/');
	  });
	});

	app.get('/login', function(req, res){
	  res.render('login.jade', {
			title: 'Login',
		});
	});

	app.get('/admin', restrict,function(req, res){
	  res.render('admin.jade', {
			title: 'Manage your content',
		});
	});
	
	

	app.get('/admin_folders', restrict,function(req, res){
		var folderName = Object.keys(req.query)[0];
		// we are getting the content of the folder forward
		if(req.query[folderName]=='true'){
			core.getContentFolder(folderName,function(err,arr){
				if(err){
					console.log(err);
					res.send('error while retrieving folder content');
					res.end();
				}
				else
				{
					res.json(arr);
				}
			});
		}
		else{
			core.getParentFolder(folderName,function(err,arr){
				if(err){
					console.log(err);
					res.send('error while retrieving folder content');
					res.end();
				}
				else
				{
					res.json(arr);
				}
			});
		}
			
	});


	/*==========================
	    Routes: POST
	==========================*/

	// PICTURES ===============================================================
	app.post('/pictures',function(req,res){
		core.picturesPost(req,res);
	});

	// LOGIN ==================================================================
	app.post('/login', function(req, res){
	  require('./pass').authenticate(req.body.username, req.body.password, function(err, user){
	    if (user) {
	      // Regenerate session when signing in to prevent fixation
	      req.session.regenerate(function(){
	        // Store the user's primary key
	        // in the session store to be retrieved,
	        // or in this case the entire user object
	        req.session.user = user;
	        req.session.success = 'Authenticated as ' + user.name
	          + ' click to <a href="/logout">logout</a>. '
	          + ' You may now access <a href="/restricted">/restricted</a>.';
	        res.redirect('admin');
	      });
	    } else {
	      console.log(err);
	      req.session.error = 'Authentication failed, please check your '
	        + ' username and password.'
	        + ' (use "user1" and "password")';
	      res.redirect('login');
	    }
	  });
	});

	/*==========================
		REALTED TO ROUTES
	==========================*/

	function restrict(req, res, next) {
	  if (req.session.user) {
	    next();
	  } else {
	    req.session.error = 'Access denied!';
	    res.redirect('/login');
	  }
	}
	 
};