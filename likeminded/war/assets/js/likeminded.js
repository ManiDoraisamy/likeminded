var CONTAINERID = "#glob";

function AccountHome(fbId)
{
	this.fbId = fbId;
	this.data = {loading:true};
	this.acctemplate = new EJS({url: "assets/ejs/account.ejs"});
	this.newpersona = false;
	this.token = null;
	
	this.load = function()
	{
		var curr = this;
		FB.api('/me?fields=username,name,bio,email,gender,cover,location', function(response) {
			var accmap = {};
			accmap.username = response.username; accmap.name = response.name; accmap.bio = response.bio;
			accmap.email = response.email; accmap.gender = response.gender;
			if(response.cover && response.cover.source)
				accmap.cover = response.cover.source;
			curr.data["facebook"] = accmap;
			curr.getInterests({"email":accmap.email});
		});
	}
	
	this.getInterests = function(pref)
	{
		var curr = this;
		pref["apiKey"] = "717255572616cbff";
		jQuery.ajax({
			url: "https://api.fullcontact.com/v2/person.json", dataType : "jsonp", type:"GET", data:pref,
			success: function(updata){
				if(updata["digitalFootprint"])
				{
					if(updata.digitalFootprint["topics"])
						curr.data["topics"] = updata.digitalFootprint.topics;
					if(updata.digitalFootprint["scores"])
					{
						curr.data["klout"] = updata.digitalFootprint.scores[0].value;
					}
					curr.render();
				}
			},
			error: function(e){
				curr.render();
			}
		});
	}
	
	this.makeCall = function(phone)
	{
		
		jQuery.ajax({
			url: "/likeminded", dataType : "json", type:"POST", data:{},
			success: function(updata){
				console.dir(updata);
			},
			error: function(e){}
		});
	}
	
	this.loadInterest = function(paneId)
	{
		var curr = this;
		if(paneId == null)
		{
			this.render();
			return;
		}
		else
		{
			var html = '<div class="leg skill">';
			html += '<input data-readonly="true"  data-fgcolor="#16a085" data-inputColor="#333" data-width="245" data-height="122.5" class="knob-4" rel="4" value="0" readonly="readonly" data-angleArc="180" data-angleOffset="-90" data-max="100" >';
			html += '<h4 class="visible-phone">4</h4>';
			html += '<h6>People interested in '+paneId+'</h6>';
			html += '</div>';
			jQuery("#container").css({"height":window.innerHeight+"px"}).html(html);
			
			var lng = -121;
			var lat = 37;
		    var map = new esri.Map("container", {
		        center: [lng, lat],
		        zoom: 15,
		        basemap: "streets"
		    });
		    var carurl = "http://osisoftvcampus.cloudapp.net/vehicledata/cardata.svc/json/cwc/livecar";
		    var route = function() {
				jQuery.ajax({
					url: carurl, dataType : "jsonp", type:"GET",
					success: function(dao){
						for(var i = 0; i < dao.Properties.length; i++)
						{
							var prop = dao.Properties[i];
							if(prop.Name == "Longitude")
								lng = prop.Snapshot.Value;
							if(prop.Name == "Latitude")
								lat = prop.Snapshot.Value;
						}
				        var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(lng, lat));
				        var symbol = new esri.symbol.PictureMarkerSymbol("http://graph.facebook.com/"+curr.fbId+"/picture",50,50);
				        var graphic = new esri.Graphic(pt, symbol);
				        map.graphics.add(graphic);
				        map.centerAndZoom(pt, 15);
					},
					error: function(e){
						//curr.data = {error: "Could not load inbox items. Try reloading the page."};
					}
				});
			};
		    setInterval(route, 9000);
		    route();
		    var intrs = new Array();
		    for(var i = 0; i < curr.data.topics.length; i++)
		    	intrs.push(curr.data.topics[i].value);
			jQuery.ajax({
				url: "/likeminded", dataType : "json", type:"GET",
				data: {id:curr.fbId, longitude:lng, latitude:lat, interest:intrs, selected:paneId},
				success: function(rslt){
					var ppl = 0;
					for(var rsid in rslt)
					{
						var rs = rslt[rsid];
						if(rs["location"])
						{
							//var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(-121.5, 37.5));
					        var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(rs.location.longitude, rs.location.latitude));
					        var symbol = new esri.symbol.PictureMarkerSymbol("http://graph.facebook.com/"+rsid+"/picture",50,50);
					        var graphic = new esri.Graphic(pt, symbol);
					        map.graphics.add(graphic);
						}
						ppl++;
					}
					curr.token = rslt.token;
					jQuery('.knob-4').waypoint(function(){
				        jQuery('.knob-4').knob();
				        if(jQuery('.knob-4').val() == 0) {	
					    	jQuery({value: 0}).animate({value: ppl}, {
					        	duration: 5000,
					        	easing:'swing',
					        	step: function(){jQuery('.knob-4').val(Math.ceil(this.value)).trigger('change');}
						    })
					   	}	        	   	        
			   	        },
				        {
				          triggerOnce: true,
				          offset: function(){
				            return $(window).height() - $(this).outerHeight(); 
				          }
				        }
			        );
				},
				error: function(e){
					//curr.data = {error: "Could not load inbox items. Try reloading the page."};
				}
			});
		    
		    
		    /*
			navigator.geolocation.getCurrentPosition(
				function(location) {
					console.dir(location);
			        var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(location.coords.longitude, location.coords.latitude));
			        var symbol = new esri.symbol.PictureMarkerSymbol("http://graph.facebook.com/"+curr.fbId+"/picture",50,50);
			        var graphic = new esri.Graphic(pt, symbol);
			        map.graphics.add(graphic);
			        map.centerAndZoom(pt, 15);
				}, 
				function()
				{
					
				}
			);*/
		}
	}
	
	this.render = function()
	{
		if(this.data["topics"])
		{
			var html = this.acctemplate.render(this);
			jQuery(CONTAINERID).html(html);
			jQuery('.btn-navbar').click( function() {
				jQuery('html').toggleClass('expanded');
		    });
		}
	}
};
