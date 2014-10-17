/**
 * Nebula
 * An HTML5+JS nebulosa effect, it displays text by making circles float inside it.
 *
 * @author Alejandro U. Alvarez (http://urbanoalvarez.es)
 */
var Nebula = function (options) {

	var settings = {
		container: $('canvas'),
		resolution: 20,
		tolerance: 0, // 0 to 1
		minRad: 0,
		maxRad: 40,
		maxInitRad: 0.001,
		maxSpeed: 2,
		variation: 0.2,
		explosionRadius: 100,
		attraction: 0.00001, // Attraction towards their real center, based on distance
		explosionForce: 0.01, // Explosive force
		mode: 'colorful', // Normal or colorful
		debug: true,
		drawFn: 'circle',
		showForce: false,
		showDistance: false,
		wait: 1,
		showEdges: false,
		resolutionScale: 35,
		radLimitScale: 10600,
		fadeAmount: 0,
		fadeColor: 'rgb(0,0,0)'
	};

	var nebula = {},
		drawingFn = {};

	settings = $.extend(settings, options);

	// Internal attributes
	var canvas = {
			ctx: settings.container[0].getContext("2d"),
			WIDTH: settings.container.width(),
			HEIGHT: settings.container.height(),
			canvasMinX: settings.container.offset().left,
			canvasMaxX: settings.container.offset().left + settings.container.width(),
			canvasMinY: settings.container.offset().top,
			canvasMaxY: settings.container.offset().top + settings.container.height()
		},
		mouse = {
			// Mouse speed
			s: {
				x: 0,
				y: 0
			},
			// Mouse position
			p: {
				x: 0,
				y: 0
			}
		},
		content = {
			text: null,
			recalculate: true,
			size: 0
		},
		edges = new Array(),
		modeChanged = true,
		explode = {
			x: null,
			y: null,
			do :
			false
		}

	// METHODS
	nebula.drawText = function (callback) {
		debug('drawText');
		if (content.recalculate) {
			debug('Recalculating size');
			content.size = 1;
			var textSize;
			// Fit text:
			do {
				canvas.ctx.font = "bold " + content.size + "px sans-serif";
				textSize = canvas.ctx.measureText(content.text);
				content.size++;
			} while (textSize.width < canvas.WIDTH && content.size < canvas.HEIGHT);
			// Size done, recalculating resolution
			settings.resolution = Math.ceil(content.size / settings.resolutionScale);
			settings.maxRad = Math.ceil(settings.radLimitScale / content.size);
			debug('Using resolution: ' + settings.resolution);
		}

		debug('Using size: ' + content.size);

		content.recalculate = false;

		canvas.ctx.font = "bold " + content.size + "px sans-serif";
		canvas.ctx.fillStyle = "#fff";
		canvas.ctx.fillText(content.text, 0, content.size);

		callback.call();
	}

	nebula.write = function (text, colors) {
		// Store text
		content.text = text;
		debug('Writing ' + content.text);
		nebula.resizeCanvas();
		clear();
		nebula.drawText(function () {
			nebula.findEdges(colors);
		});
	}

	nebula.resizeCanvas = function () {
		content.recalculate = true;

		canvas.WIDTH = window.innerWidth;
		canvas.HEIGHT = window.innerHeight;

		settings.container.attr('width', canvas.WIDTH);
		settings.container.attr('height', canvas.HEIGHT);
	}

	nebula.newColor = function () {
		return 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.random() + ')';
	}

	nebula.mouseMove = function (e) {
		mouse.s.x = Math.max(Math.min(e.pageX - mouse.p.x, 40), -40);
		mouse.s.y = Math.max(Math.min(e.pageY - mouse.p.y, 40), -40);

		mouse.p.x = e.pageX - canvas.canvasMinX;
		mouse.p.y = e.pageY - canvas.canvasMinY;
	}

	nebula.logCoords = function (e) {
		debug([e.pageX - canvas.canvasMinX, e.pageY - canvas.canvasMinY]);
	}

	nebula.findEdges = function (colors) {
		debug('Finding edges');
		// Sweep image finding the coordinates of the edges
		var pix = canvas.ctx.getImageData(0, 0, canvas.WIDTH, canvas.HEIGHT);
		//
		for (var y = 0; y < pix.height; y += settings.resolution) {
			for (var x = 0; x < pix.width; x += settings.resolution) {
				// Generate square average
				var found = false,
					auxAvg = 0,
					points = 0;
				for (var x1 = 0; x1 < settings.resolution; x1++) {
					for (var y1 = 0; y1 < settings.resolution; y1++) {
						// I now have all needed pointers
						// Get the index inside pix array
						var pixIndex = ((y + y1) * pix.width + x + x1) * 4;
						auxAvg += (pix.data[pixIndex] + pix.data[pixIndex + 1] + pix.data[pixIndex + 2]) / 3;
						points++;
					}
					auxAvg = auxAvg / points;
					//if(auxAvg>0) debug(auxAvg);
					if (auxAvg > 0 && auxAvg < 255 - (255 * settings.tolerance)) {
						found = true;
						break;
					}
				}
				if (found) {
					// Found edge, store coordinates
					edges.push([Math.round((x + settings.resolution) / 2) * 2, Math.round((y + settings.resolution) / 2) * 2 + canvas.HEIGHT / 2 - content.size / 1.3]);
				}
			}
		}
		debug(edges);
		clear();
		nebula.drawNodes(colors, new Array());
	}

	// Generate an explosion at the coordinates defined
	// by event e
	nebula.explosion = function (e) {
		explode = {
			x: e.pageX,
			y: e.pageY,
			do :
			true
		}
		debug("Explode: ", explode);
	}

	// Sets a property
	nebula.set = function (name, val) {
		switch (name) {
		case 'mode':
			settings.mode = val;
			settings.modeChanged = true;
			break;
		}
	}

	nebula.applyColors = function (colors, circles) {
		if (settings.mode == 'colorful') {
			for (var a = 0; a < colors.length; a++) {
				var randColor = nebula.newColor();
				for (var i = 0; i < total; i++) {
					circles[a][i].color = randColor;
				}
			}
		} else if (settings.mode == 'normal') {
			for (var a = 0; a < colors.length; a++) {
				for (var i = 0; i < total; i++) {
					circles[a][i].color = colors[a];
				}
			}
		}
	}

	// Approximate function for distance calc
	nebula.distance = function (dx, dy) {
		return 1.426776695 * Math.min(0.7071067812 * (Math.abs(dx) + Math.abs(dy)), Math.max(Math.abs(dx), Math.abs(dy)));
	}

	// Effect: Circles
	// Draw randomly growing nodes on each edge
	nebula.drawNodes = function (colors, nodes) {
		var total = edges.length;
		if (settings.fadeAmount > 0) {
			fade();
		} else {
			clear();
		}


		for (var a = 0; a < colors.length; a++) {
			// Check if they have been built yet
			if (nodes[a] == undefined) {
				debug('Setting up arrays');
				nodes[a] = new Array;
				for (var i = 0; i < total; i++) {
					// dx and dy are speed of the circle
					// because the circle will revolve around its real center
					// following 'gravitational' laws
					nodes[a].push({
						rad: Math.random() * settings.maxInitRad,
						dx: Math.sin(Math.random() * 360 + i + a),
						dy: Math.cos(Math.random() * 360 + i + a),
						x: Math.random() * canvas.WIDTH,
						y: Math.random() * canvas.HEIGHT,
						color: colors[a]
					});
				}
			}

			var nextColor;
			if (settings.modeChanged) {
				nextColor = colors[a];
				if (settings.mode == 'colorful') nextColor = nebula.newColor();
			} else {
				// Mutate the color a little bit
				var current = nodes[a][0].color,
					c = current.substring(current.indexOf('(') + 1, current.lastIndexOf(')')).split(/,\s*/);
				// And set the color
				nextColor = 'rgba(' + Math.round(Math.max(0, Math.min(parseInt(c[0]) + Math.sin(Math.random() * 180), 255))) + ',' + Math.round(Math.max(0, Math.min(parseInt(c[1]) + Math.cos(Math.random() * 180), 255))) + ',' + Math.round(Math.max(0, Math.min(parseInt(c[2]) + Math.sin(Math.random() * 180), 255))) + ',' + Math.max(Math.min(parseFloat(c[3]) + Math.cos(Math.random() * 180 * parseFloat(c[3])) * 0.005, 1), 0) + ')';
			}

			for (var i = 0; i < total; i++) {
				// Handle color changes
				nodes[a][i].color = nextColor;
				nodes[a][i].rad += Math.sin(Math.random() * 180 + i) * settings.variation;

				if (nodes[a][i].rad < settings.minRad) nodes[a][i].rad = settings.minRad;
				if (nodes[a][i].rad > settings.maxRad) nodes[a][i].rad = settings.maxRad;

				// Update speed if explosion happened nearby
				if (explode.do) {
					var dx = nodes[a][i].x - explode.x,
						dy = nodes[a][i].y - explode.y,
						explosion = nebula.distance(dx, dy);
					if (explosion < settings.explosionRadius) {
						// The force vector is away from the explosion center
						// and the explosion force is based on the distance to it
						var force = {
							x: dx * explosion * settings.explosionForce / nodes[a][i].rad,
							y: dy * explosion * settings.explosionForce / nodes[a][i].rad
						};

						// Update speed
						nodes[a][i].dx = force.x;
						nodes[a][i].dy = force.y;

						nodes[a][i].color = 'rgba(255,255,255,1)';
					}
				}

				// Update position
				nodes[a][i].x += nodes[a][i].dx;
				nodes[a][i].y += nodes[a][i].dy;

				// Attraction delta, vector from circle center to real center
				var delta = {
					x: edges[i][0] - nodes[a][i].x,
					y: edges[i][1] - nodes[a][i].y
				};

				// Calculate vector force based on distance from centers
				var gravity = nebula.distance(delta.x, delta.y);

				// Attraction force
				var force = {
					x: delta.x * gravity * settings.attraction * nodes[a][i].rad * Math.random(),
					y: delta.y * gravity * settings.attraction * nodes[a][i].rad * Math.random()
				};
				// Update speed
				nodes[a][i].dx += force.x;
				nodes[a][i].dy += force.y;

				if (nodes[a][i].dx > settings.maxSpeed) nodes[a][i].dx = settings.maxSpeed;
				if (nodes[a][i].dy > settings.maxSpeed) nodes[a][i].dy = settings.maxSpeed;

				// Mark edges
				if (settings.showEdges) {
					drawingFn.circle(edges[i][0], edges[i][1], 10, 'rgba(255,255,255,0.01)', canvas);
				}


				// Line from center to center
				if (settings.showDistance) {
					canvas.ctx.strokeStyle = 'rgba(255,255,255,0.01)';
					canvas.ctx.moveTo(edges[i][0], edges[i][1]);
					canvas.ctx.lineTo(nodes[a][i].x, nodes[a][i].y);
					canvas.ctx.stroke();
				}

				// Forces
				if (settings.showForce) {
					canvas.ctx.strokeStyle = 'rgba(0,255,0,0.01)';
					canvas.ctx.moveTo(nodes[a][i].x, nodes[a][i].y);
					canvas.ctx.lineTo(nodes[a][i].x + nodes[a][i].dx * gravity * 0.1, nodes[a][i].y + nodes[a][i].dy * gravity * 0.1);
					canvas.ctx.stroke();
				}


				// Draw
				if (typeof settings.drawFn === 'function') {
					settings.drawFn(nodes[a][i].x, nodes[a][i].y, nodes[a][i].rad, nodes[a][i].color, canvas);
				} else {
					var fn = drawingFn[settings.drawFn];
					if (typeof fn === 'function') {
						fn(nodes[a][i].x, nodes[a][i].y, nodes[a][i].rad, nodes[a][i].color, canvas);
					} else {
						console.error("The drawing function specified is invalid");
						return;
					}
				}

			}
		}
		if (settings.modeChanged) settings.modeChanged = false;
		if (explode.do) explode.do = false;

		setTimeout(function () {
			nebula.drawNodes(colors, nodes);
		}, settings.wait);
	}

	/* Drawing functions */

	drawingFn.circle = function (x, y, rad, color, canvasObj) {
		// Circulo
		canvasObj.ctx.fillStyle = color;
		canvasObj.ctx.beginPath();
		canvasObj.ctx.arc(x, y, rad, 0, Math.PI * 2, true);
		canvasObj.ctx.closePath();
		canvasObj.ctx.fill();
	}

	drawingFn.rectangle = function (x, y, rad, color, canvasObj) {
		// Circulo
		canvasObj.ctx.fillStyle = color;
		canvasObj.ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
	}

	/* Internal functions */

	function fade() {
		var color = getRGB(settings.fadeColor);
		canvas.ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + settings.fadeAmount + ")";
		canvas.ctx.fillRect(0, 0, canvas.WIDTH, canvas.HEIGHT);
	}

	function clear() {
		// Clear canvas
		canvas.ctx.clearRect(0, 0, canvas.WIDTH, canvas.HEIGHT);
	}

	function getRGB(color) {
		var rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		return {
			r: rgb[1],
			g: rgb[2],
			b: rgb[3]
		};
	}

	function debug() {
		if (settings.debug) console.log.apply(console, arguments);
	}

	return nebula;
}