#Nebula

> An HTML5+JavaScript Nebula text effect, it displays text by making rectangles/circles float inside it.

![Nebula](https://raw.githubusercontent.com/aurbano/Nebula/master/misc/screenshot.png)

##Installation
Download the source code and include the files in the `src` folder (css and js). You can obviously customize the css to your needs.

Read more about it here: http://urbanoalvarez.es/blog/making-of-nebula-text/

It requires jQuery to work, so make sure it's included before the `nebula.js` script.

##→ Demo
I've built some visualizations using Nebula, if you have created something cool let me know via an issue and I'll add it here

* [Main demo](http://urbanoalvarez.es/Nebula/): Sample demo with dat.gui controls to play with the settings.
* [Music Nebula](http://urbanoalvarez.es/Nebula/music.html): Nebula instance synced (automatically) with an audio track for explosions.
* [Embedded](http://urbanoalvarez.es/blog/making-of-nebula-text/): Example where I have embedded Nebula inside a div on a page.

##Usage
Add an HTML container where you would like the text to appear:

```html
<div id="bg" style="height:100%; width:100%;"></div>
```

**Nebula will resize the experiment to fit this container, so remember to set the size via CSS.**

Now add the following script:

```javascript
$(document).ready(function(){
      var text = new Nebula({
            container: $('#bg')
      });
      
      var name = prompt("What's your name?");
      
      // Write the name using rectangles of the specified colors
      text.write(name, [0xff00ff, 0x63DBFF]);
      
      // Automatic resizing
      $('#bg').resize(function(e){text.resizeCanvas(); });

      // Explosions on click
      $('#bg').click(function(e){
            text.explosion(
                  e.pageX - $(this).offset().left,
                  e.pageY - $(this).offset().top
            );
      });
});
```

The function that starts the drawing is `write(text, colors)`. It accepts 2 parameters as you can see in the example:

* `text`: Determines the text to be drawn
* `colors`: This must be an array of colors in decimal format. For each color a set of particles will appear.

Nebula uses [Pixi.js](https://github.com/GoodBoyDigital/pixi.js) as the rendering engine, it will default to WebGL if possible and fallback to HTML5 canvas.

##Options
The following options can be passed to the constructor for configuration, use the dat.gui controls on the demo to experiment with them.

*Some parameters are only used when setting a new text (resolution, tolerance... ) so you might have to write a new text and hit Enter on the demo.*


| Parameter   |      Values      | Default      |     Description |
|-------------|------------------|--------------|-----------------|
| container   | DOM Element      |  $('#nebula') | jQuery element where the Nebula should appear |
| resolution  | `int`            |  20 | Resolution used to determine the amount of nodes |
| tolerance | `float` | 0 | Tolerance when determining where to place the edges, it shouldn't matter unless at high resolutions|
| minRad | `int` | 0 | Minimum radius that a node can have |
| maxRad | `int` | 40 | Maximum radius that a node can have |
| maxInitRad | `float` | 0.001 | Maximum starting radius, lower looks better because they start growing |
| maxSpeed | `float` | 2 | Maximum speed that a node can have |
| speedReduction | `float` | 0.8 | This multiplies the speed after it passes the maxSpeed parameter to slow it down. |
| variation | `float` | 0.2 | Amount of variation in the radius from one cycle to the next|
| explosionRadius | `int`| 100 | Nodes affected by explosions, higher is more expensive |
| explosionForce | `float` | 0.01 | Force generated in an explosion |
| explosionBlur | `float` | 1 | Blur Radius increment that each explosion produces |
| maxExplosionBlur | `float` | 20 | Maximum explosion blur |
| attraction | `float` | 0.08 | Attraction that the nodes have toward their true center |
| debug | `boolean` | true | Log messages to the console |
| drawFn | `String` | 'rectangle' | Drawing function used, built in functions are 'circle' and 'rectangle'. |
| showForce | `boolean` | false | Draw force lines, very expensive |
| showDistance | `boolean` | false | Draw lines joining each node with its real center, very expensive. |
| showEdges | `boolean` | false | Draw circles indicating each real node center. |
| showNodes | `boolean` | true | Draw the particles |
| resolutionScale | `int` | 35 | Scale the edge resolution, it modifies the number of nodes created |
| radLimitScale | `int` | 10600 | Limit the maximum radius, play with this number to see what it actually does. |
| bgColor | `int` | 0x000000 | Decimal background color, you can use 0xHEX notation, see default value |
| blendMode | `String` | ADD | Blend mode used, options are:  NORMAL, ADD, MULTIPLY, SCREEN, OVERLAY, DARKEN, LIGHTEN, COLOR\_DODGE, COLOR\_BURN, HARD\_LIGHT, SOFT\_LIGHT, DIFFERENCE, EXCLUSION, HUE, SATURATION, COLOR, LUMINOSITY|

To understand what each parameter does open the `index.html` file and play with the dat.gui controls.

##Explosions
Nebula includes an explosion system that you can call using `text.explosion(x, y);`.

###Example

```javascript
var text = new Nebula({
      container: $('#bg')
});

$('#bg').click(function(e){
      text.explosion(
            e.pageX - $(this).offset().left,
            e.pageY - $(this).offset().top
      );
});
```

##Resizing
If you want the Nebula element to fit the container after resizing, call `text.resizeCanvas();`

##Contributing
Feel free to add any issues or send pull requests for bug fixes or new features, they are always welcome!

##License
Nebula is released under the GNU GPLv2 License.

-------

Developed by [Alejandro U. Alvarez](http://urbanoalvarez.es)
