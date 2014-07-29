
var sitemap = require('./sitemap.json');

var fs = require('fs');

var formidable = require('formidable');
var path = require('path');
var findit = require('findit');
var im = require('imagemagick');

function deleteFolderRecursive(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}


module.exports = {

	titleFilter : function(el){	if (el != 'subtitle' && el != 'order' && el != 'img')	return el;	},

	saveSitemap : function(next){
		// we save the modified sitemap
		if (JSON.stringify(sitemap)!=''){
			fs.writeFile('sitemap.json', JSON.stringify(sitemap), function(err) {
			    if(err) {
			        next(err);
			    } else {
			    	//sitemap=require('./sitemap.json');
			        next(null);
			    }
			});
		}
	},

	getPath : function(name, next){
		var finder = findit(__dirname + "/public/img/");
		finder.on('directory', function (dir, stat, stop) {
		    if(path.basename(dir) == name ){
		    	stop();
		    	next(dir);
		    }
		});
	},

	sendEmailFromForm : function(data,res){
		if (data.email && data.message){
			var message = ((data.name)?data.name+'<br/>':'') 
						+ ((data.phone)?data.phone+'<br/>':'') 
						+ data.email+'<br/>'
						+ ((data.address)?data.address+'<br/>':'') 
						+ '<br/>'+data.message,
			obj = ((data.name)?data.name:'Someone')+" sent a message from your website";
			var mail = require("nodemailer").mail;
			mail({
			    from: "contact@jdmontero.com", // sender address
			    to: "g.yvetot@gmail.com", // list of receivers
			    subject: obj, // Subject line
			    html: message // html body
			});
		    res.redirect('/contact?mail=sent');
		}
	},

	getNavData : function(){
		if(sitemap && (sitemap['personal'] || sitemap['Personal'])){
			var arr =[];
			if (sitemap['personal'])
				arr= Object.keys(sitemap['personal']);
			else if (sitemap['Personal'])
				arr= Object.keys(sitemap['Personal']);

			arr= arr.filter(function(el){
				return (el!='path' && el!='img' && el!='subtitle' && el!='order');
			});
			return arr;
		}
	},

	breadthSearch : function(tree,name){
		var arr=[], returnValue=null,found=false;
		arr.push(tree);
		while(arr.length >0 && found==false)
		{
			var node = arr[0];
			arr.shift();
			Object.keys(node).forEach(function(key){
				if(key==name)
				{
					found=true;
					//workaround here because does not to return the value directly
					returnValue= node[key];
				}
				else if (typeof node[key] == 'object')
						arr.push(node[key]);
			});
		}
		if (found)
			return returnValue;
		else 
			return 0;
	},

	getImages : function(folderName,next){
		var obj=null;

		if(folderName=='' || folderName=='/' || folderName =='root'){
			obj = sitemap;
		}
		else {
			obj= this.breadthSearch(sitemap,folderName);
		}
		if(obj)
			next(null,obj);
		else
			next("Cannot find "+folderName,null);

	},

	// kind of breadth search algorithm function
	getParentFolder : function (name,next){
		if(name !='root')
			name = name.slice(name.lastIndexOf('/')+1);
		var arr=[], returnValue=null, found=false, parentName='root';
		var tree = sitemap;
		arr.push(tree);
		var retArr={};
		if (name in tree){
			retArr.title= 'Your Website';
			retArr.tree = tree;
		}
		else{
			while(arr.length >0 && found==false)
			{
				var node = arr[0];
				arr.shift();
				if( (typeof node == "object") && (node !== null) )
					Object.keys(node).forEach(function(key){
						if((key!='subtitle' && key!='order' && key!='img' && key!='path') &&(name in node[key]))
						{
							found=true;
							retArr.title=key;
							//workaround here because does not to return the value directly
							retArr.tree= node[key];
						}
						else{
							arr.push(node[key]);
						}
					});
			}
		}
		next(null,retArr);
	},

	getContentFolder : function(name, next){
		var obj ={};
		if (name=='' || name == 'root')
		{
			obj.title = 'Your Website';
			obj.tree = sitemap
		}
		else
		{	
			obj.title = name.slice(name.lastIndexOf('/')+1);
			obj.tree = this.breadthSearch(sitemap,obj.title);
		}
		if (Object.keys(obj).length >0)
		{
			next(null,obj);
		}
			
	},

	picturesPost : function(req, next){

		var form = new formidable.IncomingForm(), files= [], fields= {};
		var core = this;
		form
		  .on('field', function(field, value) {   fields[field] = value; })
		  .on('file',  function(field, file) {    files.push(file);   })
  		  .on('end', function() {

  		  	var folder = sitemap;
  		  	if (!fields.path) // if the path is not set, we need to specify the root (img folder) and the foler is the sitemap
  		  		fields.path= 'img';	
  		  	else 			  // else we have to get the information of the folder which contains the subfolder
  		  		folder = core.breadthSearch(sitemap, fields.path)

			core.getPath(fields.path,function(dir){
				
				//upload of new picture(s)
				if(files.length>0 && files[0].name)
				{
					var pix =[];
					for (var i=0 ; i<files.length; i++){
						var obj={};
						obj['subtitle'] = fields.subtitle;		obj['order'] = fields.order;
						obj['name'] = fields.name;				obj.fileName='w_'+files[i].name;
						
						// move from the temp folder to the appropriate folder
						fs.renameSync(files[i].path, dir+'/o_'+files[i].name);

						// creating the web-optimized image
						im.resize({
						  srcPath: dir+'/o_'+files[i].name,   dstPath: dir+'/w_'+files[i].name, width:   1200
						  }, function(err, stdout, stderr){	  if (err) throw err;	});
						// creating the thumbnail version
						im.resize({
						  srcPath: dir+'/o_'+files[i].name,	  dstPath: dir+'/t_'+files[i].name, width:   200
						}, function(err, stdout, stderr){	  if (err) throw err;	});
						pix.push(obj)
					}// for	
					// add the array of pictures and save the sitemap
					if(!Array.isArray(folder.img))
						folder.img = [];
					folder.img = folder.img.concat(pix);
				}
				//update fields (there is no new file)rs
				else{
					var obj={};
					obj['subtitle'] = fields.subtitle;
					obj['order'] = fields.order;
					obj['name'] = fields.name;
					obj['fileName']= 'w_'+fields.fileName;
					// if the fileName is updated rename the pictures
					if (fields.fileName!=fields.oldFileName)
					{
						fs.renameSync(dir+'/w_'+fields.oldFileName,	 dir+'/w_'+fields.fileName);
						fs.renameSync(dir+'/o_'+fields.oldFileName,  dir+'/o_'+fields.fileName);
						fs.renameSync(dir+'/t_'+fields.oldFileName,  dir+'/t_'+fields.fileName);
					}
					//update the sitemap
					var index=-1;
					for(var i=0;i<folder.img.length ; i++){
						if(folder.img[i].fileName==fields.oldFileName)
							index=i;
					}
					folder.img.splice(index,1);
					folder.img.push(obj);
				}
				folder.img.sort(function(a,b) { return parseFloat(a.order) - parseFloat(b.order) } );

				core.saveSitemap(next);
			});// get path
	    }); // on ends
		form.parse(req);
	},

	foldersPost : function(req,next){

		var form = new formidable.IncomingForm();
		var core = this;
		form.parse(req, function(err, fields, files) {
			// if we perform a modification about a folder
			if (Object.keys(fields).length >0 && fields.name)
			{
				var path='',obj={};
				if(fields.path){
					path = fields.path;
					obj = core.breadthSearch(sitemap,path);
				}
				else {
					obj=sitemap;
					path= 'img';
				}
				// in that case, we are modifying a folder because we have an old name
				if(fields.oldName){
					// if the name has changed, we need to copy the object and then 
					if (fields.name != fields.oldName){
						//copy the object (we do that for the images)
						obj[fields.name] = obj[fields.oldName]
						obj[fields.name]['subtitle'] = fields.subtitle;
						obj[fields.name]['order'] = fields.order;
						obj[fields.name]['path'] = obj[fields.oldName].replace(fields.oldName,fields.name);
						//delete the old one
						delete obj[fields.oldName]
						core.getPath(fields.oldName, function(pathToFolder){
							// change folder name
							fs.rename(pathToFolder,
							 		  pathToFolder.substring(0,pathToFolder.indexOf(fields.oldName))+'/'+ fields.name+'/' ,
							 		  function (err) {  core.saveSitemap(next); });
						});
					}
					else{
						// if the name hasn't changed, we just update the subtitle and order
						obj[fields.name]['subtitle'] = fields.subtitle;
						obj[fields.name]['order'] = fields.order;
						core.saveSitemap(next);
					}

				}
				// in that case, we are creating a folder
				else{
					core.getPath(path, function(pathToFolder){
						fs.mkdirSync(pathToFolder+'/'+fields.name+'/');
						if(!err){
							obj[fields.name] = {};
							obj[fields.name]['img']=[];
							obj[fields.name]['subtitle'] = fields.subtitle;
							obj[fields.name]['order'] = fields.order;
							obj[fields.name]['path']=pathToFolder.substring(pathToFolder.indexOf('/img/')+fields.name+'/');
							core.saveSitemap(next);
						}
					});
				}
			} // if(Object.keys...
		}); // form.parse
	},







	deletePicture : function(imgFileName,path,res){



		var obj = sitemap;
		var core = this;
		if(path)
			obj = core.breadthSearch(sitemap, path)
		else path = 'img'
		// delete the img from the sitemap
		var index=-1;
		for (var i=0; i<obj.img.length; i++)
		{
			if(obj.img[i].fileName == imgFileName)
				index=i;
		}
		obj.img.splice(index,1);

		core.saveSitemap(function(){
			core.getPath(path,function(dir){
				if (dir.slice(-1)!='/')dir+='/'
				fs.unlinkSync(dir+imgFileName);
				fs.unlinkSync(dir+imgFileName.replace('w_','o_'));
				fs.unlinkSync(dir+imgFileName.replace('w_','t_'));
				res.send({
			      retStatus : 200,
			      redirectTo: '/admin'
			    });
			});
		});
	},


	deleteFolder : function(folderName,res){
		var core = this;
		this.getParentFolder(folderName,function(err,obj){
			if(!err){
				delete obj.tree[folderName];
				core.saveSitemap(function(err){
					if(err) {
				        res.send({
					      retStatus : 500,
					      redirectTo: '/admin',
					      msg: 'error while trying to save the new sitemap'
					    });
				    } else {
				    	core.getPath(folderName, function(path){
				    		//remove the folder
							deleteFolderRecursive(path+'/');
							res.send({
						      retStatus : 200,
						      redirectTo: '/admin'
						    });
				    	});
				    }
				});
			}
		});	
	}

}