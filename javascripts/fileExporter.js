// dummy locate to keep onFrame happy until one is initiated
var locate = {
	scan: {
		scanning: false
	}
};

var $ = {
	progress: {
		el: document.querySelector('#progress'),
		value: 0
	},
	load: {
		el: document.querySelector('#load'),
		enabled: true
	},
	generate: {
		el: document.querySelector('#generate'),
		enabled: false
	},
	save: {
		el: document.querySelector('#save'),
		enabled: false
	},
	rootList: document.querySelector('#rootlist'),
	fileInput: document.querySelector('#fileinput'),
	template: document.querySelector('div.template'),
	legend: document.querySelector('div.legend')
};

var $Keys = Object.keys($);
$Keys.forEach(function(key) {
	var el = $[key];
	if (el.enabled !== undefined) {
		if (el.enabled) {
			el.el.removeAttribute('disabled');
		} else {
			el.el.setAttribute('disabled', '');
		}
		el.enabled = function(bool) {
			if (bool === undefined) bool = true;
			if (bool) {
				this.el.removeAttribute('disabled');
			} else {
				this.el.setAttribute('disabled', '');
			}
		}
	}
})


function onFrame() {
	if ($.progress.value !== $.progress.valueLast) {
		$.progress.el.style.width = $.progress.value + '%';
		$.progress.valueLast = $.progress.value;
	} else if (locate.scan.scanning == false) {
		var update = false;
		for (var i = 0, iEnd = templateKeys.length; i < iEnd; i += 1) {
			var key = templateKeys[i];
			if (template[key].dirty) {
				template[key].dirty = false;
				templateData[key] = template[key].el.value;
				update = true;
			}
		}
		if (update) {
			localStorage['templateData'] = JSON.stringify(templateData);
		}
	}
	window.requestAnimationFrame(onFrame);
}

window.requestAnimationFrame(onFrame);



$.fileInput.addEventListener('change', function(e) {
	var files = e.target.files || e.dataTransfer.files;
	if (files.length) {
		var file = files[0];
		var reader = new FileReader();
		rootListInfo('Loading......');
		$.generate.enabled(false);
		$.save.enabled(false);
		reader.readAsArrayBuffer(file);
		reader.onload = function(result) {
			var ab = result.target.result;
			locate = new Locate32(ab);
			if (locate.error) {
				rootListInfo(locate.error);
				return;
			}
			$.generate.enabled(true);
			rootList(locate.roots);
		}
	}

})

$.save.el.addEventListener('click', function(e) {
	save(list);
});
// the generate click event is at the end of the code

