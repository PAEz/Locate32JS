/*
  Locate32 DB reader
  PAEz

  Only tested in Chrome
  Really happy with the speed.  Dont know what it should be or how to compare, but it can touch/regex test around 100000 items a second and a bit
  Next to no error/dummy checking...lazy...do it later
*/

function Locate32(ab) {
  this.db = new Chunks(ab);
  this.roots = this.getRoots();
  if(this.roots.error) return this.roots;
  // stop being a slacker and make this prototypeable ;)
  var scan = (function() {
    /*
      All this is about trying to make sure its not blocking (which to the new, makes the ui unresponsive, so they couldnt click pause/stop)
      The higher the batch size the quicker it will be but the more unresponsive the ui will be
      Personally, aslong as they can still click on pause and stop Im happy
    */
    // var batchSize = 4000; // moved to scan.batchSize
    var batchIndex = 0;

    var pausePos;
    var pause = false;

    var path, paths, item;
    var callback;

    var db, self;

    function next() {
      var flags = db.getUint8();
      var item;
      if (flags & 0x10) {
        // file
        db.seek(-1);
        item = self.file(db, flags);
      } else if (flags & 0x80) {
        // directory
        db.seek(-1);
        item = self.directory(db, flags);
      } else {
        return;
      }
      return item
    }

    function _scan() {
      var batchSize = scan.batchSize;
      if (pause) {
        pausePos = db.pos();
        pause = false;
        return;
      }
      while (paths.length > 0) {
        while (item = next()) {
          if (item.attrs.directory) {
            scan.dCount += 1;

            path = paths.join('\\') + '\\';
            var result = callback(item, path);
            paths.push(item.name);
            path = paths.join('\\') + '\\';
          } else if (item.attrs.file) {
            scan.fCount += 1;
            callback(item, path);
          }
          if (typeof result == 'string') {
            if (item.attrs.directory && result == 'skip') {
              db.pos(item.pos);
              db.seek(item.dataLength);
              paths.pop();

            }
            if (result == 'end') {
              batchIndex = 0;
              callback({
                event: 'end'
              }, path);
              return item;
            }
          }
          batchIndex += 1;
          if (batchSize && batchIndex > batchSize) {
            batchIndex = 0;
            setTimeout(_scan, 0);
            return;
          }
        }
        paths.pop();
        path = paths.join('\\') + '\\';
        callback({
          event: 'updir'
        }, path);
      }

      batchIndex = 0;
      callback({
        event: 'end'
      }, path);
    }

    function scan(root, _callback, basePath) {
      // I need states so not to scan while scanning.
      db = this.db;
      self = this;
      callback = _callback;
      this.fCount = 0;
      this.dCount = 0;
      path = root.path || basePath || root.name;
      if (path[path.length - 1] == '/') path = path.substr(0, path.length - 1);
      paths = [path];

      db.pos(root.nextPos);
      // setTimeout(_scan, 0);
      return _scan();
    }

    /*
      If batchSize is 0 then it wil be blocking
      This is fine some times, like when finding a path, most of it gets skipped and so its really fast
    */
    scan.batchSize = 4000;

    scan.pause = function() {
      if (!scan.batchSize) return;
      pause = true;
      pausePos = db.pos();
      callback({
        event: 'pause'
      }, path);
    }

    scan.continue = function() {
      if (!pausePos) return;
      pause = false;
      callback({
        event: 'continue'
      }, path);
      db.pos(pausePos);
      _scan();
    }

    return scan;
  })();

  this.scan = scan;
  var self = this;
  this.roots.forEach(function(root) {
    root.scan = scan.bind(self, root);
  })


}

Locate32.prototype.getHeader = function() {
  var db = this.db;
  db.pos(0);
  var header = {};
  header.id = db.getString('ascii', 8);
  if (header.id != 'LOCATEDB') {
    header.error = 'File was not recognized as a Locate32 DB';
    return header;
  }
  header.version = db.getString('ascii', 2);
  if (header.version != '20') {
    header.error = 'File was not a version of the db I can handle';
    return header;
  }
  var flags = db.getUint8();
  header.longFilenames = !!(flags & 0x01);
  if (flags & 0x01) {
    header.longFilenames = true;
    if (flags & 0x10) header.charset = 'ansi';
    else header.charset = 'utf-16';
  } else {
    header.longFilenames = false;
    header.charset = 'oem';
  }
  if (header.charset == 'oem') {
    header.error = 'Bailing due to not knowing how to handle short file names, non unicode';
    return header;
  }
  header.skipSize = db.getUint32(true);
  header.creator = db.getString('utf16');
  header.description = db.getString('utf16');
  header.extra1 = db.getString('utf16');
  header.extra2 = db.getString('utf16');
  header.created = db.getUint32(true);
  header.files = db.getUint32(true);
  header.directories = db.getUint32(true);
  this.header = header;
  return header
}

