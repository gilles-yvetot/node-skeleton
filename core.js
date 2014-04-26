var array = [];
var find = require('findit');
var path = require('path');

find.on('file', function(file) {
  if (path.extname(file) === '.png' 
  	|| path.extname(file) === '.gif' 
  	|| path.extname(file) === '.jpg') {
    	array.push(file)  }
});

find.on('end', function() {
  console.log(array);
});

module.exports =
{
	getImages : function(folder_name){
		var sitemap = require('./sitemap.json');
		// the goal here is to walk through my image folder to figure out 
		// which pictures are inside, thanks to the function find('directory'). 
		//The current solution is to get this information from an updated json
		var obj2return = this.breadth_search(sitemap,folder_name);
		return obj2return;
	},

	breadth_search : function(tree,name){
		var arr= [], found = false;
		arr.push(tree);

		while(arr.length >0 && found != true)
		{
			var obj = arr[0];
			for (var prop in obj){
				if(found != true){
					if(prop == name)
						found=true;
					arr.push(obj[prop]);
				}
			}
			arr.slice(0,1);
		}

		if (arr.length>0)
			return arr[arr.length -1];
		else
			return 0;
	}

}