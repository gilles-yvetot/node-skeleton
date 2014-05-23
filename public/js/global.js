
window.onload =window_load;
$( window ).resize(window_resize);

// full screen related functions and listeners
function toogleFSicons(){
 	$('body > footer > #fullscreen > i').toggleClass('fa-arrows-alt');
	$('body > footer > #fullscreen > i').toggleClass('fa-times-circle-o');
 }
document.addEventListener("fullscreenchange", toogleFSicons, false);
document.addEventListener("mozfullscreenchange", toogleFSicons, false);
document.addEventListener("webkitfullscreenchange", toogleFSicons, false);
document.addEventListener("msfullscreenchange", toogleFSicons, false);

function window_resize(){
}
function window_load(){
	window_resize();
	populateNav();
	var a = document.getElementById('dynamicAdminContent');
	if(a)
	{
		getFolders('root',true);
	}
	else
	{
		getPictures('root');
	}
}
/*
	Absolutely put these function in the admin page only=====================================================
*/
function getFolders(folderName, forward){
		var path = $('#dynamicAdminContent #path')[0];
		$('#content > #dynamicAdminContent form').html('');
		if (forward){
			if(folderName !='root')
				path.value = path.value + '/'+folderName;
			else
				path.value = 'root';
		}
		else{
			path.value = path.value.slice(0,path.value.lastIndexOf('/'));
		}
		folderName = path.value;
		var dataForAjax ={};	dataForAjax[folderName]=forward;
		$.ajax({
			  type: "GET",
			  url: '/folders',
			  data: dataForAjax,
			  success: function(data){
			  	renderFolders(data);
			  	renderImgInAdmin(data);
			  }
			});

}

function insertInput(oldName,oldOrder,oldSubtitle,oldFileName,action){
	var container = $('#content > #dynamicAdminContent > #foldersRight > form')[0];
	//empty the form first
	$(container).html('');

	//creating inputs
	var name = document.createElement("input"); name.type = 'text';
	var subtitle = name.cloneNode(true), order = name.cloneNode(true);
	name.name ='name'; name.value =oldName; name.placeholder='Name';
	order.name ='order'; order.value =oldOrder; order.placeholder='1';
	subtitle.name ='subtitle'; subtitle.value =oldSubtitle; subtitle.placeholder='subtitle';
	
	var submit = document.createElement("input"); 
	submit.type= 'submit'; submit.value = 'Submit';
	
	if(action=='modifyFolder')	{
		var previousName = document.createElement("input");
		previousName.type='hidden'; previousName.name= 'oldName'; previousName.value = oldName;
		
		container.appendChild(name);	container.appendChild(previousName);	container.appendChild(order);
		container.appendChild(subtitle);	container.appendChild(submit);
	}
	else if(action=='deleteFolder')	{
		var r=confirm("Are you sure you want to delete the "+oldName+" folder?");
		if (r==true){
			var arr=[];
			var path = $('#dynamicAdminContent #path')[0];
			if(oldName && path){
				arr.push(oldName);	arr.push(path.value);
				var data2send ={}; data2send.arr = arr;
				$.ajax({
					type: "DELETE",
					url: '/folders',
					data: data2send,
					success: function(data){
						if(data.retStatus && data.retStatus==200)
							window.location.replace(data.redirectTo);
					}
				});
			}
		}
	}
	else if(action=='addFolder'){
		container.appendChild(name);	container.appendChild(order);	
		container.appendChild(subtitle); container.appendChild(submit);
	}


	else if(action=='uploadImage') {
		var upload = document.createElement('input');
		upload.type='file';		upload.name = 'upload'; 	upload.multiple='multiple';
		var path = document.createElement('input');
		path.form = 'picturesForm'; path.type ='hidden';	path.name='path';
		path.value = $('#dynamicAdminContent #path')[0].value;
		
		container = $('#content > #dynamicAdminContent > #picturesRight > form')[0];
		$(container).html('');
		
		container.appendChild(upload);container.appendChild(name);container.appendChild(subtitle);
		container.appendChild(path);container.appendChild(order);container.appendChild(submit);
	}
	else if(action=='modifyImage'){
		var previousFileName = document.createElement("input");
		previousFileName.type='hidden'; previousFileName.name= 'oldFileName'; previousFileName.value = oldFileName;
		var fileName =document.createElement("input");
		fileName.type='text'; fileName.name='fileName';fileName.value=oldFileName;
		var path = document.createElement('input');
		path.form = 'picturesForm'; path.type ='hidden';	path.name='path';
		path.value = $('#dynamicAdminContent #path')[0].value;

		container = $('#content > #dynamicAdminContent > #picturesRight > form')[0];
		$(container).html('');
		
		container.appendChild(name);	container.appendChild(previousFileName);	container.appendChild(fileName);
		container.appendChild(path); container.appendChild(order);	container.appendChild(subtitle);	container.appendChild(submit);
	}
	else if(action=='deleteImage'){
		var r=confirm("Are you sure you want to delete "+oldName+" ?");
		if (r==true){
			var arr=[];
			var path = $('#dynamicAdminContent #path')[0];
			if(oldName && path){
				arr.push(oldName);	arr.push(path.value);
				var data2send ={}; data2send.arr = arr;
				$.ajax({
					type: "DELETE",
					url: '/pictures',
					data: data2send,
					success: function(data){
						if(data.retStatus && data.retStatus==200)
							window.location.replace(data.redirectTo);
					}
				});
			}
		}
	}

}
function renderFolders(data){
	var form = $('#foldersRight > form')[0];
	$(form).html('');
	var title ='';
	if(data.title !='Your Website')
		title+='<i class="fa fa-reply" value="'+data.title
		+'" title="Go back to parent folder" onclick="getFolders(\''+data.title+'\',false)"></i>';
	title +=data.title;
	$('body > #container > #content > #dynamicAdminContent > h1').html(title);
	var str='';
	if(data.tree)
	Object.keys(data.tree).forEach(function(value){
		if (value!= 'subtitle' && value!= 'order' && value!= 'img'&& value!= 'path')
			str+="<div onclick='getFolders(\""+value+"\",true);'>"+value+"</div><div>"
				+ 	"<i title='Modify the folder' class='fa fa-font' onclick='insertInput(\""+value+"\",\""+data.tree[value].order+"\",\""+data.tree[value].subtitle+"\",null,\"modifyFolder\")'></i>"
				+	"<i title='Delete this folder' class='fa fa-times' onclick='insertInput(\""+value+"\",\""+data.tree[value].order+"\",\""+data.tree[value].subtitle+"\",null,\"deleteFolder\")'></i>"
				+"</div><br/>";
	});
	str+='<button onclick="insertInput(\'\',\'\',\'\',null,\'addFolder\')">Add a folder into '+data.title+'</button>';
	$('body > #container > #content > #dynamicAdminContent > #foldersLeft').html(str);
}

