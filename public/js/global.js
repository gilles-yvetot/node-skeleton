
window.onload =window_load;
$( window ).resize(window_resize);

function window_resize(){
}
function window_load(){
	window_resize();
	populateNav();
}
function populateNav()
{
	// jQuery AJAX call for JSON
	$.getJSON( '/sitemap', function( data ) {
		// Inject the whole content string into our existing HTML list
		$('body > .container > nav > #menu ').html(populateTree(data).replace(/<ul><\/ul>/gi,''));
		//style
		$('body > .container > nav > #menu > ul').css('display','block');
		$('body > .container > nav > #menu > ul ul').css('display','none');
		//event handler: close and open the nav sub-section
		$('body > .container > nav > #menu > ul li').click(function (){
			$('body > .container > nav > #menu > ul ul').css('display','none');
			$(this).find('ul').css('display','block');
		});
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

	console.log(sender.innerHTML);
	$.ajax({
		  type: "POST",
		  url: '/pictures',
		  data: sender.innerHTML,
		  success: function(data){
		  	console.dir(data);
		  }
		});

}



