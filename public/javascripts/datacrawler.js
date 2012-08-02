var images_array;
var image_counter;
var current_image;
var magnet_link;
var isMagnet;
var movie_json;
var isIMDB;

function loadContent(url) {
	images_array = [];
	image_counter = 0;
	current_image = 0;	
	magnet_link = "";
	isMagnet = false;
	isIMDB = false;
	
	try {
		var service_url = "http://mysterious-hamlet-9529.herokuapp.com/ask/withurl.json?url="; 
		$.getJSON(service_url + url + "&callback=?", null, function () {});
	} 
	catch ( exception ) {
		alert( 'Ajax Error' );
	} 
} 

function parseContent(data) {

	try {
		var hidden_div = document.getElementById("hidden_div");
		hidden_div.style.visibility = "none";
		hidden_div.innerHTML = data.body;
		
		// We now process the page
		processPage();
				
		hidden_div.innerHTML = "";
	} catch ( exception ) {
		alert( 'Parse Error' + exception);
	}
}

function processPage() {

	// Hide the download link
	$('#download_link').hide();

	// Show all the data div	
	$('#data_div').show();

	// hide loader image
	$('#img_loader').hide();
	
	// find the magnetic link
	$('#hidden_div').find('a[href^="magnet:"]').each(function() {
		magnet_link = this.href;
		isMagnet = true;
	});
	
	if (isMagnet) {
		// alert(document.getElementById('download_link').href);
		document.getElementById('download_link').href = magnet_link;
		document.getElementById('download_link').innerHTML = "Download Here";
		
		// Add to input field for form post
		document.getElementById('micropost_magnet_link').value = magnet_link;
	}	
	
	var imdb_index = findIMDBIndex();
	if (imdb_index > 0) {
		processIMDB(imdb_index);	
		
		// wait 100 milisecs
		setTimeout(function() {
        	}, 100);
		
		// Add imdb json to input for db save
		if (movie_json != null) {
			
			// Add data json to input field in the form for db post
			document.getElementById('micropost_data_json').value = JSON.stringify(movie_json);
		}		
	} else {
		//Show the download link
		$('#download_link').show();
	}

	
	if (movie_json != null) {
		try {
                        //var service_url = "http://mysterious-hamlet-9529.herokuapp.com/ask/withurl.json?movie=";
                        var url_address = "http://api.themoviedb.org/2.1/Movie.getImages/en/json/d450ee190cd0abb5c1e6ff021e9206af/";
                        $.ajax({
                               // url: service_url + url_address + movie_json.imdbID + "&call=parseJSONdbData",
                                url: url_address + movie_json.imdbID,
				dataType: 'jsonp',
                                jsonpCallback: 'parseJSONdbData',
                                success: function(dataWeGotViaJsonp){
                                        //console.log("success");
                                }
                        });


                } catch (exception) {
			console.log('Error: trying to get data');
                }
	}

        // Search for posters in the website
        $('#hidden_div').find('img').each(function() {
            	if (this.src.indexOf("http:") != -1 && !isBlackList(this.src)) {
                      	images_array.push(this.src);
                      	image_counter += 1;
			//DEBUG****************************************************
			console.log(this.src);
			console.log(image_counter);
               	}
       	});


	// Give the user the ability to show the image to post
	if (image_counter > 0) {
		$('#choose_picture_div').show();			
	}
	
	// Add image to document
	setTimeout(function () {updateImageAndSave();},2000);
	updateCounter();
}

		
function parseJSONdbData(data) {
	try {
		data = data[0];
		var posters = data.posters;
		var poster = posters[2].image.url;
		images_array.unshift(poster);
		images_counter += 1;
 
		//updateImageAndSave();
		//updateCounter();
	} catch (exception) {}
}

// Get the IMDB address index if appears
function findIMDBIndex() {
	var loaded_content = $('#hidden_div').html();
	return loaded_content.search('http://www.imdb.com/title/');
}

