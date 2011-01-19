import httplib
import urllib
import os
import os.path
import shutil

def mkdirMaybe(name):
    """
    Make directories if they don't exist yet.
    """

    if not os.path.exists(name):
        os.makedirs(name)


def recreateDir(name):
    """
    Remove a directory and create it again.
    """
    if os.path.exists(name):
        shutil.rmtree(name)
        os.makedirs(name)

def forceOpen(name, mode = "rb"):
    """
    Open file. Making directories if neccessary.
    """
    mkdirMaybe(os.path.dirname(name))
    return open(name, mode)


def compressJavascript(infile, outfile):
    c = httplib.HTTPConnection("closure-compiler.appspot.com")
    try:
        with open(infile, "rb") as f:
            c.request("POST", "/compile", 
                      urllib.urlencode({"js_code": f.read(),
                                        "compilation_level": "SIMPLE_OPTIMIZATIONS",
                                        "output_format": "text",
                                        "output_info": "compiled_code"}),
                      {"Content-type": "application/x-www-form-urlencoded",
                       "Accept": "text/plain"})
        response = c.getresponse()
        print "response: %i, reason: %s" % (response.status, response.reason)
        with forceOpen(outfile, "wb") as f:
            f.write(response.read())
    finally:
        c.close()


if __name__ == "__main__":
    outdir = 'out'
    recreateDir(outdir)
    
    compressJavascript("canvasslide.js", outdir + '/canvasslide.js')

    # instead of just copying, rescale all images
    shutil.copytree('img', outdir + '/img')
    shutil.copytree('external', outdir + '/external')
    shutil.copyfile('index.html', outdir + '/index.html')


    print "All done."
