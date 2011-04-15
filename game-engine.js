// game mechanics

function startGame() {
    // switch what we're showing
    $("#cont").show();
    $("#init").hide();
    $("#help-cont").hide();

    // init a ton of variables
    var asteroids = [];
    var images = [];
    for( var i in data) {
	var img = new Image();
	img.src = data[i][1];
	images[i] = img;
    }
    var g = new GEE({ fullscreen: true, 
		      context: '2d', 
		      container:  document.getElementById('cont') });
    // OH GOD SO MANY VARIABLES
    var shipX = g.width/2;
    var shipY = g.height/2;
    var rot = -Math.PI/2;
    var angVel = 0;
    var velX = 0;
    var velY = 0;
    var left = false;
    var right = false;
    var boosters = false;
    var bullets = [];
    var score = 0;
    var state = 0; // 0-live, 1-dead, 2-really dead
    var lives = 3; // 0 life for debugging end of life stuff
    var bulletLife = 50;
    var bulletCost = 10;
    var asteroidReward = 15;
    var speedRamp = 0.0001;
    var scoreRamp = 0.0003;
    var startFrame = 0;
    var scroll = 0;
    var scrollSpeed = 0;
    var scrollWidth = 0;
    // draw the damn thing
    // also known as the main loop
    g.draw = function() {
	var ctx = g.ctx;
	ctx.save();
	ctx.shadowOffsetX = 3;
	ctx.shadowOffsetY = 3;
	ctx.shadowBlur = 10;
	ctx.shadowColor = "black";
	ctx.clearRect(0,0,g.width,g.height);

	// introduce some random asteroids
	var rand = function() {
	    return Math.random() - Math.random();
	}
	if(g.frameCount%120 === 0 && asteroids.length < 10) {
	    var location = Math.floor(Math.random()*4);
	    if(location === 0) {
		asteroids.push(new Asteroid(rand()*g.width, -100, rand()*5+g.frameCount*speedRamp, rand()*5+g.frameCount*speedRamp, rand()*.1, rand()*2*Math.PI, Math.floor(Math.random()*3)+1, images[Math.floor(Math.random()*images.length)]));
	    }
	    if(location === 1) {
		asteroids.push(new Asteroid(rand()*g.width, g.height + 100, rand()*5+g.frameCount*speedRamp, rand()*5+g.frameCount*speedRamp, rand()*.1, rand()*2*Math.PI, Math.floor(Math.random()*3)+1, images[Math.floor(Math.random()*images.length)]));
	    }
	    if(location === 2) {
		asteroids.push(new Asteroid(g.width + 100, rand()*g.height, rand()*5+g.frameCount*speedRamp, rand()*5+g.frameCount*speedRamp, rand()*.1, rand()*2*Math.PI, Math.floor(Math.random()*3)+1, images[Math.floor(Math.random()*images.length)]));
	    }
	    if(location === 3) {
		asteroids.push(new Asteroid(-100, rand()*g.height, rand()*5+g.frameCount*speedRamp, rand()*5+g.frameCount*speedRamp, rand()*.1, rand()*2*Math.PI, Math.floor(Math.random()*3)+1, images[Math.floor(Math.random()*images.length)]));
	    }
		
	}

	// draw the bullets
	ctx.lineWidth = 4;
	ctx.beginPath();
	for (var i in bullets) {
	    var b = bullets[i];
	    ctx.moveTo(b.x,b.y);
	    ctx.lineTo(b.x+b.u,b.y+b.v);
	    b.x += b.u;
	    b.y += b.v;
	    if (b.x<0) {
	    	b.x = g.width;
	    } else if (b.x>g.width) {
	    	b.x = 0;
	    }
	    if (b.y<0) {
	    	b.y = g.height;	
	    } else if (b.y>g.height) {
	    	b.y = 0; 
	    }
	}
	ctx.stroke();

	// check bullet life
	for(var i=0,bl=bullets.length;i<bl;i++){
	    bullets[i].life++;
	    if(bullets[i].life > bulletLife) {
		bullets.splice(i,1);
		i--;
		bl--;
	    }
	}

	// draw 'dem asteroids
	var asteroidCreate = [];
	var baby;
	ctx.shadowOffsetX = 3;
	ctx.shadowOffsetY = 3;
	ctx.shadowBlur = 10;
	ctx.shadowColor = "black";
	for (var i=0,al=asteroids.length;i<al;i++) {
	    ctx.save();
		
	    var a = asteroids[i];
	    var w = a.img.width * a.size*.3;
	    var h = a.img.height * a.size*.3;
	    ctx.translate(a.x,a.y);
	    ctx.rotate(a.r);
	    ctx.fillRect(-w/2,-h/2,w,h);
	    ctx.drawImage(a.img, -w/2, -h/2, w, h);
	    ctx.restore();
	    a.x += a.u;
	    a.y += a.v;
	    if(a.x < -50) {
		a.x = g.width+50;
	    }
	    if(a.x > g.width+50) {
		a.x = -50;
	    }
	    if(a.y < -50) {
		a.y = g.height+50;
	    }
	    if(a.y > g.height+50) {
		a.y = -50;
	    }
	    a.r += a.w;
	
	    // do bullet collisions
	    var vx = Math.cos(a.r);
	    var vy = Math.sin(a.r);
	    for (var j=0,bl = bullets.length;j<bl;j++){
		var b = bullets[j];
		var dx = b.x-a.x;
		var dy = b.y-a.y;
		var dp = dx*vx+dy*vy;
		var cp = dx*vy-dy*vx;
		if (dp>-w/2 && dp<w/2 && cp>-h/2 && cp<h/2) {
		    score += asteroidReward;
		    a.size -= 1;
		    bl--;
		    bullets.splice(j,1);
		    if(a.size>0){
			a.u = rand()*5;
			a.v = rand()*5;
			a.r = rand()*2*Math.PI;
			a.w = rand()*.1;
			baby = new Asteroid(a.x,a.y,-a.u,-a.v,-a.w,-a.r,a.size,a.img);
			asteroids.push(baby);
		    } else {
			asteroids.splice(i,1);
			i--;
			al--;
		    }
		}
	    }
		
	    {
		// asteroid-ship collisions
		var dx = shipX-a.x;
		var dy = shipY-a.y;
		var dp = dx*vx+dy*vy;
		var cp = dx*vy-dy*vx;
		// if ship is too close...
		if (state === 0 && dp>-w/2-5 && dp<w/2+5 && cp>-h/2-5 && cp<h/2+5) {
		    a.size -= 1;
		    // if we have enough lives...
		    if(lives >= 1) {
			// we die
			lives--;
			state = 1;
			shipX = g.width/2;
			shipY = g.height/2;
			velX = 0;
			velY = 0;
			rot = -Math.PI/2;
			angVel = 0;
		    } else {
			state = 2;
		    }
		    if(a.size>0){
			a.u = rand()*5;
			a.v = rand()*5;
			a.r = rand()*2*Math.PI;
			a.w = rand()*.1;
			baby = new Asteroid(a.x,a.y,-a.u,-a.v,-a.w,-a.r,a.size,a.img);
			asteroids.push(baby);
		    } else {
			asteroids.splice(i,1);
			i--;
			al--;
		    }
		}
	    }
	    // more asteroid collisions?
	    {
		var dx = shipX-a.x;
		var dy = shipY-a.y;
		var dp = dx*vx+dy*vy;
		var cp = dx*vy-dy*vx;
		if (state === 0 && dp>-w/2-5 && dp<w/2+5 && cp>-h/2-5 && cp<h/2+5) {
		    a.size -= 1;
		    if(a.size>0){
			a.u = rand()*5;
			a.v = rand()*5;
			a.r = rand()*2*Math.PI;
			a.w = rand()*.1;
			baby = new Asteroid(a.x,a.y,-a.u,-a.v,-a.w,-a.r,a.size,a.img);
			asteroids.push(baby);
		    } else {
			asteroids.splice(i,1);
			i--;
			al--;
		    }
		}
	    }
	}

	// the little slideshow when game over
	if(state === 2) {
	    if (g.mouseX<g.width/2) {
		scrollSpeed -= .001*(g.mouseX-g.width/2);
	    } else {
		scrollSpeed -= .001*(g.mouseX-g.width/2);
		} 
	    scroll += scrollSpeed; 
	    ctx.fillStyle = "black";
	    ctx.fillRect(0,g.height-300,g.width,300);
	    if (scroll<0) {
		//// this doesn't work, for some reason
		// scroll = 0;
		// scrollSpeed = 0;
	    } else if (scrollWidth+scroll>g.width) {
		// scroll = g.width-scrollWidth;
		// scrollSpeed = 0;
	    }
	    var x = 10;
	    for (var i in images) {
		var img = images[i];
		var h = 280;
		var w = img.width*h/img.height;
		ctx.drawImage(img,x+scroll,g.height-290,w,h);
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 10;
		ctx.shadowColor = "black";
		ctx.fillStyle = "black";
		//ctx.fillRect(x,g.height-30,w,20);
		ctx.fillStyle = "white";
		ctx.textAlign = "left";
		var stringArray = data[i][0].split(" ");
		var y = g.height-250;
		for (var j in stringArray) {
		    ctx.fillText(stringArray[j],x+scroll+20,y);
		    y += 30;
		}
		
		x += w+10;
	    }
	    scrollWidth = x;
	    // ctx.fillStyle = "black";
	}

	// control stuff
	if(state === 0) {
	    if (left) {
		angVel -= .01;
	    }
	    if (boosters) {
		velX += .05*Math.cos(rot);
		velY += .05*Math.sin(rot);
		score -= 0.02;
	    }
	    if (right) {
		angVel += .01;
	    }
	    angVel *= .95;
	    velX *= .999;
	    velY *= .999;
	    rot += angVel;
	    shipX += velX;
	    shipY += velY;
	    if (shipX < 0) {
		shipX = g.width;
	    } else if (shipX>g.width) {
		shipX = 0;
	    }
	    if (shipY < 0) {
		shipY = g.height;
	    } else if (shipY>g.height) {
		shipY = 0;
	    }
	}

	// draw the ship/lives with fills/dropshadows
	if(state !== 2) {
	    ctx.fillStyle = "white";
	    ctx.lineWidth = 1;
	    ctx.beginPath();
	    for (var i=0;i<lives;i++){
		var x = 50+i*30;
		var y = 50;
		var r = -Math.PI/2;
		ctx.moveTo(x+25*Math.cos(r),y+25*Math.sin(r));
		ctx.lineTo(x+10*Math.cos(r+2),y+10*Math.sin(r+2));
		ctx.lineTo(x+0*Math.cos(r+Math.PI),y+0*Math.sin(r+Math.PI));
		ctx.lineTo(x+10*Math.cos(r-2),y+10*Math.sin(r-2));
		ctx.lineTo(x+25*Math.cos(r),y+25*Math.sin(r));
	    }
	    ctx.moveTo(shipX+25*Math.cos(rot),shipY+25*Math.sin(rot));
	    ctx.lineTo(shipX+10*Math.cos(rot+2),shipY+10*Math.sin(rot+2));
	    ctx.lineTo(shipX+0*Math.cos(rot+Math.PI),shipY+0*Math.sin(rot+Math.PI));
	    ctx.lineTo(shipX+10*Math.cos(rot-2),shipY+10*Math.sin(rot-2));
	    ctx.lineTo(shipX+25*Math.cos(rot),shipY+25*Math.sin(rot));

	    // draw ship/lives, the high-def lines
	    ctx.fill();
	    ctx.shadowOffsetX = 0;
	    ctx.shadowOffsetY = 0;
	    ctx.shadowBlur = 0;
	    // if it's dead, display in red
	    if(state === 0) {
		ctx.strokeStyle = "black";
	    } else if(state === 1) {
		ctx.strokeStyle = "red";
	    }
	    ctx.beginPath();
	    for (var i=0;i<lives;i++){
		var x = 50+i*30;
		var y = 50;
		var r = -Math.PI/2;
		ctx.moveTo(x+25*Math.cos(r),y+25*Math.sin(r));
		ctx.lineTo(x+10*Math.cos(r+2),y+10*Math.sin(r+2));
		ctx.lineTo(x+0*Math.cos(r+Math.PI),y+0*Math.sin(r+Math.PI));
		ctx.lineTo(x+10*Math.cos(r-2),y+10*Math.sin(r-2));
		ctx.lineTo(x+25*Math.cos(r),y+25*Math.sin(r));
	    }
	    ctx.moveTo(shipX+25*Math.cos(rot),shipY+25*Math.sin(rot));
	    ctx.lineTo(shipX+10*Math.cos(rot+2),shipY+10*Math.sin(rot+2));
	    ctx.lineTo(shipX,shipY);
	    ctx.lineTo(shipX+10*Math.cos(rot-2),shipY+10*Math.sin(rot-2));
	    ctx.lineTo(shipX+25*Math.cos(rot),shipY+25*Math.sin(rot));
	    ctx.stroke();
	}
	
	// press space to continue...
	if(state !== 0) {
	    ctx.fillStyle = "Black";
	    ctx.font = "40pt Arial";
	    ctx.textAlign = "center";
	    if(state === 1)
		ctx.fillText("Press the 'r' key to Respawn",g.width/2,g.height/2+100);
	    if(state === 2) {
		ctx.fillText("GAME OVER FOO",g.width/2,g.height/2-200);
		ctx.fillText("HAHAHAHA NOOB",g.width/2,g.height/2-100);
		ctx.fillText("PRESS 'r' TO PLAY AGAIN",g.width/2,g.height/2);
	    }
	}

	// figure the new time score
	if(state === 0) {
	    score += scoreRamp*(g.frameCount-startFrame);
	}

	// display the score
	ctx.fillStyle = "Black";
	ctx.font = "20pt Arial";
	ctx.textAlign = "center";
	ctx.fillText(Math.floor(score),g.width-50,50);
    };

    // controls!!!
    g.keydown = function(){
	if(state === 0) {
	    if (g.keyCode == 37) {
		left = true;
	    }else if (g.keyCode == 38) {
		boosters = true;
	    } else if (g.keyCode == 39) {
		right = true;
	    } else if (g.keyCode == 32) {
		score -= bulletCost;
		bullets.push(new Bullet(shipX+25*Math.cos(rot),shipY+25*Math.sin(rot),5*Math.cos(rot)+velX,5*Math.sin(rot)+velY));
		velX -= .01*(15*Math.cos(rot)+velX);
		velY -= .01*(15*Math.sin(rot)+velY);
	    }
	}
	// press 'r' to respawn
	if(state === 1 && g.keyCode == 82) {
	    velX = 0;
	    velY = 0;
	    angVel = 0;
	    state = 0;
	    startFrame = g.frameCount;
	}
	// press 'r' to reload
	if(state === 2 && g.keyCode == 82) {
	    window.location.reload();
	}
    };
    g.keyup = function() {
	if(state === 0) {
	    if (g.keyCode == 37) {
		left = false;
	    }else if (g.keyCode == 38) {
		boosters = false;
	    } else if (g.keyCode == 39) {
		right = false;
	    } 
	}
    };
    g.mouseup = function() {
	if (state == 2) {
	    var x = 10;
	    for (var i in images) {
		var img = images[i];
		var h = 280;
		var w = img.width*h/img.height;
		if (g.mouseX-scroll > x && g.mouseX-scroll<x+w && g.mouseY>g.height-290 && g.mouseY<g.height-10) {
		    window.open("http://google.com/#q="+data[i][0].replace("\s","+"));
		    break;
		}
		x += w+10;
	    }
	}
    }
};

// basic classes

function Bullet(x,y,u,v){
    this.x = x;
    this.y = y;
    this.u = u;
    this.v = v;
    this.life = 0;
};

function Asteroid(x,y,u,v,w,r,size,img) {
    this.x = x;
    this.y = y;
    this.u = u;
    this.v = v;
    this.w = w;
    this.r = r;
    this.size = size;
    this.img = img;
}