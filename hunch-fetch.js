// fetch from hunch
// actually, we do a couple other things in here, too, just b/c we have the
// $(document).ready here

var data = [];

// stole from:
// http://stackoverflow.com/questions/210717/
jQuery.fn.center = function () {
    this.css("position","absolute");
    this.css("top", ( $(window).height() - this.height() ) / 2+$(window).scrollTop() + "px");
    this.css("left", ( $(window).width() - this.width() ) / 2+$(window).scrollLeft() + "px");
    return this;
}

$(document).ready(function(){
	// set some important constants
	var limit = 20;
	var topics = ["list_actor","list_artwork","list_movie"];
	var topic = topics[Math.floor(Math.random()*topics.length)];

	// give the input box focus
	// fuck yeah usability
	$("#init-input").focus();

	// handle the needy people that need help
	$("#call-help").click(function(e){
		$("#help-cont").center();
		$("#help-cont").show();
		e.preventDefault();
		return 0;
	    });
	$("#help-cont").click(function() {
		$("#help-cont").hide();
	    });

	$("#init-sub").submit(function(e){
		// validate input
		var tw = $("#init-input").val();
		if(tw !== "" && tw.length <= 15) {
		    fetchHunch(tw);
		} else {
		    alert("I'm sorry, dude, I, like, can't let you do that");
		}
		// don't actually submit, idiot
		e.preventDefault();
		return 0;
	    });

	// fetches the Hunch data
	function fetchHunch(tw_name) {
	    var args = {"user_id":"tw_"+tw_name,
			"topic_ids":topic,
			"limit":limit};
	    Hunch.api("get-recommendations",args,
		      function(d, status) {
			  var recs = d.recommendations;
			  // push the data into a format startGame() likes
			  for(var r in recs) {
			      var p = recs[r];
			      data.push([p.name,p.image_urls]);
			  }
			  // start the game when we have everything
			  startGame();
		      });
	}

	// this was a function for another idea we had
	// where you would lose points if you shot things you hated
	function fetchNegativeHunch(recs) {
	    var rcs = $.map(recs,function(elem,ind){
		    return elem.result_id;
		});
	    var args = {"dislikes":rcs.join(","),
			"topic_ids":topic,
			"limit":limit};
	    Hunch.api("get-recommendations",args,
		      function(data, status) {
			  if(status) {
			      alert(status);
			  }
			  var recs = data.recommendations;
			  $("#data").html($("#data").html()+"<br/>");
			  for(var r in recs) {
			      var p = recs[r];
			      $("#data").html($("#data").html()+
					      p.name+p.image_urls+
					      "<br/>");

			  }
		      });
	}
    });
