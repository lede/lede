exports.total_posts = function(req, res) {
	res.send (
	  {
	  	item: [
	  		"1",
	        "3",
	        "5",
	        "7",
	        "9"
	  	],
	  	settings: {
	  		axisx: [
	  			"Aug"
	  		],
	  		axisy: [
	  			"Good",
	  			"Bad"
	  		]
	  	}
	  }
	);
};