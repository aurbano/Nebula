/**
 * Nebula
 * An HTML5+JS nebulosa effect, it displays text by making circles float inside it.
 *
 * @author Alejandro U. Alvarez (http://urbanoalvarez.es)
 */
var Nebula = function () {
	// CONFIGURATION
	this.resolution = 20;
	this.tolerance = 0; // 0 to 1
	this.minRad = 0;
	this.maxRad = 40;
	this.maxInitRad = 0.0001;
	this.maxSpeed = 0.8;
	this.variation = 0.2;
	this.explosionRadius = 100;
	this.attraction = 0.00001; // Attraction towards their real center, based on distance
	this.explosionForce = 0.01; // Explosive force
	this.mode = 'colorful'; // Normal or colorful

	// ATTRIBUTES
	this.canvas = {
		ctx: $('#bg')[0].getContext("2d"),
		WIDTH: $("#bg").width(),
		HEIGHT: $("#bg").height(),
		canvasMinX: $("#bg").offset().left,
		canvasMaxX: this.canvasMinX + this.WIDTH,
		canvasMinY: $("#bg").offset().top,
		canvasMaxY: this.canvasMinY + this.HEIGHT
	}

	this.mouse = {
		s: {
			x: 0,
			y: 0
		}, // Mouse speed
		p: {
			x: 0,
			y: 0
		} // Mouse position
	}

	this.content = {
		text: null,
		recalculate: true,
		size: 0
	};

	this.edges = new Array();
	this.modeChanged = true;
	this.explode = {
		x: null,
		y: null,
		do :
		false
	}
	// METHODS
	this.fade = function () {
		if (!this.fadeOut) return true;
		this.canvas.ctx.fillStyle = "rgba(0,0,0," + this.fadeAmount + ")";
		this.canvas.ctx.fillRect(0, 0, this.canvas.WIDTH, this.canvas.HEIGHT);
	}

	this.clear = function () {
		// Clear canvas
		this.canvas.ctx.clearRect(0, 0, this.canvas.WIDTH, this.canvas.HEIGHT);
	}

	this.drawText = function (callback) {
		console.log('drawText');
		if (this.content.recalculate) {
			console.log('Recalculating size');
			this.content.size = 1;
			var textSize;
			// Fit text:
			do {
				this.canvas.ctx.font = "bold " + this.content.size + "px sans-serif";
				textSize = this.canvas.ctx.measureText(this.content.text);
				this.content.size++;
			} while (textSize.width < this.canvas.WIDTH && this.content.size < this.canvas.HEIGHT);
			// Size done, recalculating resolution
			this.resolution = Math.ceil(this.content.size / 35);
			//this.minRad = Math.ceil(28240/this.content.size);
			this.maxRad = Math.ceil(10590 / this.content.size);
			console.log('Using resolution: ' + this.resolution);
		}

		console.log('Using size: ' + this.content.size);

		this.content.recalculate = false;

		this.canvas.ctx.font = "bold " + this.content.size + "px sans-serif";
		this.canvas.ctx.fillStyle = "#fff";
		this.canvas.ctx.fillText(this.content.text, 0, this.content.size);

		callback.call();
	}

	this.write = function (content, effect, extra) {
		// Store text
		this.content.text = content;
		console.log('Writing ' + this.content.text);
		this.resizeCanvas();
		this.clear();
		this.drawText($.proxy(function () {
			switch (effect) {
			case 'circles':
				this.findEdges(extra);
			}
		}, this));
	}

	this.resizeCanvas = function () {
		this.content.recalculate = true;

		this.canvas.WIDTH = window.innerWidth;
		this.canvas.HEIGHT = window.innerHeight;

		$("#bg").attr('width', this.canvas.WIDTH);
		$("#bg").attr('height', this.canvas.HEIGHT);
	}

	this.newColor = function () {
		return 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.random() + ')';
	}

	this.circle = function (x, y, rad, color) {
		// Circulo
		this.canvas.ctx.fillStyle = color;
		this.canvas.ctx.beginPath();
		this.canvas.ctx.arc(x, y, rad, 0, Math.PI * 2, true);
		this.canvas.ctx.closePath();
		this.canvas.ctx.fill();
	}

	this.mouseMove = function (e) {
		this.mouse.s.x = Math.max(Math.min(e.pageX - this.mouse.p.x, 40), -40);
		this.mouse.s.y = Math.max(Math.min(e.pageY - this.mouse.p.y, 40), -40);

		this.mouse.p.x = e.pageX - this.canvas.canvasMinX;
		this.mouse.p.y = e.pageY - this.canvas.canvasMinY;
	}

	this.logCoords = function (e) {
		console.log([e.pageX - this.canvas.canvasMinX, e.pageY - this.canvas.canvasMinY]);
	}

	this.findEdges = function (colors) {
		console.log('Finding edges');
		// Sweep image finding the coordinates of the edges
		var pix = this.canvas.ctx.getImageData(0, 0, this.canvas.WIDTH, this.canvas.HEIGHT);
		//
		for (var y = 0; y < pix.height; y += this.resolution) {
			for (var x = 0; x < pix.width; x += this.resolution) {
				// Generate square average
				var found = false,
					auxAvg = 0,
					points = 0;
				for (var x1 = 0; x1 < this.resolution; x1++) {
					for (var y1 = 0; y1 < this.resolution; y1++) {
						// I now have all needed pointers
						// Get the index inside pix array
						var pixIndex = ((y + y1) * pix.width + x + x1) * 4;
						auxAvg += (pix.data[pixIndex] + pix.data[pixIndex + 1] + pix.data[pixIndex + 2]) / 3;
						points++;
					}
					auxAvg = auxAvg / points;
					//if(auxAvg>0) console.log(auxAvg);
					if (auxAvg > 0 && auxAvg < 255 - (255 * this.tolerance)) {
						found = true;
						break;
					}
				}
				if (found) {
					console.log('Edge found');
					// Found edge, store coordinates
					this.edges.push([Math.round((x + this.resolution) / 2) * 2, Math.round((y + this.resolution) / 2) * 2 + this.canvas.HEIGHT / 2 - this.content.size / 1.3]);
				}
			}
		}
		console.log(this.edges);
		this.circleEdges(colors, new Array());
	}

	// Generate an explosion at the coordinates defined
	// by event e
	this.explosion = function (e) {
		this.explode = {
			x: e.pageX,
			y: e.pageY,
			do :
			true
		}
		console.log(this.explode);
	}

	// Sets a property
	this.set = function (name, val) {
		switch (name) {
		case 'mode':
			this.mode = val;
			this.modeChanged = true;
			break;
		}
	}

	this.applyColors = function (colors, circles) {
		if (this.mode == 'colorful') {
			for (var a = 0; a < colors.length; a++) {
				var randColor = this.newColor();
				for (var i = 0; i < total; i++) {
					circles[a][i].color = randColor;
				}
			}
		} else if (this.mode == 'normal') {
			for (var a = 0; a < colors.length; a++) {
				for (var i = 0; i < total; i++) {
					circles[a][i].color = colors[a];
				}
			}
		}
	}

	// Approximate function for distance calc
	this.distance = function (dx, dy) {
		return 1.426776695 * Math.min(0.7071067812 * (Math.abs(dx) + Math.abs(dy)), Math.max(Math.abs(dx), Math.abs(dy)));
	}

	// Effect: Circles
	// Draw randomly growing circles on each edge
	this.circleEdges = function (colors, circles) {
		// Circles contains one circles array for each color
		var total = this.edges.length;
		this.clear();
		for (var a = 0; a < colors.length; a++) {
			// Check if they have been built yet
			if (circles[a] == undefined) {
				console.log('Setting up arrays');
				circles[a] = new Array;
				for (var i = 0; i < total; i++) {
					// dx and dy are speed of the circle
					// because the circle will revolve around its real center
					// following 'gravitational' laws
					circles[a].push({
						rad: Math.random() * this.maxInitRad,
						dx: Math.sin(Math.random() * 100 + i + a),
						dy: Math.cos(Math.random() * 100 + i + a),
						x: Math.random() * this.canvas.WIDTH,
						y: Math.random() * this.canvas.HEIGHT,
						color: colors[a]
					});
				}
			}

			var nextColor;
			if (this.modeChanged) {
				nextColor = colors[a];
				if (this.mode == 'colorful') nextColor = this.newColor();
			} else {
				// Mutate the color a little bit
				var current = circles[a][0].color,
					c = current.substring(current.indexOf('(') + 1, current.lastIndexOf(')')).split(/,\s*/);
				// And set the color
				nextColor = 'rgba(' + Math.round(Math.max(0, Math.min(parseInt(c[0]) + Math.sin(Math.random() * 180), 255))) + ',' + Math.round(Math.max(0, Math.min(parseInt(c[1]) + Math.cos(Math.random() * 180), 255))) + ',' + Math.round(Math.max(0, Math.min(parseInt(c[2]) + Math.sin(Math.random() * 180), 255))) + ',' + Math.max(Math.min(parseFloat(c[3]) + Math.cos(Math.random() * 180 * parseFloat(c[3])) * 0.005, 1), 0) + ')';
				//debugger;
			}

			for (var i = 0; i < total; i++) {
				// Handle color changes
				circles[a][i].color = nextColor;
				circles[a][i].rad += Math.sin(Math.random() * 180 + i) * this.variation;

				if (circles[a][i].rad < this.minRad) circles[a][i].rad = this.minRad;
				if (circles[a][i].rad > this.maxRad) circles[a][i].rad = this.maxRad;

				// Update speed if explosion happened nearby
				if (this.explode.do) {
					var dx = circles[a][i].x - this.explode.x,
						dy = circles[a][i].y - this.explode.y,
						explosion = this.distance(dx, dy);
					if (explosion < this.explosionRadius) {
						// The force vector is away from the explosion center
						// and the explosion force is based on the distance to it
						var force = {
							x: dx * explosion * this.explosionForce / circles[a][i].rad,
							y: dy * explosion * this.explosionForce / circles[a][i].rad
						};

						// Update speed
						circles[a][i].dx = force.x;
						circles[a][i].dy = force.y;

						circles[a][i].color = 'rgba(255,255,255,1)';
					}
				}

				// Update position
				circles[a][i].x += circles[a][i].dx;
				circles[a][i].y += circles[a][i].dy;

				// Attraction delta, vector from circle center to real center
				var delta = {
					x: this.edges[i][0] - circles[a][i].x,
					y: this.edges[i][1] - circles[a][i].y
				};

				// Calculate vector force based on distance from centers
				var gravity = this.distance(delta.x, delta.y);

				// Attraction force
				var force = {
					x: delta.x * gravity * this.attraction * circles[a][i].rad * Math.random(),
					y: delta.y * gravity * this.attraction * circles[a][i].rad * Math.random()
				};
				// Update speed
				circles[a][i].dx += force.x;
				circles[a][i].dy += force.y;

				if (circles[a][i].dx > this.maxSpeed) circles[a][i].dx = this.maxSpeed;
				if (circles[a][i].dy > this.maxSpeed) circles[a][i].dy = this.maxSpeed;


				/*// Line from center to center
				this.canvas.ctx.strokeStyle = 'rgba(255,255,255,0.01)';
				this.canvas.ctx.moveTo(this.edges[i][0],this.edges[i][1]);
				this.canvas.ctx.lineTo(circles[a][i].x,circles[a][i].y);
				this.canvas.ctx.stroke();
				
				// Forces
				this.canvas.ctx.strokeStyle = 'rgba(0,255,0,0.01)';
				this.canvas.ctx.moveTo(circles[a][i].x,circles[a][i].y);
				this.canvas.ctx.lineTo(circles[a][i].x+circles[a][i].dx*gravity*0.1,circles[a][i].y+circles[a][i].dy*gravity*0.1);
				this.canvas.ctx.stroke();*/


				// Draw
				this.circle(circles[a][i].x, circles[a][i].y, circles[a][i].rad, circles[a][i].color);
			}
		}
		if (this.modeChanged) this.modeChanged = false;
		if (this.explode.do) this.explode.do = false;
		setTimeout($.proxy(function () {
			this.circleEdges(colors, circles);
		}, this), 1);
	}
}