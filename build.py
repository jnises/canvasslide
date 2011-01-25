import httplib
import urllib
import os
import os.path
import shutil
import Image
import argparse
import sys
import string

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
    '''
    TODO this function should handle different max width and height
    '''
    img = Image.open(infile)
    scale = float(max(img.size))
    size = (int(img.size[0] / scale * maxsize + 0.5), int(img.size[1] / scale * maxsize + 0.5))
    print 'resizing %s' % infile
    img.resize(size, Image.ANTIALIAS).save(outfile, quality = 85, optimize = True, progressive = True)


def templateConvert(infile, outfile, mappings):
    with open(infile, 'rb') as inf:
        with open(outfile, 'wb') as outf:
            outf.write(string.Template(inf.read()).safe_substitute(mappings))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--imgdir")
    params = p.parse_args()
    
    if params.imgdir:
        imgdir = params.imgdir
    else:
        imgdir = 'img'

    outdir = 'out'
    recreateDir(outdir)
    
    compressJavascript("canvasslide.js", outdir + '/canvasslide.js')

    mkdirMaybe(outdir + '/img')
    imgarray = []
    for image in os.listdir(imgdir):
        rescaleImage(imgdir + '/' + image, outdir + '/img/' + image, 500)
        imgarray.append('img/' + image)

    shutil.copytree('ui_img', outdir + '/ui_img')
    shutil.copytree('external', outdir + '/external')
    
    templateConvert('index.html', outdir + '/index.html', {"IMAGEARRAY": '["' + '","'.join(imgarray) + '"]'})


    print "All done."
