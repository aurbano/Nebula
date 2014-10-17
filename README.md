#Nebula

> An HTML5+JS nebulosa effect, it displays text by making circles float inside it.

##Installation
Download the source code and include the files in the `src` folder (css and js). You can obviously customize the css to your needs.

It requires jQuery to work, so make sure it's included before the `nebula.js` script.

##Usage
Add an HTML canvas where you would like the text to appear:

```html
<canvas width="100%" height="100%" id="bg" style="color:#09F"></canvas>
```

Now add the following script:

```javascript
$(document).ready(function(){
      var text = new Nebula({
            container: $('#bg')
      });
      
      var name = prompt("What's your name?");
      
      // Write the name using circles of the specified colors
      text.write(name, 'circles', ['rgba(0,0,255,0.5)', 'rgba(255,0,0,0.2)']);
      
      // Optional stuff
      $('canvas').mousemove(function(e){ text.mouseMove(e); });
      $('canvas').resize(function(e){text.resizeCanvas(); });
      $('canvas').click(function(e){text.explosion(e); });
});
```

##Options
The following options can be passed to the constructor for configuration:


| Parameter   |      Values      | Default      |     Description |
|-------------|------------------|--------------|-----------------|
| container   | DOM Element      |  $('canvas') | jQuery element where the Nebula should appear |
| resolution  | `int`            |  20 | Resolution used to determine the amount of nodes |
| tolerance | `float` | 0 | Tolerance when determining where to place the edges, it shouldn't matter unless at high resolutions|
| minRad | `int` | 0 | Minimum radius that a node can have |
| maxRad | `int` | 40 | Maximum radius that a node can have |
| maxInitRad | `float` | 0.001 | Maximum starting radius, lower looks better because they start growing |
| maxSpeed | `float` | 2 | Maximum speed that a node can have |
| variation | `float` | 0.2 | Amount of variation in the radius from one cycle to the next|
| explosionRadius | `int`| 100 | Nodes affected by explosions, higher is more expensive |
| explosionForce | `float` | 0.01 | Force generated in an explosion |
| attraction | `float` | 0.00001 | Attraction that the nodes have toward their true center |
| mode | `String` | colorful | Normal or colorful |
| debug | `boolean` | true | Log messages to the console |
| drawFn | `String` or `function` | 'circle' | Drawing function used, built in functions are 'circle' and 'rectangle'. For custom functions see section below |
| showForce | `boolean` | false | Draw force lines, very expensive |
| showDistance | `boolean` | false | Draw lines joining each node with its real center, very expensive. |
| showEdges | `boolean` | false | Draw circles indicating each real node center. |
| resolutionScale | `int` | 35 | Scale the edge resolution, it modifies the number of nodes created |
| radLimitScale | `int` | 10600 | Limit the maximum radius, play with this number to see what it actually does. |
| fadeAmount | `int` | 0 | If set to > 0 it will fade on every cycle instead of clearing the canvas. |
| fadeColor | `String` | 'rgb(0,0,0)' | Fade color used, set it to match the background |
| 

##License
The HTML Clock is released under the GNU GPLv2 License.
