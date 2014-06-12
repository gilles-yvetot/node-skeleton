
var sitemap = require('./sitemap.json');

var fs = require('fs');

var formidable = require('formidable');
var path = require('path');
var findit = require('findit');
var im = require('imagemagick');

function deleteFolderRecursive(path,fs) {
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


module.exports = {

	titleFilter : function(el){	if (el != 'subtitle' && el != 'order' && el != 'img')	return el;	},

	saveSitemap : function(sitemap){
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
				else{
					if(key!='subtitle' && key!='order'&& key!='img' && key!='path')
						arr.push(node[key]);
				}
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

	picturesPost : function(req, next){

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

	    	var newPath = __dirname + "/public/img/"+((path)?path+'/':'');
			//upload of new pictures
			if(files.length>0)
			{
				for (var i=0 ; i<files.length; i++){
					var obj={};
					for (var j=0 ; j<fields.length; j++){
						obj[fields[j][0]] = fields[j][1];
					}
					obj.fileName='w_'+files[i].name;
					// move from the temp folder to the appropriate folder
					fs.renameSync(files[i].path, newPath+'o_'+files[i].name);

					// creating the web-optimized image
					im.resize({
					  srcPath: newPath+'o_'+files[i].name,
					  dstPath: newPath+'w_'+files[i].name,
					  height:   1200
					}, function(err, stdout, stderr){
					  if (err) throw err;
					});
					// creating the thumbnail version
					im.resize({
					  srcPath: newPath+'o_'+files[i].name,
					  dstPath: newPath+'t_'+files[i].name,
					  width:   200
					}, function(err, stdout, stderr){
					  if (err) throw err;
					});
					var folder = sitemap;
					if(path)
						folder = eval('sitemap.'+path.replace('/','.'));
					if(!Array.isArray(folder.img))
						folder.img = [];
					folder.img.push(obj);
				}

			}
			//update fields
			else{
				var obj={};
				for (var j=0 ; j<fields.length; j++){
					obj[fields[j][0]] = fields[j][1];
				}
				obj['fileName']= 'w_'+obj['fileName'];
				// if the fileName is updated
				if (obj['fileName']!=obj['oldFileName'])
				{
					//rename the pictures
					fs.renameSync(newPath+obj['oldFileName'],
								  newPath+obj['fileName']);
					fs.renameSync(newPath+obj['oldFileName'].replace('w_','o_'),
								  newPath+obj['fileName']);
					fs.renameSync(newPath+obj['oldFileName'].replace('w_','t_'),
								  newPath+obj['fileName']);
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
			//sort img by order
			var folder = sitemap;
			if(path)
				folder = eval('sitemap.'+path.replace('/','.'));
			folder.img.sort(function(a,b) { return parseFloat(a.order) - parseFloat(b.order) } );


			// we save the modified sitemap
			if (JSON.stringify(sitemap)!=''){
				fs.writeFileSync('sitemap.json', JSON.stringify(sitemap));
			}
	    });
	    form.parse(req);

		next(null);
	},

	foldersPost : function(req,next){

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
					obj[fields.name]['path']='img/'+path.replace('.','/')+fields.name+'/';
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
					fs.unlinkSync(__dirname+'/public/img/'+path+imgFileName);
					fs.unlinkSync(__dirname+'/public/img/'+path+imgFileName.replace('w_','o_'));
					fs.unlinkSync(__dirname+'/public/img/'+path+imgFileName.replace('w_','t_'));
					res.send({
				      retStatus : 200,
				      redirectTo: '/admin'
				    });
			    }
			});
		}
		
	},


	deleteFolder : function(folderName,path,res){

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
					deleteFolderRecursive(__dirname+'/public/img/'+path+'/'+folderName+'/',fs);
					res.send({
				      retStatus : 200,
				      redirectTo: '/admin'
				    });
			    }
			});
		}
		
	}

}