var template = {
	header: {
		el:document.querySelector('div.template [name="header"]'),
		dirty: false,
		func: null,
		args: 'item, date, dateRaw',
		keys: {
			files: 'item.files',
			directories: 'item.directories',
			createdRaw: 'item.created',
			created: 'item.created',
			created_year: 'item.created.year',
			created_month: 'item.created.month',
			created_day: 'item.created.day',
			created_hour: 'item.created.hour',
			created_minute: 'item.created.minute',
			created_second: 'item.created.second',
			date: 'date',
			dateRaw: 'dateRaw',
			creator: 'item.creator',
			description: 'item.description'
		}
	},
	root: {
		el:document.querySelector('div.template [name="root"]'),
		dirty: false,
		func: null,
		args: 'item, date, dateRaw',
		keys: {
			path: 'item.path',
			files: 'item.files',
			directories: 'item.directories',
			createdRaw: 'item.created',
			created: 'item.created',
			created_year: 'item.created.year',
			created_month: 'item.created.month',
			created_day: 'item.created.day',
			created_hour: 'item.created.hour',
			created_minute: 'item.created.minute',
			created_second: 'item.created.second',
			date: 'date',
			dateRaw: 'dateRaw',
			name: 'item.volume.name',
			serial: 'item.volume.serial',
			fileSystem: 'item.fileSystem',
			type: 'item.type'

		}
	},
	directory: {
		el:document.querySelector('div.template [name="directory"]'),
		dirty: false,
		func: null,
		args: 'item, path, date, dateRaw',
		keys: {
			path: 'path',
			name: 'item.name',
			createdRaw: 'item.created',
			created: 'item.created',
			created_year: 'item.created.year',
			created_month: 'item.created.month',
			created_day: 'item.created.day',
			created_hour: 'item.created.hour',
			created_minute: 'item.created.minute',
			created_second: 'item.created.second',
			modifiedRaw: 'item.modified',
			modified: 'item.modified',
			modified_year: 'item.modified.year',
			modified_month: 'item.modified.month',
			modified_day: 'item.modified.day',
			modified_hour: 'item.modified.hour',
			modified_minute: 'item.modified.minute',
			modified_second: 'item.modified.second',
			hidden: 'item.attrs.hidden',
			readOnly: 'item.attrs.readOnly',
			archive: 'item.attrs.archive',
			system: 'item.attrs.system',
			symlink: 'item.attrs.symlink',
			junction: 'item.attrs.junction',
			file: 'item.attrs.file',
			directory: 'item.attrs.directory'
		}
	},
	file: {
		el:document.querySelector('div.template [name="file"]'),
		dirty: false,
		func: null,
		args: 'item, path, date, dateRaw',
		keys: {
			path: 'path',
			size: 'item.size',
			name: 'item.name',
			createdRaw: 'item.created',
			created: 'item.created',
			created_year: 'item.created.year',
			created_month: 'item.created.month',
			created_day: 'item.created.day',
			created_hour: 'item.created.hour',
			created_minute: 'item.created.minute',
			created_second: 'item.created.second',
			modifiedRaw: 'item.modified',
			modified: 'item.modified',
			modified_year: 'item.modified.year',
			modified_month: 'item.modified.month',
			modified_day: 'item.modified.day',
			modified_hour: 'item.modified.hour',
			modified_minute: 'item.modified.minute',
			modified_second: 'item.modified.second',
			hidden: 'item.attrs.hidden',
			readOnly: 'item.attrs.readOnly',
			archive: 'item.attrs.archive',
			system: 'item.attrs.system',
			symlink: 'item.attrs.symlink',
			junction: 'item.attrs.junction',
			file: 'item.attrs.file',
			directory: 'item.attrs.directory'
		}
	},
	// directoryEnd: {
	// func:null,
	//   args: {},
	//   keys: {
	//     path: 'item.path',
	//     name: 'item.name'
	//   }
	// },
	// rootEnd: {
	// func:null,
	//   args: {},
	//   keys: {
	//     path: 'item.path',
	//     files: 'item.files',
	//     directories: 'item.directories',
	//     createdRaw: 'item.created',
	//     date: 'item.date',
	//     volumeName: 'volume.name',
	//     volumeSerial: 'item.volume.serial',
	//     fileSystem: 'item.fileSystem',
	//     type: 'item.type'
	//
	//   }
	// },
	footer: {
		el:document.querySelector('div.template [name="footer"]'),
		dirty: false,
		func: null,
		args: 'item, date, dateRaw',
		keys: {
			files: 'item.files',
			directories: 'item.directories',
			createdRaw: 'item.created',
			created: 'item.created',
			created_year: 'item.created.year',
			created_month: 'item.created.month',
			created_day: 'item.created.day',
			created_hour: 'item.created.hour',
			created_minute: 'item.created.minute',
			created_second: 'item.created.second',
			date: 'date',
			dateRaw: 'dateRaw',
			creator: 'item.creator',
			description: 'item.description'
		}
	}
}

var templateKeys = Object.keys(template);

templateKeys.forEach(function(legend) {
	var el = template[legend].el;

	el.addEventListener('focus', function(e) {
		$.legend.setAttribute('legend', el.getAttribute('name'));
	});

	el.addEventListener('input', function(e) {
		template[el.name].dirty = true;
	});
});

