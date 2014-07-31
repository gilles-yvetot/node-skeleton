
module.exports = function(app) {

	var path = require('path');
	var core = require('./core.js');
	var sitemap = require('./sitemap.json');
	var url = require('url');
	var navData = core.getNavData();

	/*==========================
	    Routes: GET
	==========================*/

	// HOME ====================================================================
	app.get('/', function(req, res){
		res.render('home.jade', {
			title: 'Juan Montero Photography',
			personal: navData,
		});
	});
	// CONTACT =================================================================
	app.get('/contact', function(req, res){
		res.render('contact.jade', {
			title: 'Contact',
			personal: navData,
			mail: req.query.mail
		});
	});
	// PERSONAL =================================================================
	app.get('/personal/:subpart/:subpart2?', function(req, res){
		
		var pixIdx = (req.params.subpart2 && parseInt(req.params.subpart2))?parseInt(req.params.subpart2):null;

		core.getContentFolder(req.params.subpart, function(err,content){
			if(err){
				res.render('personal.jade', {
					personal: navData,
					title: 'Personal',
					error: err
				});
			}
			else{
				res.render('personal.jade', {
					personal: navData,
					title: (req.params.subpart)?req.params.subpart+' - Personal':'Personal',
					data: content.tree,
					pix: pixIdx,
				});
			}
		});
		
	});
	// PHOTOGRAPHY ==============================================================
	app.get('/photography/:subpart?', function(req, res){
		var query = url.parse(req.url, true).query;
		// TODO, once we will have pictures in photofraphr, we will replace 'personal' by 'photography'
		var lookFor = (req.params.subpart)?req.params.subpart:'personal';
		core.getContentFolder(lookFor,function(err,content){
			if(err){
				res.render('photography.jade', {
					personal: navData,
					title: 'Photography',
					error: err
				});
			}
			else{
				res.render('photography.jade', {
					personal: navData,
					title: 'Photography',
					data: content.tree,
					pix: query.pix
				});
			}
		});
	});
	// PDF ======================================================================
	app.get('/pdf/', function(req, res){
		res.render('pdf.jade', {
			title: 'PDF',
			personal: navData,
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
	// FOLDERS ===============================================================
	app.get('/folders', restrict,function(req, res){
		var path = Object.keys(req.query)[0];
		if(path){
			var next = function(err,obj){
				if(err){res.send('error while retrieving folder content');res.end();}
				else res.json(obj);
			};
			if(req.query[path] && req.query[path] =='true')
				core.getContentFolder(path,next);
			else 
				core.getParentFolder(path,next);

		}
			
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
			personal: navData,
		});
	});

	app.get('/admin', restrict,function(req, res){
		core.getContentFolder('root',function(err,obj){
			if (err){
				res.send('error while retrieving folder content');
				res.end();
			}
			else{
				res.render('admin.jade', {
					title: 'Manage your content',
					personal: navData,
					data: obj.tree
				});
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
	        res.redirect('/admin');
	      });
	    } else {
	      console.log(err);
	      req.session.error = 'Authentication failed, please check your '
	        + ' username and password.'
	        + ' (use "user1" and "password")';
	      res.redirect('/login');
	    }
	  });
	});
	// CONTACT ================================================================
	app.post('/contact', function(req,res){
		core.sendEmailFromForm(req.body,res);
	});	

	/*==========================
	    Routes: DELETE
	==========================*/
	// FOLDERS ===============================================================
	app.delete('/folders', restrict,function(req,res){
		var fol2delete =req.body.arr[0]; 
		var path =req.body.arr[1]; 
		if (fol2delete){
			core.deleteFolder(fol2delete,res);
		}
		else
			res.send({
		      retStatus : 500,
		      redirectTo: '/admin',
		      msg: 'folder to delete'
		    });
	});
	app.delete('/pictures', restrict,function(req,res){
		var img2delete =req.body.arr[0]; 
		var path =req.body.arr[1]; 
		if (img2delete){
			core.deletePicture(img2delete,path,res);
		}
		else
			res.send({
		      retStatus : 500,
		      redirectTo: '/admin',
		      msg: 'image-to-delete is null'
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