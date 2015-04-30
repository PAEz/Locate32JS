/*
  Locate32 DB reader
  PAEz

  Only tested in Chrome
  Really happy with the speed.  Dont know what it should be or how to compare, but it can touch/regex test around 100000 items a second and a bit
  Next to no error/dummy checking...lazy...do it later
*/

// var Locate32 = (function() {
function Locate32(ab) {
	this.db = new Chunks(ab);
	this.roots = this.getRoots();
	if (this.roots.error) return this.roots;
	var self = this;

	var scan = (function() {


		var pausePos;
		var pause = false;

		var path, paths, item;
		var callback;

		var db;

		var _updir = {
			event: 'updir'
		};
		var _end = {
			event: 'end'
		};
		var _pause = {
			event: 'pause'
		};
		var _continue = {
			event: 'continue'
		};

		function end() {
			batchIndex = 0;
			paths.length = 0;
			path = '';
			scan.scanning = false;
			callback(_end, path);
		}

		function next() {
			var flags = db.getUint8();
			if (flags & 0x10) {
				// file
				db.index -= 1;
				return self.file(db, flags);
			} else if (flags & 0x80) {
				// directory
				db.index -= 1;
				return self.directory(db, flags);
			}
			return false;
		}

		function _scan() {
			var batchSize = scan.batchSize;
			if (pause) {
				pausePos = db.pos();
				pause = false;
				return;
			}
			scan.scanning = true;
			while (paths.length > 0) {
				while ((item = next()) !== false) {
					if (item.attrs.directory) {
						var result = callback(item, path);
						paths.push(item.name);
						path = paths.join('\\') + '\\';
					} else if (item.attrs.file) {
						callback(item, path);
					}
					if (typeof result == 'string') {
						if (item.attrs.directory && result == 'skip') {
							db.pos(item.pos);
							db.index += item.dataLength;
							paths.pop();

						}
						if (result == 'end') {
							end();
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
				callback(_updir, path);
			}
			end();
      return item;
		}

		function scan(root, _callback, basePath) {
			db = this.db;
			callback = _callback;
			path = root.path || basePath || root.name;
			if (path[path.length - 1] == '/') path = path.substr(0, path.length - 1);
			paths = [path];
			path = paths.join('\\') + '\\';
			db.pos(root.nextPos);
			return _scan();
		}

		scan.pause = function() {
			if (!scan.batchSize) return;
			pause = true;
			pausePos = db.pos();
			scan.scanning = false;
			callback(_pause, path);
		}

		scan.continue = function() {
			if (!pausePos) return;
			pause = false;
			scan.scanning = false;
			callback(_continue, path);
			db.pos(pausePos);
			_scan();
		}

		/*
      All this is about trying to make sure its not blocking (which to the new, makes the ui unresponsive, so they couldnt click pause/stop)
      The higher the batch size the quicker it will be but the more unresponsive the ui will be
      Personally, aslong as they can still click on pause and stop Im happy
    */
		// var batchSize = 4000; // moved to scan.batchSize
		var batchIndex = 0;
		/*
      If batchSize is 0 then it wil be blocking
      This is fine some times, like when finding a path, most of it gets skipped and so its really fast
      5000 seems to be ok for unique or reuse items
    */
		scan.batchSize = 5000;

		return scan;
	})();

	this.scan = scan;
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
		roots.push(root);
		db.pos(root.pos);
		db.seek(root.dataLength);
	}
	this.roots = roots;
	return roots
}

Locate32.prototype.item = {
	pos: 0,
	dataLength: 0,
	name: '',
	ext: '',
	size: 0,
	modified: 0,
	created: 0,
	accessed: 0,
	nextPos: 0,
	attrs: {
		directory: true,
		file: true,
		hidden: true,
		readOnly: true,
		archive: true,
		system: true,
		symlink: true,
		junction: true, // junction/ mount point....wasnt sure what to call it
	}
}

Locate32.prototype.directoryReuse = function() {
	var item = this.item;
	var db = this.db;
	var flags = db.getUint8();
	item.attrs.directory = !!(flags & 0x80);
	item.attrs.file = !!(flags & 0x10);
	item.attrs.hidden = !!(flags & 0x01);
	item.attrs.readOnly = !!(flags & 0x02);
	item.attrs.archive = !!(flags & 0x04);
	item.attrs.system = !!(flags & 0x08);
	item.attrs.symlink = !!(flags & 0x10);
	item.attrs.junction = !!(flags & 0x20); // junction/ mount point....wasnt sure what to call it

	item.pos = db.index - 1;
	item.dataLength = db.getUint32(true) + 1;
	var strLen = db.getUint8() * 2;
	item.name = db.getString('utf-16', strLen + 2);
	// db.seek(2); // the 2 nulls
	item.modified = db.getUint32(true);
	item.created = db.getUint32(true);
	item.accessed = db.getUint32(true);
	item.nextPos = db.index;
	return item
}

Locate32.prototype.fileReuse = function() {
	var item = this.item;
	var db = this.db;
	var flags = db.getUint8();
	item.attrs.directory = !!(flags & 0x80);
	item.attrs.file = !!(flags & 0x10);
	item.attrs.hidden = !!(flags & 0x01);
	item.attrs.readOnly = !!(flags & 0x02);
	item.attrs.archive = !!(flags & 0x04);
	item.attrs.system = !!(flags & 0x08);
	item.attrs.symlink = !!(flags & 0x10);
	item.attrs.junction = false;
	item.pos = db.index - 1;
	var strLen = db.getUint8() * 2;
	var extIndex = db.getUint8();
	item.name = db.getString('utf-16', strLen + 2);
	if (extIndex >= 0) item.ext = item.name.substr(extIndex) + 1;
	// db.seek(2); // the 2 nulls
	item.fileSizeLo = db.getUint32(true);
	item.fileSizeHi = db.getUint16(true);
	item.size = (item.fileSizeHi * 4294967296) + item.fileSizeLo; // Hope I got this one right, need something to test on
	item.modified = db.getUint32(true);
	item.created = db.getUint32(true);
	item.accessed = db.getUint32(true);
	item.nextPos = db.index;
	return item
}

Locate32.prototype.directoryUnique = function() {
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
	item.pos = db.index - 1;
	item.dataLength = db.getUint32(true) + 1;
	var strLen = db.getUint8() * 2;
	item.name = db.getString('utf-16', strLen + 2);
	// db.seek(2); // the 2 nulls
	item.modified = db.getUint32(true);
	item.created = db.getUint32(true);
	item.accessed = db.getUint32(true);
	item.nextPos = db.index;
	return item
}

Locate32.prototype.fileUnique = function() {
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
	item.pos = db.index - 1;
	var strLen = db.getUint8() * 2;
	var extIndex = db.getUint8();
	item.name = db.getString('utf-16', strLen + 2);
	if (extIndex >= 0) item.ext = item.name.substr(extIndex) + 1;
	// db.seek(2); // the 2 nulls
	item.fileSizeLo = db.getUint32(true);
	item.fileSizeHi = db.getUint16(true);
	item.size = (item.fileSizeHi * 4294967296) + item.fileSizeLo; // Hope I got this one right, need something to test on
	item.modified = db.getUint32(true);
	item.created = db.getUint32(true);
	item.accessed = db.getUint32(true);
	item.nextPos = db.index;
	return item
}

Locate32.prototype.file = Locate32.prototype.fileReuse;
Locate32.prototype.directory = Locate32.prototype.directoryReuse;

Locate32.prototype._uniqueItems = false;

Locate32.prototype.uniqueItems = function(bool) {
	if (bool === undefined) return Locate32.prototype._uniqueItems;
	if (bool) {
		Locate32.prototype.file = Locate32.prototype.fileUnique;
		Locate32.prototype.directory = Locate32.prototype.directoryUnique;
	} else {
		Locate32.prototype.file = Locate32.prototype.fileReuse;
		Locate32.prototype.directory = Locate32.prototype.directoryReuse;
	}
}


Locate32.prototype.findPath = function(root, dir) {
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

// Converts a locate32 date (DosDateTime) to js
Locate32.prototype.convertDate = function(date) {
	var low = date & 0xffff;
	var high = (date & 0xffff0000) >> 16;

	var day = low & 0b11111;
	var month = (low & 0b111100000) >> 5;
	var year = ((low & 0b1111111000000000) >> 9) + 1980;

	var second = (high & 0b11111) * 2;
	var minute = (high & 0b11111100000) >> 5;
	var hour = (high & 0b1111100000000000) >> 11;

	return new Date(year, month, day, hour, minute, second);

}
// 	return Locate32;
// })();