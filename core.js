module.exports =
{
	getImages : function(folder_name){
		var sitemap = require('./sitemap.json');
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