var templateData = {};

if (localStorage['templateData'] !== undefined) templateData = JSON.parse(localStorage['templateData']);

templateKeys.forEach(function(key) {
	if (templateData[key]) template[key].el.value = templateData[key];
})



function createTemplate(section, str) {
	var args = template[section].args;
	var keys = template[section].keys;
	var undefinedKeys = [];
	str = str.replace(/(?:\r\n|\r|\n)/g, '\r\n')
	str = JSON.stringify(str);

	var body = 'return ' + str.replace(/{{([^{]*)}}/g, function(match, match2) {
		if (!keys[match2]) undefinedKeys.push(match2);
		else match2 = keys[match2];
		return '"+' + match2 + '+"'
	})
	body = body.replace(/["]["][+]|[+]["]["]/g, '');
	if (undefinedKeys.length) return undefinedKeys;
	template[section].func = new Function(args, body);
	return true;
}

function createTemplates(templates) {
	var keys = Object.keys(templates);
	for (var i = 0, iEnd = keys.length; i < iEnd; i += 1) {
		var key = keys[i];
		var temp = createTemplate(key, template[key].el.value.toString());
		if (temp !== true) {
			temp.template = key;
			return temp;
		}
	}
	return true;
}


function rootList(roots) {

	while ($.rootList.lastChild) $.rootList.removeChild($.rootList.lastChild);

	roots.forEach(function(root, index) {
		var li = document.createElement('li');
		var volume = document.createElement('input');
		volume.setAttribute('id', 'volume' + index);
		volume.setAttribute('volume', index);
		volume.setAttribute('type', 'checkbox');
		volumeLabel = document.createElement('label');
		volumeLabel.classList.add('checkbox');
		volumeLabel.setAttribute('for', 'volume' + index);
		volumeLabel.innerText = root.path + '\\';
		volumeLabel.setAttribute('title', root.path + '\\');
		var info1 = document.createElement('span');
		info1.classList.add("info");
		info1.appendChild(document.createTextNode("Files: "));
		var fCount = document.createElement("span");
		fCount.appendChild(document.createTextNode(root.files));
		fCount.classList.add('info-count');
		info1.appendChild(fCount);
		var info2 = document.createElement('span');
		info2.appendChild(document.createTextNode('Directories: '));
		info2.classList.add('info2');
		var dCount = document.createElement("span");
		dCount.classList.add('info-count');
		dCount.appendChild(document.createTextNode(root.directories));
		info2.appendChild(dCount)
		li.appendChild(volume);
		li.appendChild(volumeLabel);
		li.appendChild(info1);
		li.appendChild(info2);
		li.volume = index;
		$.rootList.appendChild(li);
	})
}

function rootListInfo(wot) {
	while ($.rootList.lastChild) $.rootList.removeChild($.rootList.lastChild);
	var li = document.createElement('li');
	var text = document.createElement('span');
	text.classList.add('sideinfo');
	text.innerText = wot;
	li.appendChild(text);
	$.rootList.appendChild(li);
}


function createDates(item) {

	if (item.created && item.createdRaw === undefined) {
		item.createdRaw = item.created;

		var low = item.created & 0xffff;
		var high = (item.created & 0xffff0000) >> 16;

		var day = low & 0b11111;
		var month = (low & 0b111100000) >> 5;
		var year = ((low & 0b1111111000000000) >> 9) + 1980;

		var second = (high & 0b11111) * 2;
		var minute = (high & 0b11111100000) >> 5;
		var hour = (high & 0b1111100000000000) >> 11;

		// var date =locate.convertDate(item.createdRaw);
		item.created = new Date(year, month, day, hour, minute, second);
		item.created.year = year;
		item.created.month = month;
		item.created.day = day;
		item.created.hour = hour;
		item.created.minute = minute;
		item.created.second = second;

	}
	if (item.modified && item.modifiedRaw === undefined) {
		item.modifiedRaw = item.modified;

		var low = item.modified & 0xffff;
		var high = (item.modified & 0xffff0000) >> 16;

		var day = low & 0b11111;
		var month = (low & 0b111100000) >> 5;
		var year = ((low & 0b1111111000000000) >> 9) + 1980;

		var second = (high & 0b11111) * 2;
		var minute = (high & 0b11111100000) >> 5;
		var hour = (high & 0b1111100000000000) >> 11;

		// var date =locate.convertDate(item.createdRaw);
		item.modified = new Date(year, month, day, hour, minute, second);
		item.modified.year = year;
		item.modified.month = month;
		item.modified.day = day;
		item.modified.hour = hour;
		item.modified.minute = minute;
		item.modified.second = second;
	}
}


function save(wot, filename) {
	filename = filename || 'output.txt';
	var blob = new Blob([wot], {
			type: t
		}),
		e = document.createEvent('MouseEvents'),
		a = document.createElement('a'),
		t = 'application/binary';
	a.onclick = function() {
		URL.revokeObjectURL(blob);
		delete blob;
	};
	a.download = filename;
	a.href = URL.createObjectURL(blob);
	e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
	a.dispatchEvent(e)
}
function save(wot, filename) {
	var enc=new TextEncoder('utf8');
	filename = filename || 'output.txt';
	var blob = new Blob([enc.encode(wot)], {
			type: t
		}),
		e = document.createEvent('MouseEvents'),
		a = document.createElement('a'),
		t = 'application/binary';
	a.onclick = function() {
		URL.revokeObjectURL(blob);
		delete blob;
	};
	a.download = filename;
	a.href = URL.createObjectURL(blob);
	e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
	a.dispatchEvent(e)
}


rootListInfo('Load a DB to get started');
var list = '';

$.generate.el.addEventListener('click', function(e) {
	var totals = 0,
		totalsCount = 0,
		volumes = [];
for(var i=0;i<3;i++){
	[].forEach.call($.rootList.querySelectorAll('input[type="checkbox"]'), function(el) {
		if (el.checked) {
			var v = el.getAttribute('volume');
			totals += locate.roots[v].files;
			totals += locate.roots[v].directories;
			volumes.push(v);
		}
	})
}
	if (!volumes.length) return;
	volumes.reverse();

	$.save.enabled(false);
	$.load.enabled(false);
	$.generate.enabled(false);

	list = '';

	totalsCount = 0;
	var temp = createTemplates(template);
	if (temp === true) {
		var dateRaw = new Date();
		var date = dateRaw.toString();
		dateRaw = dateRaw.getTime();

		// Header
		createDates(locate.header);
		list += template['header'].func(locate.header, date, dateRaw);

		console.time('Scan Took');

		function scanIt(index) {
			createDates(locate.roots[index]);
			list += template.root.func(locate.roots[index], date, dateRaw);

			locate.roots[index].scan(function(item, path) {
				if (item.event) {
					if (item.event == 'end') {
						var next = volumes.pop();
						if (next) scanIt(next);
						else {
							// true end
							console.timeEnd('Scan Took');
							console.log('totals', totals)
							list += template['footer'].func(locate.header, date, dateRaw);
							$.save.enabled(true);
							$.load.enabled(true);
							$.generate.enabled(true);
							$.progress.value = 0;
						}
						return;
					}
				} else if (item.attrs.directory) {
					createDates(item);
					list += template.directory.func(item, path, date, dateRaw);
					totalsCount += 1;
					$.progress.value = (totalsCount / totals) * 100;
				} else {
					createDates(item);
					totalsCount += 1;
					list += template.file.func(item, path, date, dateRaw);
					$.progress.value = (totalsCount / totals) * 100;
				}
			});
		}

		scanIt(volumes.pop());

	} else {
		alert('Unable to generate template.\nUnkown variable/s...\n' + temp.join(', ') + '\n...was used in...\n' + temp.template);
		$.save.enabled(false);
		$.load.enabled(true);
		$.generate.enabled(true);
	}

});