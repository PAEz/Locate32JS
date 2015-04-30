# locate32js
Read locate32 db files with js.

Locate32 is a an app for windows that indexs all your drives for quick searching.
Ive always wanted access to that db to make tools with, I can now do this.
So far all this can do is read, but delete will definately be added and other writing/updating functions may be added if I need them.

To see it in action try the file list exporter...
http://paez.github.io/locate32js/fileExporter.html
For me it can generate a list of 1390104 items in 10.4 seconds on a good day.  The speed will mainly be different due to the GC.
Be warned, trying to save such a list will work but the computer can get unresponsive for a while depending on how much memory you
have.  It takes over a gig!!!!! to make the file to save a 100meg plus string!?!?!  So if you dont have much memory (like me, 2gig) it going to go bad. ;(
In the future Ill be moving this to NWJS and then Ill just be able to stream the file to disk so it shouldnt be a problem.


Locate32 is written by Janne Huttunen and can be found...
http://locate32.cogit.net/
