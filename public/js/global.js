
window.onload =window_load;
$( window ).resize(window_resize);

// full screen related functions and listeners
function toggleFSicons(){
 	$('body > footer > #fullscreen > i').toggleClass('fa-arrows-alt');
	$('body > footer > #fullscreen > i').toggleClass('fa-times-circle-o');
 }


function attachEventListeners(){
	document.addEventListener("fullscreenchange", toggleFSicons, false);
	document.addEventListener("mozfullscreenchange", toggleFSicons, false);
	document.addEventListener("webkitfullscreenchange", toggleFSicons, false);
	document.addEventListener("msfullscreenchange", toggleFSicons, false);

	$('#bottomPersonal .fa-stack').click(function(){
		$('#bottomPersonal .description').toggleClass('visibleBlock');
	});
	$('#bottomPersonal .fa-share-alt').click(function(){
		$('#bottomPersonal #share').toggleClass('visibleBlock');
	});
	$('#bottomPersonal #slideshow').click(function(){
		$('#contentPersonal #thumbs').toggleClass('visibleInlineBlock');
		$('#contentPersonal').toggleClass('margin-left-15');
	});
}

function window_resize(){
}
function window_load(){

	attachEventListeners();
	window_resize();
	populateNav();
	var path = window.location.pathname;
	path = path.substring(1,path.length);// remove the first '/'

	switch(path)
	{
		case 'admin':
			getFolders('root','forward');
		break;
		case 'login':
		break;
		case '':
		break;
	}
}
/*
	Absolutely put these function in the admin page only (external JS)====================================
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

function validateAdminForm(formId){
	var i=0;
	$('#'+formId+' input').each(function(){
		if ($(this).val().indexOf("'")>-1||$(this).val().indexOf('"')>-1){
			$(this).after("<div style='color:red;'>You cannot provide quote or double quote!</div>");
			i++;
		}
	});
	
	var val = $('#'+formId+' input[name="order"]').val();
	if(isNaN(val)){ // if it not a number
		$('#'+formId+' input[name="order"]').after("<div style='color:red;'>You have to provide a number</div>");
		i++;
	}

	if (i>0)
		return false;
	else return true;
}

function insertInput(oldName,oldOrder,oldSubtitle,oldFileName,action){
	var container = $('#content > #dynamicAdminContent > #foldersRight > form')[0];
	//empty the form first
	$(container).html('');

	//creating inputs
	var html='';
	
	if(action=='modifyFolder')	{
		html+='<input type="text" name="name" value="'+oldName+'" placeholder="Name"/>';
		html+='<input type="hidden" name="oldName" value="'+oldName+'"/>';
		html+='<input type="text" name="subtitle" value="'+oldSubtitle+'" placeholder="Subtitle"/>';
		html+='<input type="number" name="order" value="'+oldOrder+'" placeholder="1"/>';
		html+='<input type="submit" value="Submit" />';
		$(container).html(html);
	}
	else if(action=='deleteFolder')	{
		var r=confirm("Are you sure you want to delete the "+oldName+" folder and its content?");
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
		html+='<input type="text" name="name" value="'+oldName+'" placeholder="Name"/>';
		html+='<input type="text" name="subtitle" value="'+oldSubtitle+'" placeholder="Subtitle"/>';
		html+='<input type="number" name="order" value="'+oldOrder+'" placeholder="1"/>';
		html+='<input type="submit" value="Submit" />';

		$(container).html(html);
	}


	else if(action=='uploadImage') {

		html+='<input type="file" name="upload" multiple="multiple"/>';
		html+='<input type="text" name="name" placeholder="Name"/>';
		html+='<input type="hidden" name="path" form="picturesForm" value="'+$('#dynamicAdminContent #path')[0].value+'"/>';
		html+='<input type="text" name="subtitle" placeholder="Subtitle"/>';
		html+='<input type="number" name="order" placeholder="1"/>';
		html+='<input type="submit" value="Submit" />';

		container = $('#content > #dynamicAdminContent > #picturesRight > form')[0];
		$(container).html(html);
		
	}
	else if(action=='modifyImage'){

		html+='<input type="text" name="name" value="'+oldName+'" placeholder="Name"/>';
		html+='<input type="text" name="fileName" value="'+oldFileName.replace('w_','')+'"/>';
		html+='<input type="hidden" name="oldFileName" value="'+oldFileName+'"/>';
		html+='<input type="hidden" name="path" form="picturesForm" value="'+$('#dynamicAdminContent #path')[0].value+'"/>';
		html+='<input type="text" name="subtitle" value="'+oldSubtitle+'" placeholder="Subtitle"/>';
		html+='<input type="number" name="order" value="'+oldOrder+'" placeholder="1"/>';
		html+='<input type="submit" value="Submit" />';

		container = $('#content > #dynamicAdminContent > #picturesRight > form')[0];
		$(container).html(html);
		
	}
	else if(action=='deleteImage'){
		var r=confirm("Are you sure you want to delete "+oldFileName+" ?");
		if (r==true){
			var arr=[];
			var path = $('#dynamicAdminContent #path')[0];
			if(oldFileName && path){
				arr.push(oldFileName);	arr.push(path.value);
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
	$('#dynamicAdminContent > h1').html(title);
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
	$('#dynamicAdminContent #foldersLeft').html(str);
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

			str+= 	"<div><i title='Modify the picture' class='fa fa-font' onclick='insertInput(\""+data.tree.img[i].name+"\",\""+data.tree.img[i].order+"\",\""+data.tree.img[i].subtitle+"\",\""+data.tree.img[i].fileName+"\",\"modifyImage\")'></i>"
				 +	"<i title='Delete this folder' class='fa fa-times' onclick='insertInput(\""+data.tree.img[i].name+"\",\""+data.tree.img[i].order+"\",\""+data.tree.img[i].subtitle+"\",\""+data.tree.img[i].fileName+"\",\"deleteImage\")'></i></div>"
				 +	"<div><img src='"+path.replace('root/','/img/')+data.tree.img[i].fileName.replace('w_','t_')+"' alt='"+data.tree.img[i].name+"'/></div>"
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
		//event handler: close and open the nav sub-section + style on the icon
		$('body > #container > nav > #menu > ul li').click(function (event){
			$('body > #container > nav > #menu > ul li').removeClass('selected');
			$(this).addClass('selected');
			$(this).parent().parent().addClass('selected');

			$('body > #container > nav > #menu > ul i').css('color','transparent');
			$(event.target).find('i').css('color','gray');
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

function showPictureInPersonal(i)
{
	console.log(i);
	$('#centralImg img').css('display','none');
	$($('#centralImg img').get(i)).css('display','block');
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
	data=lookForPictures(data);
	if (data && data.img && Array.isArray(data.img)){
		for (var i = 0; i < data.img.length; i++) {
			$('#pictures').append('<img data-original="'+data.path+data.img[i].fileName+'" alt="'+data.img[i].name+'" class="lazy" />')
		};


		$("img.lazy").lazyload({
			container : $("#pictures"),
			effect : "fadeIn",
			threshold : 400
		});
		$('#pictures').css('width',($(window).width()-200)+'px')

		$("#pictures").mousewheel(function(event, delta) {
			this.scrollLeft -= (delta * 5);
			event.preventDefault();
		});

		
	}
}

function lookForPictures(data){
	
	if (data && typeof data === 'object'){
		if (Array.isArray(data.img) && data.img.length >0)
			return data;
		else{
			var arr=[], returnValue=null,found=false;
			arr.push(data);
			while(arr.length >0 && found==false)
			{
				var node = arr[0];
				arr.shift();
				Object.keys(node).forEach(function(key){
					if(node[key].img && Array.isArray(node[key].img) && node[key].img.length>0)  
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
			return returnValue;
		}
	}
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



