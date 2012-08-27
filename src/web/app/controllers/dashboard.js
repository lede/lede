exports.total_posts = function(req, res) {
	res.send (
	  {
	  	item: [
	  		"1",
	        "5",
	        "7",
	        "15"
	  	],
	  	settings: {
	  		axisx: [
	  			"Aug",
	  			"Sept"
	  		],
	  		axisy: [
	  			"Bad",
	  			"Good"
	  				  		]
	  	}
	  }
	);
};