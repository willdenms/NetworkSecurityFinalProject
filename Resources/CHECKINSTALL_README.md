
Checking that Reqs are met...
Make sure you check all of these from the adblackplus_master director otherwise there could
be a conflict your missing

 - Make sure you have GIT, should just be able to do a git command...  r.
 - Make sure you have Python 2.7  installed
    - type 'python -V' in the console should say something like "Python 2.7.XX" if you don't have it
        installed go here: https://www.python.org/download/releases/2.7/
 - Make sure the jinja module is built by rebuilding it: 
    - cd jinja/
    - python setup.py develop
 - Make sure the PIL module is built, by rebuilding it:
    - cd Imaging-1.1.7
    - python setup.py install
    ## If you get errors here:
    - This one is a little wierd, because it has alot of dependendcies, if you're on mac you will 
        need to make sure that you have X11 installed, and that the CLI knows about it to do this:
        - in the terminal type: xcode-select --install
        - If you on windows, not sure what will happen? But PIL should tell you what it needs
 - Make sure the PyCrpto module is built, by building it:
    - cd pycrypto/
    - python setup.py install
    - This can also get harry, not sure what goes on when it fails, I suspect a python version conflict.

