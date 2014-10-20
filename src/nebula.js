/**
 * Nebula
 * An HTML5+JS nebulosa effect, it displays text by making circles float inside it.
 *
 *  -- Powered by Pixi.js for the rendering --
 *  	     http://www.pixijs.com/
 *
 * @author Alejandro U. Alvarez (http://urbanoalvarez.es)
 */
var Nebula = function (options) {

	var nebula = {},
		drawingFn = {};

	nebula.settings = {
		container: $('canvas'),
		resolution: 20,
		tolerance: 0, // 0 to 1
		minRad: 0,
		maxRad: 40,
		maxInitRad: 0.001,
		maxSpeed: 2,
		variation: 0.2,
		explosionRadius: 100,
		attraction: 0.1, // Attraction towards their real center, based on distance
		explosionForce: 0.01, // Explosive force
		mode: 'colorful', // Normal or colorful
		debug: true,
		drawFn: 'circle',
		showForce: false,
		showDistance: false,
		wait: 10,
		showEdges: false,
		resolutionScale: 35,
		radLimitScale: 10600,
		fadeAmount: 0,
		fadeColor: [0, 0, 0]
	};

	nebula.text = 'nebula';

	nebula.settings = $.extend(nebula.settings, options);

	// Internal attributes
	var canvas = {
		el: document.createElement('canvas'),
		ctx: null,
		canvasMinX: nebula.settings.container.offset().left,
		canvasMaxX: nebula.settings.container.offset().left + nebula.settings.container.width(),
		canvasMinY: nebula.settings.container.offset().top,
		canvasMaxY: nebula.settings.container.offset().top + nebula.settings.container.height()
	};

	canvas.el.width = nebula.settings.container.width();
	canvas.el.height = nebula.settings.container.height();
	canvas.ctx = canvas.el.getContext('2d');

	var mouse = {
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
		nodes = [],
		modeChanged = true,
		explode = {
			x: null,
			y: null,
			do :
			false
		},
		textChanged = false;

	// Setup pixi
	// create an new instance of a pixi stage
	var stage = new PIXI.Stage(0x000000),
		renderer = PIXI.autoDetectRenderer(canvas.el.width, canvas.el.height, null, false, true);

	// add the renderer view element to the DOM
	nebula.settings.container.append(renderer.view);

	requestAnimFrame(animate);

	var circle = new element(100, 100, 34, 34, 10, webGLcolor('#ff0000'));

	function animate() {

		circle.graphics.position.x += Math.random() * Math.cos(Math.random() * 360);
		circle.graphics.position.y += Math.random() * Math.cos(Math.random() * 360);

		requestAnimFrame(animate);

		// render the stage   
		renderer.render(stage);
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
			nebula.settings.resolution = Math.ceil(content.size / nebula.settings.resolutionScale);
			nebula.settings.maxRad = Math.ceil(nebula.settings.radLimitScale / content.size);
			debug('Using resolution: ' + nebula.settings.resolution);
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
		content.text = text || nebula.text;
		nebula.text = content.text;

		if (nodes.length > 0) {
			// Set everything back to default and stop the timer
			textChanged = true;
			nodes = [];
			content = {
				text: text || nebula.text,
				recalculate: true,
				size: 0
			};

			stage.removeAll();
		}

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

		nebula.settings.container.attr('width', canvas.WIDTH);
		nebula.settings.container.attr('height', canvas.HEIGHT);
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
		for (var y = 0; y < pix.height; y += nebula.settings.resolution) {
			for (var x = 0; x < pix.width; x += nebula.settings.resolution) {
				// Generate square average
				var found = false,
					auxAvg = 0,
					points = 0;
				for (var x1 = 0; x1 < nebula.settings.resolution; x1++) {
					for (var y1 = 0; y1 < nebula.settings.resolution; y1++) {
						// I now have all needed pointers
						// Get the index inside pix array
						var pixIndex = ((y + y1) * pix.width + x + x1) * 4;
						auxAvg += (pix.data[pixIndex] + pix.data[pixIndex + 1] + pix.data[pixIndex + 2]) / 3;
						points++;
					}
					auxAvg = auxAvg / points;
					//if(auxAvg>0) debug(auxAvg);
					if (auxAvg > 0 && auxAvg < 255 - (255 * nebula.settings.tolerance)) {
						found = true;
						break;
					}
				}
				if (found) {

					var coords = {
						x: Math.round((x + nebula.settings.resolution) / 2) * 2,
						y: Math.round((y + nebula.settings.resolution) / 2) * 2 + canvas.HEIGHT / 2 - content.size / 1.3
					};

					for (var i = 0; i < colors.length; i++) {
						nodes.push(new element(Math.random() * canvas.WIDTH, Math.random() * canvas.HEIGHT, coords.x, coords.y, Math.random() * nebula.settings.maxInitRad, colors[i]));
					}
				}
			}
		}
		debug(nodes);
		clear();
		nebula.drawNodes(colors);
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
			nebula.settings.mode = val;
			nebula.settings.modeChanged = true;
			break;
		}
	}

	nebula.applyColors = function (colors, circles) {
		if (nebula.settings.mode == 'colorful') {
			for (var a = 0; a < colors.length; a++) {
				var randColor = nebula.newColor();
				for (var i = 0; i < total; i++) {
					circles[a][i].color = randColor;
				}
			}
		} else if (nebula.settings.mode == 'normal') {
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

	// Draw randomly growing nodes on each edge
	nebula.drawNodes = function (colors) {

		var total = nodes.length;

		if (nebula.settings.fadeAmount > 0) {
			fade();
		} else {
			clear();
		}

		var nextColor;
		if (nebula.settings.modeChanged) {
			nextColor = colors[a];
			if (nebula.settings.mode == 'colorful') nextColor = nebula.newColor();
		} else {
			// Mutate the color a little bit
			var current = nodes[a][0].color,
				c = current.substring(current.indexOf('(') + 1, current.lastIndexOf(')')).split(/,\s*/);
			// And set the color
			nextColor = 'rgba(' + Math.round(Math.max(0, Math.min(parseInt(c[0]) + Math.sin(Math.random() * 180), 255))) + ',' + Math.round(Math.max(0, Math.min(parseInt(c[1]) + Math.cos(Math.random() * 180), 255))) + ',' + Math.round(Math.max(0, Math.min(parseInt(c[2]) + Math.sin(Math.random() * 180), 255))) + ',' + Math.max(Math.min(parseFloat(c[3]) + Math.cos(Math.random() * 180 * parseFloat(c[3])) * 0.005, 1), 0) + ')';
		}
		nextColor = webGLcolor(nextColor);

		for (var i = 0; i < total; i++) {
			// Handle color changes
			nodes[a][i].graphics.clear();

			if (nodes[a][i].rad < nebula.settings.minRad) nodes[a][i].rad = nebula.settings.minRad;
			if (nodes[a][i].rad > nebula.settings.maxRad) nodes[a][i].rad = nebula.settings.maxRad;

			// Update speed if explosion happened nearby
			if (explode.do) {
				var dx = nodes[a][i].x - explode.x,
					dy = nodes[a][i].y - explode.y,
					explosion = nebula.distance(dx, dy);
				if (explosion < nebula.settings.explosionRadius) {
					// The force vector is away from the explosion center
					// and the explosion force is based on the distance to it
					var force = {
						x: dx * explosion * nebula.settings.explosionForce / nodes[a][i].rad,
						y: dy * explosion * nebula.settings.explosionForce / nodes[a][i].rad
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
				x: delta.x * gravity * nebula.settings.attraction * 0.0001 * nodes[a][i].rad * Math.random(),
				y: delta.y * gravity * nebula.settings.attraction * 0.0001 * nodes[a][i].rad * Math.random()
			};
			// Update speed
			nodes[a][i].dx += force.x;
			nodes[a][i].dy += force.y;

			if (nodes[a][i].dx > nebula.settings.maxSpeed) nodes[a][i].dx = nebula.settings.maxSpeed;
			if (nodes[a][i].dy > nebula.settings.maxSpeed) nodes[a][i].dy = nebula.settings.maxSpeed;

			// Mark edges
			if (nebula.settings.showEdges) {
				drawingFn.rectangle(edges[i][0], edges[i][1], 10, 'rgba(255,255,255,0.01)', canvas);
			}


			// Line from center to center
			if (nebula.settings.showDistance) {
				canvas.ctx.strokeStyle = 'rgba(255,255,255,0.01)';
				canvas.ctx.moveTo(edges[i][0], edges[i][1]);
				canvas.ctx.lineTo(nodes[a][i].x, nodes[a][i].y);
				canvas.ctx.stroke();
			}

			// Forces
			if (nebula.settings.showForce) {
				canvas.ctx.strokeStyle = 'rgba(0,255,0,0.01)';
				canvas.ctx.moveTo(nodes[a][i].x, nodes[a][i].y);
				canvas.ctx.lineTo(nodes[a][i].x + nodes[a][i].dx * gravity * 0.1, nodes[a][i].y + nodes[a][i].dy * gravity * 0.1);
				canvas.ctx.stroke();
			}


			// Draw
			if (typeof nebula.settings.drawFn === 'function') {
				nebula.settings.drawFn(nodes[a][i].x, nodes[a][i].y, nodes[a][i].rad, nodes[a][i].color, canvas);
			} else {
				var fn = drawingFn[nebula.settings.drawFn];
				if (typeof fn === 'function') {
					fn(nodes[a][i].x, nodes[a][i].y, nodes[a][i].rad, nodes[a][i].color, canvas);
				} else {
					console.error("The drawing function specified is invalid");
					return;
				}
			}

		}
		if (nebula.settings.modeChanged) nebula.settings.modeChanged = false;
		if (explode.do) explode.do = false;

		if (!textChanged) {
			setTimeout(function () {
				nebula.drawNodes(colors, nodes);
			}, nebula.settings.wait);
		} else {
			textChanged = false;
		}


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
		var color = nebula.settings.fadeColor;
		canvas.ctx.fillStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + nebula.settings.fadeAmount + ")";
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

	function webGLcolor(hex) {
		return eval('0x' + hex.substr(1))
	}

	function debug() {
		if (nebula.settings.debug) console.log.apply(console, arguments);
	}

	function graphicsEl(x, y, destX, destY, rad, color) {
		var el = {
			destX: destX,
			destY: destY,
			graphics: new PIXI.Graphics()
		};
		el.graphics.beginFill(color, 0.7);
		el.graphics.drawCircle(x, y, rad);
		stage.addChild(el.graphics);

		return el;
	}

	function element(graphics, x, y, rad) {
		graphics.drawCircle(x, y, rad);
	}

	return nebula;
}