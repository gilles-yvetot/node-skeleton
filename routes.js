
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
			title: 'Juan Montero Photography',
		});
	});
	// CONTACT =================================================================
	app.get('/contact', function(req, res){
		res.render('contact.jade', {
			title: 'Contact',
		});
	});
	// PERSONAL =================================================================
	app.get('/personal', function(req, res){
		res.render('personal.jade', {
			title: 'Personal',
		});
	});
	// PHOTOGRAPHY ==============================================================
	app.get('/photography', function(req, res){
		res.render('photography.jade', {
			title: 'Photography',
		});
	});
	// PDF ======================================================================
	app.get('/pdf', function(req, res){
		res.render('pdf.jade', {
			title: 'PDF',
		});
	});


	// SITEMAP =================================================================
	app.get('/sitemap', function(req, res){
		res.json(sitemap);
	});

	// PICTURES ===============================================================
	app.get('/pictures', function(req, res){
		// TODO: insert a regex to prevent injection here (eval) (think about the case when there is nothing)
		core.getImages(req.query.folderName, function(err,data){
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
	
	// FOLDERS ===============================================================
	app.get('/folders', restrict,function(req, res){
		
		var path = Object.keys(req.query)[0];
		core.getContentFolder(path,function(err,obj){
				if(err){
					console.log(err);
					res.send('error while retrieving folder content');
					res.end();
				}
				else
				{
					res.json(obj);
				}
		});
			
	});


	/*==========================
	    Routes: POST
	==========================*/

	// FOLDERS ===============================================================
	app.post('/folders', restrict,function(req,res){
		core.foldersPost(req,function(err){
			if(err)
				res.send(err);
			else
				res.redirect('back');
		});
	});
	
	// PICTURES ===============================================================
	app.post('/pictures', restrict,function(req,res){
		core.picturesPost(req,function(err){
			if(err)
				res.send(err);
			else
				res.redirect('back');
		});
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
	    Routes: DELETE
	==========================*/
	// FOLDERS ===============================================================
	app.delete('/folders', restrict,function(req,res){
		var fol2delete =req.body.arr[0]; 
		var path =req.body.arr[1]; 
		if (fol2delete && path){
			core.deleteFolder(fol2delete,path,res);
		}
		else
			res.send({
		      retStatus : 500,
		      redirectTo: '/admin',
		      msg: 'folder to delete or path is null'
		    });
	});
	app.delete('/pictures', restrict,function(req,res){
		var img2delete =req.body.arr[0]; 
		var path =req.body.arr[1]; 
		if (img2delete && path){
			core.deletePicture(img2delete,path,res);
		}
		else
			res.send({
		      retStatus : 500,
		      redirectTo: '/admin',
		      msg: 'image-to-delete or path is null'
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