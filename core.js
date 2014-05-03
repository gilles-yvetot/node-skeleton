


module.exports =
{
	titleFilter :function(el){	if (el != 'subtitle' && el != 'order')	return el;	},

	getImages : function(path,next){
		var sitemap = require('./sitemap.json');
		var find = require('findit')('./public/img/');
		var path = require('path');

		var array = [];

		find.on('file', function(file) {
		  if (path.extname(file) === '.png' 
		  	|| path.extname(file) === '.gif' 
		  	|| path.extname(file) === '.jpg') {
		    	array.push(file)  }
		});
		find.on('end', function(){
			next(null,array)
		});
	},
	// kind of breadth search algorithm function
	getParentFolder : function (name,next){
		var arr=[], returnValue=null, found=false, parentName='root';
		var tree = require('./sitemap.json');
		arr.push(tree);
		var retArr=[];
		if (name in tree){
			retArr.push('Your Website');
			retArr = retArr.concat(Object.keys(tree).filter(this.titleFilter));
		}
		else{
			while(arr.length >0 && found==false)
			{
				var node = arr[0];
				arr.shift();
				Object.keys(node).forEach(function(key){
					if((key!='subtitle' && key!='order') &&(name in node[key]))
					{
						found=true;
						retArr.push(key);
						//workaround here because does not to return the value directly
						retArr = retArr.concat(Object.keys(node[key]));
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
		var arr =[];
		var sitemap = require('./sitemap.json');
		if (name == 'root')
		{
			arr.push('Your Website');
			Object.keys(sitemap).forEach(function(value) {
			  arr.push(value);
			});
		}
		else
		{	
			arr.push(name);
			var a = this.breadthSearch(sitemap,name);
			if (!a) next('error breadthSearch');
			arr = arr.concat(a);
		}
		if (arr.length >0)
		{
			next(null,arr);
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
					returnValue= Object.keys(node[key]);
				}
				else{
					if(key!='subtitle' && key!='order')
						arr.push(node[key]);
				}
			});
		}
		if (found)
			return returnValue;
		else 
			return 0;
	},

	picturesPost : function(req,res){

		var formidable = require('formidable');
		var util = require('util');
		var fs = require('fs');

		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) {
			var newPath = __dirname + "/public/img/"+files.displayImage.name;
			if(files.displayImage.name)
				fs.rename(files.displayImage.path, newPath, function (err) {
				  	if (err) throw err;
					res.writeHead(200);
					res.end('Upload complete');
				});
			else
				res.send('Upload failed');
		});
	}

}