Locate32.prototype.getRoot = function() {
  var db = this.db;
  var root = {
    pos: db.pos()
  };
  root.dataLength = db.getUint32(true) + 4;
  if (root.dataLength == 4) return;
  var flags = db.getUint8();
  switch (flags) {
    case 0x00:
      root.type = 'unknown';
      break;
    case 0x10:
      root.type = 'fixed';
      break;
    case 0x20:
      root.type = 'removeable';
      break;
    case 0x30:
      root.type = 'cd';
      break;
    case 0x40:
      root.type = 'remote';
      break;
    case 0x50:
      root.type = 'ramdisk';
      break;
    case 0xf0:
      root.type = 'directory';
      break;
    default:
      root.type = 'error';
      break;
  }
  root.path = db.getString('utf-16');
  root.volume = {};
  root.volume.name = db.getString('utf-16');
  root.volume.serial = db.getUint32(true);
  root.fileSystem = db.getString('utf-16');
  root.files = db.getUint32(true);
  root.directories = db.getUint32(true);
  root.nextPos = db.pos();
  return root
}

Locate32.prototype.getRoots = function() {
  var db = this.db;
  var header = this.getHeader(db);
  var root, roots = [];

if (header.error) return header;
  while (root = this.getRoot(db)) {
    // console.log(this)
    // root.scan = this.scan.bind(scan,root)
    roots.push(root);
    db.pos(root.pos);
    db.seek(root.dataLength);
  }
  this.roots = roots;
  return roots
}

Locate32.prototype.directory = function() {
  var db = this.db;
  var flags = db.getUint8();
  var item = {
    attrs: {
      directory: !!(flags & 0x80),
      file: !!(flags & 0x10),
      hidden: !!(flags & 0x01),
      readOnly: !!(flags & 0x02),
      archive: !!(flags & 0x04),
      system: !!(flags & 0x08),
      symlink: !!(flags & 0x10),
      junction: !!(flags & 0x20), // junction/ mount point....wasnt sure what to call it
    }
  }
  item.pos = db.pos() - 1;
  item.dataLength = db.getUint32(true) + 1;
  var strLen = db.getUint8() * 2;
  item.name = db.getString('utf-16', strLen);
  db.seek(2); // the 2 nulls
  item.modified = db.getUint32(true);
  item.created = db.getUint32(true);
  item.accessed = db.getUint32(true);
  item.nextPos = db.pos();
  return item
}

Locate32.prototype.file = function() {
  var db = this.db;
  var flags = db.getUint8();
  var item = {
    attrs: {
      directory: !!(flags & 0x80),
      file: !!(flags & 0x10),
      hidden: !!(flags & 0x01),
      readOnly: !!(flags & 0x02),
      archive: !!(flags & 0x04),
      system: !!(flags & 0x08),
      symlink: !!(flags & 0x10)
    }
  }
  item.pos = db.pos() - 1;
  var strLen = db.getUint8() * 2;
  var extIndex = db.getUint8();
  item.name = db.getString('utf-16', strLen);
  if (extIndex >= 0) item.ext = item.name.substr(extIndex) + 1;
  db.seek(2); // the 2 nulls
  item.fileSizeLo = db.getUint32(true);
  item.fileSizeHi = db.getUint16(true);
  item.size = (item.fileSizeHi * 4294967296) + item.fileSizeLo; // Hope I got this one right, need something to test on
  item.modified = db.getUint32(true);
  item.created = db.getUint32(true);
  item.accessed = db.getUint32(true);
  item.nextPos = db.pos();
  return item
}

Locate32.prototype.findPath = function(root,dir) {
  var db = this.db;
  var oldBatchSize = this.scan.batchSize;
  this.scan.batchSize = 0;
  // var roots = this.getRoots(),
  //   root;
  // for (var i = 0, iEnd = roots.length; i < iEnd; i += 1) {
  //   if (dir.lastIndexOf(roots[i].path, 0) === 0) {
  //     root = roots[i];
  //     break;
  //   }
  // }
  //
  // if (!root) {
  //   this.scan.batchSize = oldBatchSize;
  //   return;
  // }
  if (root.path = dir) {
    this.scan.batchSize = oldBatchSize;
    return root;
  }

  var fullPath;
  var item = this.scan(root, function(item, path) {
    if (item.attrs.directory) {
      if (dir.lastIndexOf(path, 0) !== 0) {
        return 'skip';
      } else if (path == dir) {
        fullPath = path;
        return 'end';
      } else if (path.length > dir.length) return 'skip';
    }
  });

  this.scan.batchSize = oldBatchSize;

  if (!item) return;
  item.fullPath = fullPath;
  return item;
}
