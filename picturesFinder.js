var array = [];
var find = require('findit')('./public/img/');
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