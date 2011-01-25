/**
 * @preserve Canvas slideshow
 * Copyright 2011 Joel Nises
 */

// requires jquery

/**
 * Create a slideshow on canvas using images.
 */
function Slide(canvas, images)
{
    /** @const */
    var enable_log = false;
    
    /**
     * Log stuff.
     */
    function log(message)
    {
        if(enable_log)
        {
            var canvasdiv = $("#logdiv");
            if(canvasdiv.append) canvasdiv.prepend(message + "<br/>\n");
        }
    }

    /**
     * Assert stuff
     */
    function assert(test)
    {
        if(enable_log)
        {
            if(!test) log("assertion error");
        }
    }

    // first convert simple images array to dictionary array
    images = $.map(images, function(elem, idx)
                   {
                       if(typeof elem === "string")
                       {
                           return {url: elem};
                       }
                       else // assume it is already a dictionary
                       {
                           return elem;
                       }
                   });

    // an image to display if we are unable to load a real image
    // this image might not be loaded when a problem occurs, in which case no image will be drawn at all
    var errorimg = new Image();
    errorimg.src = "ui_img/broken.jpg";

    var that = this;
    var c = null;
    if(canvas.getContext) c = canvas.getContext("2d");
    if(!c)
    {
        log("error: no canvas capabilities present");
    }

    // A queue that executes commands synchronously
    var commandQueue = {
        queue: new Array(),
        current: null,
        /**
         * @param command Function to be called when the command is executed,
         *                should take a callback as an argument. This callback
         *                must be called when the command is completed.
         */
        pushCommand: function(command)
        {
            var that = this;
            that.queue.push(command);
            function handleCommand()
            {
                if(!that.current)
                {
                    that.current = that.queue.shift();
                    // if there are commands in the queue, perform them
                    if(that.current)
                    {
                        that.current(function()
                                     {
                                         setTimeout(function()
                                                    {
                                                        that.current = null;
                                                        handleCommand();
                                                    }, 0);
                                     });
                    }
                }
            }

            handleCommand();
        }};

    /**
     * Make sure an image has been loaded, and call callback when it has.
     */
    function loadImage(img, callback)
    {
        if(img.data) callback(img);
        else
        {
            var tmpim = new Image();
            tmpim.onload = function()
            {
                // clone img
                var newim = $.extend({}, img);
                newim.data = tmpim;                
                callback(newim);
            }

            tmpim.onerror = function()
            {
                callback({data: errorimg});
            }

            tmpim.src = img.url;
        }
    }

    /**
     * Load image number index and update the corresponding image.
     */
    function loadImageNumber(index)
    {
        loadImage(images[index], 
                  function(img)
                  {
                      images[index] = img;

                      if(!img.url)
                      {
                          log("error: no image found for index: " + index);
                      }
                  });
    }

    var index = -1;
    var transition = false;
    var transitionStart = -1; // when the transition started
    //var transitionEnd = -1; // when the next image has been loaded
    var fadeInStart = -1; // when the next image has been loaded

    /** The delay between frames in seconds. */
    var delay = 0.33333;

    /** When the last frame was rendered. */
    var lastRender = new Date().getTime();

    // enum to specify the transition direction
    var directionEnum = {FORWARD: 0,
                         BACKWARD: 1};

    // which direction the transition is
    var direction = directionEnum.FORWARD;

    // how long a slide should be in microseconds
    var slideTime = 500;

    var fadeInTime = -1;

    /**
     * @return an array of two elements specifying the width and height
     * of image scaled to fit into canvas.
     */
    function fitInCanvas(canvas, image)
    {
        var width, height;
        
        assert(image.height > 0);
        assert(image.width > 0);
        var aspect = image.width / image.height;

        // first try fitting it horizontally
        width = canvas.width;
        height = width / aspect;

        if(height > canvas.height)
        {
            // scale vertically instead
            height = canvas.height;
            width = height * aspect;
        }

        return [width, height];
    }

    // smoothstep from 0 to 1
    function smoothstep(t)
    {
        t = t > 1 ? 1 : (t < 0 ? 0 : t);
        return t * t * (3 - 2 * t);
    }

    function clamp(t, min, max)
    {
        return Math.min(1, Math.max(0, t));
    }

    /**
     * Render the scene, calling callback when a transition is finished.
     */
    function render(callback)
    {
        if(c)
        {
            var now = new Date().getTime();

            c.clearRect(0, 0, canvas.width, canvas.height);

            //c.fillStyle = "rgb(0,0,0)";
            //c.fillRect (0, 0, canvas.width, canvas.height);

            var lastIndex;
            if(direction == directionEnum.FORWARD) lastIndex = index - 1;
            else if(direction == directionEnum.BACKWARD) lastIndex = index + 1;

            if(lastIndex < 0 || lastIndex >= images.length) lastIndex = -1;

            var slideDirection = direction == directionEnum.FORWARD ? 1 : -1;

            var slideComplete = false;

            // draw the old image slideout
            if(lastIndex >= 0)
            {
                if(images[lastIndex].data)
                {
                    var size = fitInCanvas(canvas, images[lastIndex].data);
                    var x;

                    // first center the image
                    x = (canvas.width - size[0]) / 2;
                    
                    // how much of the slide has been performed, 0 for nothing 1 for all
                    var slideDone = clamp((now - transitionStart) / slideTime, 0, 1);

                    // perform the slide, a slide should be the total width of the canvas
                    x += (-slideDirection * canvas.width) * smoothstep(slideDone);

                    c.drawImage(images[lastIndex].data, x, (canvas.height - size[1]) / 2, size[0], size[1]);
                }
            }

            // draw the new image slidein
            if(images[index].data)
            {
                // if fadeInTime is -1 this is the first frame when the next image is loaded
                if(fadeInTime == -1)
                    fadeInTime = new Date().getTime();

                var size = fitInCanvas(canvas, images[index].data);
                var x;

                // first center the image
                x = (canvas.width - size[0]) / 2;

                log("first x: " + x);
                log("canvas.width: " + canvas.width);
                log("size: " + size);
                
                // how much of the slide has been performed, 0 for nothing 1 for all
                var slideDone = clamp((now - fadeInTime) / slideTime, 0, 1);

                log("slidedone: " + slideDone);
                log("now - fadeInTime: " + (now - fadeInTime));

                // perform the slide, a slide should be the total width of the canvas
                x += (slideDirection * canvas.width) * (1 - smoothstep(slideDone));

                c.drawImage(images[index].data, x, (canvas.height - size[1]) / 2, size[0], size[1]);

                if(slideDone >= 1)
                {
                    slideComplete = true;
                }

                log("x: " + x);
            }

            if(slideComplete)
            {
                transition = false;
                // the transition is finished, call callback
                callback();
            } 
            else 
            {
                // framecap
                var diff = now - that.lastRender;

                lastRender = now;
                setTimeout(function(){render(callback);}, Math.max(delay - diff, 0) / 2);
            }
        }
    }

    /**
     * Call this function to load and slide to the next image.
     */
    that.next = function()
    {
        if(c)
        {
            commandQueue.pushCommand(function(callback)
                                     {
                                         if(index < (images.length - 1))
                                         {
                                             direction = directionEnum.FORWARD;
                                             // load the next image
                                             index = index < (images.length - 1) ? index + 1 : images.length - 1;
                                             loadImageNumber(index);
                                             // trigger transition
                                             transitionStart = new Date().getTime();
                                             // reset fadeInStart
                                             fadeInStart = -1;
                                             fadeInTime = -1;
                                             setTimeout(function(){render(callback);}, 0);
                                         }
                                         else
                                         {
                                             // since the index we are out of bounds we call callback directly
                                             callback();
                                         }
                                     });
        }
    }
    
    /**
     * Call this function to load and slide to the previous image.
     */
    that.prev = function()
    {
        if(c)
        {
            commandQueue.pushCommand(function(callback)
                                     {
                                         if(index > 0)
                                         {
                                             direction = directionEnum.BACKWARD;
                                             index = index > 0 ? index - 1 : index;
                                             loadImageNumber(index);
                                             // trigger transition
                                             transitionStart = new Date().getTime();
                                             fadeInStart = -1;
                                             fadeInTime = -1;
                                             setTimeout(function(){render(callback);}, 0);
                                         }
                                         else
                                         {
                                             // since the index we are out of bounds we call callback directly
                                             callback();
                                         }
                                     });
        }
    }

    // start rendering
    that.next();
}


// export some stuff to make sure closure doesn't remove it
window["Slide"] = Slide;