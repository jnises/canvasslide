// canvas slideshow


/**
 * Create a slideshow on canvas using images.
 */
function Slide(canvas, images)
{
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
            this.queue.push(command);
            function handleCommand()
            {
                if(!this.current)
                {
                    this.current = this.queue.shift();
                    this.current(function()
                                 {
                                     setTimeout(function()
                                                {
                                                    // TODO problems with this here?
                                                    this.current = null;
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

    /** The delay between frames in seconds. */
    var delay = 0.33333;
    var lastRender = 0;

    /**
     * Render the scene, calling callback when a transition is finished.
     */
    function render(callback)
    {
        
    }

    this.index = 0;
    this.transition = false;
    this.transitionStart = -1;
    this.transitionEnd = -1; // when the next image has been loaded

    this.next = function()
    {
        commandQueue.pushCommand(function(callback)
                                 {
                                     // load the next image
                                     this.index = this.index < (images.length - 1) ? this.index + 1 : images.length - 1;
                                     loadImageNumber(this.index);
                                     // trigger transition
                                     setTimeout(function(){render(callback);}, 0);
                                 });
    }

    this.prev = function()
    {
        commandQueue.pushCommand(function(callback)
                                 {
                                     this.index = this.index > 0 ? this.index - 1 : this.index;
                                     loadImageNumber(this.index);
                                     // trigger transition
                                     setTimeout(function(){render(callback);}, 0);
                                     // TODO make sure transition calls callback when it is done
                                 });
    }

    
}
