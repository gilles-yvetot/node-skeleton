
module.exports =
{
	titleFilter :function(el){	if (el != 'subtitle' && el != 'order' && el != 'img')	return el;	},

	saveSitemap : function(sitemap){
		// we save the modified sitemap
		if (JSON.stringify(sitemap)!=''){
			require('fs').writeFile('sitemap.json', JSON.stringify(sitemap), function(err) {
			    if(err) {
			        next(err);
			    } else {
			        next(null);
			    }
			});
		}
	},

	breadthSearch : function(tree,name){
		var arr=[], returnValue=null,found=false;;
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
				else{
					if(key!='subtitle' && key!='order'&& key!='img')
						arr.push(node[key]);
				}
			});
		}
		if (found)
			return returnValue;
		else 
			return 0;
	},

	// getImages : function(folderName,next){
	// 	var findit = require('findit')
	// 	var path = require('path');
	// 	var arr = [];
	// 	var find=null;
	// 	if (folderName='Your Website') folderName='';
		
	// 	find=findit('./public/img/');

	// 	find.on('file', function(file) {
	// 	  if ( (path.extname(file) === '.png' || path.extname(file) === '.gif' || path.extname(file) === '.jpg')
	// 	  	&& (path.dirname(file).indexOf(folderName) > -1) ){
	// 	    	arr.push(file);
	// 	  }
	// 	});
	// 	find.on('directory', function (dir, stat, stop) {
	// 	    if(!(path.basename(dir)=='img' || folderName==''))
	// 	    	stop();
	// 	});
	// 	find.on('end', function(){
	// 		console.log('\n');
	// 		next(null,arr)
	// 	});
	// },

	getImages : function(folderName,next){
		var sitemap = require('./sitemap.json');
		var obj=null;
		if(folderName=='' || folderName=='/' || folderName =='root'){
			obj = sitemap;
		}
		else {
			obj= this.breadthSearch(sitemap,folderName);
		}
		if(Array.isArray(obj.img))
			next(null,obj.img);
		else
			next("Cannot find "+folderName,null);

	},

	// kind of breadth search algorithm function
	getParentFolder : function (name,next){
		if(name !='root')
			name = name.slice(name.lastIndexOf('/')+1);
		var arr=[], returnValue=null, found=false, parentName='root';
		var tree = require('./sitemap.json');
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
				Object.keys(node).forEach(function(key){
					if((key!='subtitle' && key!='order' && key!='img') &&(name in node[key]))
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
		var sitemap = require('./sitemap.json');
		if (name == 'root')
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

	picturesPost: function(req, next){
		var fs = require('fs');
		var formidable = require('formidable');
		var sitemap = require('./sitemap.json');

		var path='';
		var form = new formidable.IncomingForm();
	    var files = [], fields = [];
	    form.on('field', function(field, value) {
	        if(field && field!='path')
	        	fields.push([field, value]);
	        else if(field=='path'){
	        	path= value;
	        }	
	    })
	    form.on('file', function(field, file) {
	        files.push(file);
	    })


	    form.on('end', function() {
			if(path)
					path = path.slice(5);
			if(files.length>0)
			{
				for (var i=0 ; i<files.length; i++){
					var obj={};
					for (var j=0 ; j<fields.length; j++){
						obj[fields[j][0]] = fields[j][1];
					}
					obj.fileName=files[i].name;
					var tmp= (path)?path+'/':'';
					var newPath = __dirname + "/public/img/"+tmp+files[i].name;
					fs.renameSync(files[i].path, newPath);

					var folder = sitemap;
					if(path)
						folder = eval('sitemap.'+path.replace('/','.'));
					if(!Array.isArray(folder.img))
						folder.img = [];
					folder.img.push(obj);
				}
			}
			else{
				var obj={};
				for (var j=0 ; j<fields.length; j++){
					obj[fields[j][0]] = fields[j][1];
				}
				// if the fileName is updated
				if (obj['fileName']!=obj['oldFileName'])
				{
					//rename the pictures
					var tmp= (path)?path+'/':'';
					fs.renameSync(__dirname + "/public/img/"+tmp+obj['oldFileName'],
								  __dirname + "/public/img/"+tmp+obj['fileName']);
				}
				//update the sitemap
				var folder = sitemap;
				if(path)
					folder = eval('sitemap.'+path.replace('/','.'));
				var index=-1;
				for(var i=0;i<folder.img.length ; i++){
					if(folder.img[i].fileName==obj['oldFileName'])
						index=i;
				}
				folder.img.splice(index,1);
				delete obj['oldFileName'];
				folder.img.push(obj);
			}

			// we save the modified sitemap
			if (JSON.stringify(sitemap)!=''){
				fs.writeFileSync('sitemap.json', JSON.stringify(sitemap));
			}
	    });
	    form.parse(req);

		next(null);
	},

	foldersPost : function(req,next){
		var formidable = require('formidable');
		var fs = require('fs');
		var sitemap = require('./sitemap.json');

		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) {
			// if we perform a modification about a folder
			if (Object.keys(fields).length >0)
			{
				var path='';
				if(fields.path){
					path = fields.path;
					path = path.slice(5);
					path = path.replace('/','.');
				}
				var obj=sitemap;
				if(path)
					obj = eval('sitemap.'+path);
				// in that case, we are modifying a folder because we have an old name
				if(fields.oldName){
					// if the name has changed, we need to copy the object and then 
					if (fields.name != fields.oldName){ 
						//copy the object (we do that for the images)
						obj[fields.name] = obj[fields.oldName]
						obj[fields.name]['subtitle'] = fields.subtitle;
						obj[fields.name]['order'] = fields.order;
						//delete the old one
						delete obj[fields.oldName]
						// change folder name
						fs.rename(__dirname+'/public/img/'+path.replace('.','/')+'/'+fields.oldName+'/',
						 		  __dirname+'/public/img/'+path.replace('.','/')+'/'+fields.name+'/',
						 		  function (err) {  if (err) next(err); });
					}
					// if the name hasn't changed, we just update the subtitle and order
					else{
						obj[fields.name]['subtitle'] = fields.subtitle;
						obj[fields.name]['order'] = fields.order;
					}
				}
				// in that case, we are creating a folder
				else{
					fs.mkdirSync(__dirname+'/public/img/'+path.replace('.','/')+'/'+fields.name+'/');
					obj[fields.name] = {};
					obj[fields.name]['img']=[];
					obj[fields.name]['subtitle'] = fields.subtitle;
					obj[fields.name]['order'] = fields.order;
				}
				// we save the modified sitemap
				if (JSON.stringify(sitemap)!=''){
						fs.writeFile('sitemap.json', JSON.stringify(sitemap), function(err) {
					    if(err) {
					        next(err);
					    } else {
					        next(null);
					    }
					});
				}
			}
			
		});
	},

	deletePicture : function(imgFileName,path,res){

		var sitemap = require('./sitemap.json');
		var fs = require('fs');
		path = path.slice(5);
		var obj = sitemap;
		if(path)
			obj = eval('sitemap.'+path.replace('/','.'));
		// delete the img from the sitemap
		var index=-1;
		for (var i=0; i<obj.img.length; i++)
		{
			if(obj.img[i].fileName == imgFileName)
				index=i;
		}
		obj.img.splice(index,1);


		//save the updated sitemap
		if (JSON.stringify(sitemap)!=''){
			fs.writeFile('sitemap.json', JSON.stringify(sitemap), function(err) {
			    if(err) {
			        res.send({
				      retStatus : 500,
				      redirectTo: '/admin',
				      msg: 'error while trying to save the new sitemap'
				    });
			    } else {
			        //remove the picture
			        if(path)
			        	path+='/';
			        console.log(__dirname+'/public/img/'+path+imgFileName);
					fs.unlink(__dirname+'/public/img/'+path+imgFileName);
					res.send({
				      retStatus : 200,
				      redirectTo: '/admin'
				    });
			    }
			});
		}
		
	},

	deleteFolder : function(folderName,path,res){

		var sitemap = require('./sitemap.json');
		var fs = require('fs');
		path = path.slice(5);
		var obj = sitemap;
		if(path)
			obj = eval('sitemap.'+path.replace('/','.'));
		// delete the property from the sitemap
		delete obj[folderName];
		//save the updated sitemap
		if (JSON.stringify(sitemap)!=''){
			fs.writeFile('sitemap.json', JSON.stringify(sitemap), function(err) {
			    if(err) {
			        res.send({
				      retStatus : 500,
				      redirectTo: '/admin',
				      msg: 'error while trying to save the new sitemap'
				    });
			    } else {
			        //remove the folder
					this.deleteFolderRecursive(__dirname+'/public/img/'+path+'/'+folderName+'/',fs);
					res.send({
				      retStatus : 200,
				      redirectTo: '/admin'
				    });
			    }
			});
		}
		
	},


	deleteFolderRecursive : function(path,fs) {
	    var files = [];
	    if( fs.existsSync(path) ) {
	        files = fs.readdirSync(path);
	        files.forEach(function(file,index){
	            var curPath = path + "/" + file;
	            if(fs.lstatSync(curPath).isDirectory()) { // recurse
	                this.deleteFolderRecursive(curPath,fs);
	            } else { // delete file
	                fs.unlinkSync(curPath);
	            }
	        });
	        fs.rmdirSync(path);
	    }
	}

}


