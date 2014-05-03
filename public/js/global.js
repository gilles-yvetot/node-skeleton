
window.onload =window_load;
$( window ).resize(window_resize);

document.addEventListener("fullscreenchange", function () {
	$('body > footer > #fullscreen > i').toggleClass('fa-arrows-alt');
	$('body > footer > #fullscreen > i').toggleClass('fa-times-circle-o');
}, false);
 
document.addEventListener("mozfullscreenchange", function () {
	$('body > footer > #fullscreen > i').toggleClass('fa-arrows-alt');
	$('body > footer > #fullscreen > i').toggleClass('fa-times-circle-o');
}, false);
 
document.addEventListener("webkitfullscreenchange", function () {
	$('body > footer > #fullscreen > i').toggleClass('fa-arrows-alt');
	$('body > footer > #fullscreen > i').toggleClass('fa-times-circle-o');
}, false);
 
document.addEventListener("msfullscreenchange", function () {
	$('body > footer > #fullscreen > i').toggleClass('fa-arrows-alt');
	$('body > footer > #fullscreen > i').toggleClass('fa-times-circle-o');
}, false);

function window_resize(){
}
function window_load(){
	window_resize();
	populateNav();
	var a = document.getElementById('dynamicAdminContent');
	if(a)
		getAdminContent('root',true);
}
/*
	Absolutely put these function in admin page only=====================================================
*/
function getAdminContent(folderName, forward){

		var dataForAjax ={};	dataForAjax[folderName]=forward;
		$.ajax({
			  type: "GET",
			  url: '/admin_folders',
			  data: dataForAjax,
			  success: function(data){
			  	renderAdminContent(data);
			  }
			});

}
function insertInput(title,action){
	
	var container = $('#modifs > form')[0];
	while (container.hasChildNodes()) {
		    container.removeChild(container.lastChild);
		}
	if(action=='upload')
	{
		
	}
	else if(action=='modify')
	{
		var name = document.createElement("input");
		name.type = 'text';
		name.className = '';
		name.form = 'modifForm';
		var order = name.cloneNode(true), subtitle = name.cloneNode(true);
		name.name ='name'; name.value =title;
		order.name='order'; order.placeholder= 1;
		subtitle.name= 'subtitle'; subtitle.placeholder = 'subtitle';
		container.appendChild(name);	container.appendChild(order);	container.appendChild(subtitle);
	}
	else if(action=='delete')
	{

	}
	else if(action=='add')
	{

	}
}
function renderAdminContent(data){
	var title ='';
	if(data[0] !='Your Website')
		title+='<i class="fa fa-reply" value="'+data[0]
		+'" title="Go back to parent folder" onclick="getAdminContent(\''+data[0]+'\',false)"></i>';
	title +=data[0];
	$('body > #container > #content > #dynamicAdminContent > h1').html(title);
	data.shift();
	var str='';
	if(data)
	data.forEach(function(value){
		str+='<div><div onclick="getAdminContent(\''+value+'\',true);">'+value+'</div><div>'
			+	'<i title="Upload a picture in the folder" class="fa fa-cloud-upload" onclick="insertInput(\''+value+'\',\'upload\')"></i>'
			+ 	'<i title="Modify the folder" class="fa fa-font" onclick="insertInput(\''+value+'\',\'modify\')"></i>'
			+	'<i title="Delete this folder" class="fa fa-times" onclick="insertInput(\''+value+'\',\'delete\')"></i>'
			+'</div></div>';
	});
	$('body > #container > #content > #dynamicAdminContent > #folders').html(str);

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
		if(key!='subtitle' && key!='img' && value!=null){
			nav+='<li><span onclick=\'getImages(event);\'>'+key+'</span>'+populateTree(value)+'</li>';	
		}
	});
	nav+='</ul>';
	return nav;
}

function getImages(e){

	// get sender element
	var sender = (e && e.target) || (window.event && window.event.srcElement);
	var myEle = sender;

	$.ajax({
		  type: "GET",
		  url: '/pictures',
		  data: sender.innerHTML,
		  success: function(data){
		  	console.dir(data);
		  }
		});
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



