import httplib
import urllib
import os
import os.path
import shutil
import Image

jquerySource = "http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"

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
                                        #"compilation_level": "SIMPLE_OPTIMIZATIONS",
                                        "compilation_level": "ADVANCED_OPTIMIZATIONS",
                                        "output_format": "text",
                                        "output_info": "compiled_code",
                                        "externs_url": jquerySource}),
                      {"Content-type": "application/x-www-form-urlencoded",
                       "Accept": "text/plain"})
        response = c.getresponse()
        print "response: %i, reason: %s" % (response.status, response.reason)
        with forceOpen(outfile, "wb") as f:
            f.write(response.read())
    finally:
        c.close()


def rescaleImage(infile, outfile, maxsize):
    img = Image.open(infile)
    scale = float(max(img.size))
    size = (int(img.size[0] / scale * maxsize + 0.5), int(img.size[1] / scale * maxsize + 0.5))
    img.resize(size, Image.ANTIALIAS).save(outfile)


if __name__ == "__main__":
    outdir = 'out'
    recreateDir(outdir)
    
    compressJavascript("canvasslide.js", outdir + '/canvasslide.js')

    mkdirMaybe(outdir + '/img')
    for image in os.listdir('img'):
        rescaleImage('img/' + image, outdir + '/img/' + image, 300)

    shutil.copytree('ui_img', outdir + '/ui_img')
    shutil.copytree('external', outdir + '/external')
    shutil.copyfile('index.html', outdir + '/index.html')


    print "All done."
