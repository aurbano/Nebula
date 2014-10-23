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
		container: $('#nebula'),
		resolution: 20,
		tolerance: 0, // 0 to 1
		minRad: 3,
		maxRad: 40,
		maxInitRad: 2,
		maxSpeed: 5,
		speedReduction: 0.8,
		variation: 0.2,
		explosionRadius: 150,
		attraction: 0.08, // Attraction towards their real center, based on distance
		explosionForce: 0.05, // Explosive force
		mode: 'colorful', // Normal or colorful
		debug: true,
		drawFn: 'rectangle',
		showForce: false,
		showDistance: false,
		wait: 10,
		showEdges: false,
		resolutionScale: 35,
		radLimitScale: 10600,
		fadeAmount: 0,
		fadeColor: [0, 0, 0],
		showNodes: true,
		variableLineWidth: false,
		drag: 0.001,
		explosionBlur: 1,
		maxExplosionBlur: 20,
		bgColor: 0x000000,
		blendMode: 'ADD'
	};

	nebula.text = 'alex';

	nebula.settings = $.extend(nebula.settings, options);

	// Internal attributes
	var canvas = {
		el: document.createElement('canvas'),
		ctx: null,
		HEIGHT: nebula.settings.container.height(),
		WIDTH: nebula.settings.container.width(),
		canvasMinX: nebula.settings.container.offset().left,
		canvasMaxX: nebula.settings.container.offset().left + nebula.settings.container.width(),
		canvasMinY: nebula.settings.container.offset().top,
		canvasMaxY: nebula.settings.container.offset().top + nebula.settings.container.height()
	};

	// Resize canvas to fit container
	canvas.el.width = nebula.settings.container.width();
	canvas.el.height = nebula.settings.container.height();
	canvas.ctx = canvas.el.getContext('2d');

	var content = {
			text: null,
			recalculate: true,
			size: 0
		},
		colors = [],
		nodes = [],
		modeChanged = true,
		explode = {
			x: null,
			y: null,
			done: false,
			exploding: 0
		},
		textChanged = false;

	// Setup pixi
	// create an new instance of a pixi stage
	var stage = new PIXI.Stage(nebula.settings.bgColor),
		renderer = PIXI.autoDetectRenderer(canvas.el.width, canvas.el.height, null, false, true),
		circleGraphics = new PIXI.Graphics(),
		extras = new PIXI.Graphics(),
		blurFilter = new PIXI.BlurFilter();

	blurFilter.blur = 0;

	stage.addChild(extras);
	stage.addChild(circleGraphics);

	circleGraphics.blendMode = PIXI.blendModes[nebula.settings.blendMode];

	// add the renderer view element to the DOM
	nebula.settings.container.append(renderer.view);

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
			//nebula.settings.resolution = Math.ceil(content.size / nebula.settings.resolutionScale);
			debug('Using resolution: ' + nebula.settings.resolution);
		}

		debug('Using size: ' + content.size);

		content.recalculate = false;

		canvas.ctx.font = "bold " + content.size + "px sans-serif";
		canvas.ctx.fillStyle = "#fff";
		canvas.ctx.fillText(content.text, 0, content.size);

		callback.call();
	}

	nebula.write = function (text, colorArr) {
		// Store text
		content.text = text || nebula.text;
		nebula.text = content.text;

		colors = colorArr;

		if (nodes.length > 0) {
			debug("Reseting graphics");
			// Set everything back to default and stop the timer
			textChanged = true;
			content = {
				text: text || nebula.text,
				recalculate: true,
				size: 0
			};
		}

		debug('Writing ' + content.text);
		nebula.resizeCanvas();
		clear();
		nebula.drawText(function () {
			nebula.findEdges();
		});
	}

	nebula.resizeCanvas = function () {
		content.recalculate = true;

		canvas.el.width = canvas.WIDTH = nebula.settings.container.width();
		canvas.el.height = canvas.HEIGHT = nebula.settings.container.height();
	}

	nebula.newColor = function () {
		return 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.random() + ')';
	}

	nebula.logCoords = function (e) {
		debug([e.pageX - canvas.canvasMinX, e.pageY - canvas.canvasMinY]);
	}

	nebula.findEdges = function () {

		var recalculating = false;
		if (nodes.length > 0) recalculating = true;

		var count = 0;

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
						if (!recalculating || count >= nodes.length) {
							nodes.push(graphicsEl(Math.random() * canvas.WIDTH, Math.random() * canvas.HEIGHT, coords.x, coords.y, Math.random() * nebula.settings.maxInitRad, colors[i]));
						} else {
							nodes[count].destX = coords.x;
							nodes[count].destY = coords.y;

							count++;
						}
					}
				}
			}
		}

		if (recalculating) {
			var extraNodes = nodes.length - count;

			for (var i = 0; i < extraNodes; i++) {
				nodes.pop();
			}
		}

		clear();
		nebula.drawNodes();
	}

	// Generate an explosion at the coordinates defined
	// by event e
	nebula.explosion = function (x, y) {
		explode.x = x;
		explode.y = y;
		explode.done = true;
	}

	// Approximate function for distance calc
	nebula.distance = function (dx, dy) {
		return 1.426776695 * Math.min(0.7071067812 * (Math.abs(dx) + Math.abs(dy)), Math.max(Math.abs(dx), Math.abs(dy)));
	}

	nebula.drawNodes = function () {
		requestAnimFrame(nebula.drawNodes);

		nebula.updateNodes();

		renderer.render(stage);
	}

	// Draw randomly growing nodes on each edge
	nebula.updateNodes = function () {
		circleGraphics.clear();
		extras.clear();

		extras.beginFill(0xffffff, 0.1);

		var total = nodes.length;

		/*if (nebula.settings.fadeAmount > 0) {
			fade();
		} else {
			clear();
		}*/
		for (var i = 0; i < total; i++) {

			var current = nodes[i].color,
				c = hexToRgb(webglToHex(current)) || hexToRgb(webglToHex(colors[0])),
				nextColor = [
					Math.round(Math.max(0, Math.min(parseInt(c[0]) + Math.sin(Math.random() * 180), 255))),
					Math.round(Math.max(0, Math.min(parseInt(c[1]) + Math.cos(Math.random() * 180), 255))),
					Math.round(Math.max(0, Math.min(parseInt(c[2]) + Math.sin(Math.random() * 180), 255)))
				];

			nodes[i].color = hexToWebgl(rgbToHex(nextColor[0], nextColor[1], nextColor[2]));
			nodes[i].alpha = Math.max(Math.min(parseFloat(nodes[i].alpha) + Math.cos(Math.random() * 180 * parseFloat(nodes[i].alpha)) * 0.005, 1), 0);

			nodes[i].rad += Math.sin(Math.random() * 180 + i) * nebula.settings.variation;

			nodes[i].rad = Math.max(Math.min(nodes[i].rad, nebula.settings.maxRad), nebula.settings.minRad);

			// Update speed if explosion happened nearby
			if (explode.done) {
				var dx = nodes[i].x - explode.x,
					dy = nodes[i].y - explode.y,
					explosion = nebula.distance(dx, dy);
				if (explosion < nebula.settings.explosionRadius) {
					// The force vector is away from the explosion center
					// and the explosion force is based on the distance to it
					var force = {
						x: dx * explosion * nebula.settings.explosionForce / nodes[i].rad,
						y: dy * explosion * nebula.settings.explosionForce / nodes[i].rad
					};

					// Update speed
					nodes[i].dx = force.x;
					nodes[i].dy = force.y;

					explode.exploding += 0.5;

					circleGraphics.filters = [blurFilter];
				}
			}

			// Update position
			nodes[i].x += nodes[i].dx;
			nodes[i].y += nodes[i].dy;

			// Attraction delta, vector from circle center to real center
			var delta = {
				x: nodes[i].destX - nodes[i].x,
				y: nodes[i].destY - nodes[i].y
			};

			// Calculate vector force based on distance from centers
			var gravity = nebula.distance(delta.x, delta.y);

			// Update speed
			nodes[i].dx += delta.x * gravity * nebula.settings.attraction * 0.0001 * nodes[i].rad * Math.random() - nebula.settings.drag * nodes[i].dx * nodes[i].rad;
			nodes[i].dy += delta.y * gravity * nebula.settings.attraction * 0.0001 * nodes[i].rad * Math.random() - nebula.settings.drag * nodes[i].dy * nodes[i].rad;

			if (Math.abs(nodes[i].dx) > nebula.settings.maxSpeed) nodes[i].dx *= nebula.settings.speedReduction;
			if (Math.abs(nodes[i].dy) > nebula.settings.maxSpeed) nodes[i].dy *= nebula.settings.speedReduction;

			// Redraw
			element(circleGraphics, nodes[i].x, nodes[i].y, nodes[i].rad, nodes[i].color, nodes[i].alpha);

			// Mark edges
			if (nebula.settings.showEdges) {
				extras.lineStyle(1, 0xffffff, 0.3);
				extras.drawRect(nodes[i].destX - 5, nodes[i].destY - 5, 10, 10);
			}


			// Line from center to center
			if (nebula.settings.showDistance) {
				var width = 1;
				if (nebula.settings.variableLineWidth) width *= Math.random();
				extras.lineStyle(width, 0x00ff00, 0.3);
				extras.moveTo(nodes[i].x, nodes[i].y);
				extras.lineTo(nodes[i].destX, nodes[i].destY);
			}

			// Forces
			if (nebula.settings.showForce) {
				var width = 2;
				if (nebula.settings.variableLineWidth) width *= Math.random();
				extras.lineStyle(width, 0xff0000, 0.3);
				extras.moveTo(nodes[i].x, nodes[i].y);
				extras.lineTo(nodes[i].x + nodes[i].dx * gravity * 0.5, nodes[i].y + nodes[i].dy * gravity * 0.5);
			}
		}

		// Manage explosion blur
		if (explode.exploding > 0) {

			var amount = nebula.settings.explosionBlur * explode.exploding;

			explode.exploding -= 1;

			if (explode.exploding < 1 || amount < 1) {
				explode.exploding = 0;
				amount = 0;
				blurFilter.blur = 0;
				circleGraphics.filters = null;
			} else {

				explode.exploding = Math.min(explode.exploding, nebula.settings.maxExplosionBlur);

				blurFilter.blur = amount;
			}
		}

		// Reset counters
		if (nebula.settings.modeChanged) nebula.settings.modeChanged = false;
		if (explode.done) explode.done = false;
		if (textChanged) textChanged = false;
	}

	/* Internal functions */

	function clear() {
		// Clear canvas
		canvas.ctx.clearRect(0, 0, canvas.WIDTH, canvas.HEIGHT);
	}

	// Color functions from http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
	function rgbToHex(r, g, b) {
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	}

	function webglToHex(webglColor) {
		if (webglColor < 0) {
			webglColor = 0xFFFFFFFF + webglColor + 1;
		}

		return '#' + webglColor.toString(16).toUpperCase();
	}

	function hexToWebgl(hex) {
		return parseInt(hex.substr(1), 16);
	}

	function hexToRgb(hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function (m, r, g, b) {
			return r + r + g + g + b + b;
		});

		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? [
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16)
		] : null;
	}

	function debug() {
		if (nebula.settings.debug) console.log.apply(console, arguments);
	}

	function graphicsEl(x, y, destX, destY, rad, color) {
		var el = {
			dx: 0,
			dy: 0,
			x: x,
			y: y,
			color: color,
			alpha: 0.7,
			destX: destX,
			destY: destY,
			rad: rad
		};

		return el;
	}

	function element(graphics, x, y, rad, color, alpha) {
		if (!nebula.settings.showNodes) return;

		var _alpha = alpha || 0.7,
			_color = color || 0xffffff;

		graphics.beginFill(_color, _alpha);

		switch (nebula.settings.drawFn) {
		case 'circle':
			graphics.drawCircle(x, y, rad);
			break;
		case 'rectangle':
		default:
			graphics.drawRect(x - rad, y - rad, rad * 2, rad * 2);
			break;
		}

		graphics.endFill();
	}

	return nebula;
}