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
      var text = new Nebula();
      
      var name = prompt("What's your name?");

      // Write the name using circles of the specified colors
      text.write(name, 'circles', ['rgba(0,0,255,0.5)', 'rgba(255,0,0,0.2)']);
      
      // Optional stuff
      $('canvas').mousemove(function(e){ text.mouseMove(e); });
      $('canvas').resize(function(e){text.resizeCanvas(); });
      $('canvas').click(function(e){text.explosion(e); });
    });
```

##License
The HTML Clock is released under the GNU GPLv2 License.