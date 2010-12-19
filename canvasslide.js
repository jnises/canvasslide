// canvas slideshow


/**
 * Create a slideshow on canvas using images.
 */
function Slide(canvas, images)
{
    var that = this;
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
                img.data = tmpim;
                callback(img);
            }
            // TODO need to handle errors here

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
                      // TODO this is unnecessary since we will already have
                      // mutated images[index] at this point. But it is the
                      // mutation that should be removed, not this setting.
                      images[index] = img;
                  });
    }

    // TODO why are these public?
    that.index = -1;
    that.transition = false;
    that.transitionStart = -1;
    that.transitionEnd = -1; // when the next image has been loaded

    /** The delay between frames in seconds. */
    var delay = 0.33333;

    /** When the last frame was rendered. */
    var lastRender = new Date().getTime();

    /**
     * Render the scene, calling callback when a transition is finished.
     */
    function render(callback)
    {
        var now = new Date().getTime();

        var c = canvas.getContext("2d");
        if(images[that.index].data) c.drawImage(images[that.index].data, now - that.transitionStart, 0);

        if((now - that.transitionStart) > 5)
        {
            that.transition = false;
        } else {
            // framecap
            var diff = now - that.lastRender;
            // TODO can you set closed over variables like this?
            lastRender = now;
            setTimeout(function(){render(callback);}, Math.max(delay - diff, 0) / 2);
        }
    }

    that.next = function()
    {
        commandQueue.pushCommand(function(callback)
                                 {
                                     // load the next image
                                     that.index = that.index < (images.length - 1) ? that.index + 1 : images.length - 1;
                                     loadImageNumber(that.index);
                                     // trigger transition
                                     that.transition = true;
                                     that.transitionStart = new Date().getTime();
                                     setTimeout(function(){render(callback);}, 0);
                                 });
    }

    that.prev = function()
    {
        commandQueue.pushCommand(function(callback)
                                 {
                                     that.index = that.index > 0 ? that.index - 1 : that.index;
                                     loadImageNumber(that.index);
                                     // trigger transition
                                     that.transition = true;
                                     that.transitionStart = new Date().getTime();
                                     setTimeout(function(){render(callback);}, 0);
                                 });
    }

    // start rendering
    that.next();
}
