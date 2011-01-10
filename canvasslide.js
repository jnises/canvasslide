// canvas slideshow


/**
 * Create a slideshow on canvas using images.
 */
function Slide(canvas, images)
{
    /**
     * Log stuff.
     */
    function log(message)
    {
        // TODO handle logging better, can you get file, line
        // printouts? exceptions?
        alert(message);
    }

    /**
     * Assert stuff
     */
    function assert(test)
    {
        // TODO this is a stupid way to do assertions, we need proper
        // error messages.
        if(!test) log("assertion error");
    }

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
                                                        // TODO problems with that here?
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
                callback(null);
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
                      if(img)
                      {
                          images[index] = img;
                      }
                      else
                      {
                          log("error: no image found for index: " + index);
                      }
                  });
    }

    var index = -1;
    var transition = false;
    var transitionStart = -1;
    var transitionEnd = -1; // when the next image has been loaded

    /** The delay between frames in seconds. */
    var delay = 0.33333;

    /** When the last frame was rendered. */
    var lastRender = new Date().getTime();

    /**
     * Return an array of two elements specifying the width and height
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

    /**
     * Render the scene, calling callback when a transition is finished.
     */
    function render(callback)
    {
        if(c)
        {
            //document.writeln("rendering\n");
            var now = new Date().getTime();

            c.clearRect(0, 0, c.width, c.height);

            if(images[index].data)
            {
                // TODO we could calculate the desired image size when
                // loading it instead of doing it all the time
                var size = fitInCanvas(canvas, images[index].data);
                
                c.drawImage(images[index].data, (canvas.width - size[0]) / 2, (canvas.height - size[1]) / 2, size[0], size[1]);
            }

            if((now - transitionStart) > 5)
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

    that.next = function()
    {
        if(c)
        {
            commandQueue.pushCommand(function(callback)
                                     {
                                         // load the next image
                                         index = index < (images.length - 1) ? index + 1 : images.length - 1;
                                         loadImageNumber(index);
                                         // trigger transition
                                         transition = true;
                                         transitionStart = new Date().getTime();
                                         setTimeout(function(){render(callback);}, 0);
                                     });
        }
    }

    that.prev = function()
    {
        if(c)
        {
            commandQueue.pushCommand(function(callback)
                                     {
                                         index = index > 0 ? index - 1 : index;
                                         loadImageNumber(index);
                                         // trigger transition
                                         transition = true;
                                         transitionStart = new Date().getTime();
                                         setTimeout(function(){render(callback);}, 0);
                                     });
        }
    }

    // start rendering
    that.next();
}