function processIMDB(imdb_index) {
	if (imdb_index > 0) {
		var loaded_content = $('#hidden_div').html();
		var end_index = loaded_content.indexOf('<', imdb_index);
		var imdb_address = loaded_content.substring(imdb_index, end_index);

		// IMDb ID to Search
//		var imdbLink = "tt1285016";
		var imdbLink = imdb_address.substring(26);
		imdbLink = imdbLink.slice(0, 9);

		// Send Request
		var http = new XMLHttpRequest(); 
		http.open("GET", "http://www.imdbapi.com/?i=" + imdbLink, false);
		http.send(null);

		// Response to JSON
		var imdbData = http.responseText;
		var imdbJSON = eval("(" + imdbData + ")");

		// Returns Movie Title
		//alert(JSON.stringify(imdbJSON));
		if (imdbJSON.Response == "True") {
			addMovieData(imdbJSON);

			// Save to global variable
			movie_json = imdbJSON;
		}
	}
}

function previousImage() {
	if (image_counter > 1 && current_image > 0 ) {
		current_image -= 1;
		updateImageAndSave();
		updateCounter();		
	}
}

function nextImage() {
	if (image_counter > 0 && current_image < (image_counter-1)) {
		current_image += 1;
		updateImageAndSave();
		updateCounter();
	}
}

function updateImageAndSave() {
	document.img01.src = images_array[current_image];
	document.img01.style.width = "125px";

	// Save the selected image on the image filed for form post to db
	document.getElementById('micropost_poster_src').value = images_array[current_image];
} 

function updateCounter() {
	// Add counter result
	document.getElementById("image_counter").innerHTML = (current_image + 1) + " of " + image_counter;
}

function addMovieData(json) {
	// Example of JSON response
	// {
	// 	"Title":"American Reunion",
	// 	"Year":"2012",
	// 	"Rated":"R",
	// 	"Released":"06 Apr 2012",
	// 	"Runtime":"1 h 53 min",
	// 	"Genre":"Comedy",
	// 	"Director":"Jon Hurwitz, Hayden Schlossberg",
	// 	"Writer":"Adam Herz, Jon Hurwitz",
	// 	"Actors":"Jason Biggs, Alyson Hannigan, Seann William Scott, Chris Klein",
	// 	"Plot":"Jim, Michelle, Stifler, and their friends reunite in East Great Falls, Michigan for their high school reunion.",
	// 	"Poster":"http://ia.media-imdb.com/images/M/MV5BMTY4MTEyMzU1N15BMl5BanBnXkFtZTcwNDQ0NTc1Nw@@._V1_SX640.jpg",
	// 	"imdbRating":"7.3",
	// 	"imdbVotes":"35,400",
	// 	"imdbID":"tt1605630",
	// 	"Response":"True"
	// }
	document.getElementById("movie_data").innerHTML = 
		"<a href='" + magnet_link + "'>" + json.Title + "</a><br \>" +
		json.Plot + "<br \>" + 
		"Year: " + json.Year + " - " + 
		"Genre: " + json.Genre + " - " + 
		"Rating: " + json.imdbRating + "<br \>";
	
}

function showLoaderImage() {
	document.loader.src = "images/ajax-loader.gif";	
}

// Returns true if the url is blacklisted
function isBlackList(url) {
	var black_list = ['http://image.bayimg.com/', 'http://ia.media-imdb.com/'];

	for (i in black_list) {
		if (url.search(black_list[i]) != -1) {
			return true;
		}
	}

	return false;
}

$(document).ready(function(){
//	$("input").live("click",);
	// $("form").submit( function () {
	// 	// var url = document.getElementById("url_input").value;
	// 	// loadContent(url)
	// 	alert("Will post the following: " + JSON.stringify(movie_json));
	// 	return false;
	// });
	$('textarea').bind('paste', function () {
		
		showLoaderImage();

		var el = $(this);
        	setTimeout(function() {
            		var url = $(el).val();
        		loadContent(url)
        	}, 100);
	});
	
	$('#data_div').hide();
	$('#choose_picture_div').hide();
});