function renderImgInAdmin(data)
{
	var container = $('#content #dynamicAdminContent #picturesLeft');
	$(container).html('');
	var path = $('#dynamicAdminContent #path')[0].value+'/';
	if(data.tree.img && data.tree.img.length>0)
	{
		for(var i=0;i<data.tree.img.length;i++)
		{
			var str='';

			str+= 	"<i title='Modify the picture' class='fa fa-font' onclick='insertInput(\""+data.tree.img[i].name+"\",\""+data.tree.img[i].order+"\",\""+data.tree.img[i].subtitle+"\",\""+data.tree.img[i].fileName+"\",\"modifyImage\")'></i>"
				 +	"<i title='Delete this folder' class='fa fa-times' onclick='insertInput(\""+data.tree.img[i].name+"\",\""+data.tree.img[i].order+"\",\""+data.tree.img[i].subtitle+"\",\""+data.tree.img[i].fileName+"\",\"deleteImage\")'></i>"
				 +	"<img src='"+path.replace('root/','/img/')+data.tree.img[i].fileName+"' width='100' height='100' alt='"+data.tree.img[i].name+"'/></div>"
			$(container).append('<div class="thumbBlock">'+str+'</div>');
		}
	}
	$(container).append('<button onclick="insertInput(\'\',\'\',\'\',null,\'uploadImage\')">Add a picture into '+data.title+'</button>')
}
/*
	=========================================================================================================
*/
function populateNav()
{
	getSitemap(function(sitemap){
		// Inject the whole content string into our existing HTML list
		$('body > #container > nav > #menu ').html(populateTree(sitemap).replace(/<ul><\/ul>/gi,''));
		//style
		$('body > #container > nav > #menu > ul').css('display','block');
		$('body > #container > nav > #menu > ul ul').css('display','none');
		//event handler: close and open the nav sub-section
		$('body > #container > nav > #menu > ul li').click(function (){
			$('body > #container > nav > #menu > ul ul').css('display','none');
			$(this).find('ul').css('display','block');
		});
	});
}

function getSitemap(action)
{
	// jQuery AJAX call for JSON
	$.getJSON( '/sitemap', function( sitemap ){
		action(sitemap);
	});
}


function populateTree(tree)
{
	var nav ='<ul>';
	$.each(tree, function(key,value){
		if(typeof(value) == 'object' && !Array.isArray(value)){
			nav+='<li><span onclick="getPictures(\''+key+'\');""><i class="fa fa-square-o"></i>'
				+key+'</span>'+populateTree(value)+'</li>';	
		}
	});
	nav+='</ul>';
	return nav;
}

function getPictures(name){
	var data2send={};
	if(name){
		data2send.folderName= name;
		$.ajax({
		  type: "GET",
		  url: '/pictures',
		  data: data2send,
		  success: function(data){
		  	if(data)
		  		renderPictures(data);
		  }
		});
	}
}

function renderPictures(data)
{
	//empty the galery
	$('#galleria.galleria').html('');
	for (var i = 0; i < data.img.length; i++) {
		$('#galleria.galleria').append('<img src="'+data.path+data.img[i].fileName+'" alt="'+data.img[i].name+'">');
	};
	$('#galleria.galleria').append('<img src="/img/Juan-Monterro.png" alt="logo">')
	Galleria.run('.galleria');

}

function requestFullScreen() {

	if( window.innerHeight != screen.height){
		// Supports most browsers and their versions.
	    var requestMethod = document.body.requestFullScreen || document.body.webkitRequestFullScreen || document.body.mozRequestFullScreen || document.body.msRequestFullScreen;

	    if (requestMethod) { // Native full screen.
	        requestMethod.call(document.body);
	    } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
	        var wscript = new ActiveXObject("WScript.Shell");
	        if (wscript !== null) {
	            wscript.SendKeys("{F11}");
	        }
	    }
	}
	else{
		if(document.exitFullscreen) {
			document.exitFullscreen();
		} else if(document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if(document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}
    
}



