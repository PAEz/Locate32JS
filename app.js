var $ = {
	rootList: document.querySelector('#rootlist'),
	load: document.querySelector('#load'),
	fileInput: document.querySelector('#fileinput'),
	generate: document.querySelector('#generate'),
	save: document.querySelector('#save'),
	progress: document.querySelector('#progress'),
	template: {
		container: document.querySelector('div.template'),
		header: document.querySelector('div.template [name="header"]'),
		root: document.querySelector('div.template [name="root"]'),
		file: document.querySelector('div.template [name="file"]'),
		directory: document.querySelector('div.template [name="directory"]'),
		// dirend: document.querySelector('div.template [name="dirend"]'),
		// rootend: document.querySelector('div.template [name="rootend"]'),
		footer: document.querySelector('div.template [name="footer"]'),
	},
	legend: {
		container: document.querySelector('div.legend'),
		root: document.querySelector('div.legend .root'),
		directory: document.querySelector('div.legend .directory'),
		file: document.querySelector('div.legend .file'),
		end: document.querySelector('div.legend .end'),
	}
}

var dirty = {};
Object.keys($.template).forEach(function(key) {
	dirty[key] = false;
});


var template = {
	header: {
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

var templateData = {};

if (localStorage['templateData'] !== undefined) templateData = JSON.parse(localStorage['templateData']);

templateKeys.forEach(function(key) {
	if (templateData[key]) $.template[key].value = templateData[key];
})

function onFrame() {
	var dirty = false;
	for (var i = 0, iEnd = templateKeys.length; i < iEnd; i += 1) {
		var key = templateKeys[i];
		if (template[key].dirty) {
			template[key].dirty = false;
			templateData[key] = $.template[key].value;
			dirty = true;
		}
	}
	if (dirty) {
		localStorage['templateData'] = JSON.stringify(templateData);
	}
	window.requestAnimationFrame(onFrame);
}

window.requestAnimationFrame(onFrame);

function createTemplate(section, str) {
	var args = template[section].args;
	var keys = template[section].keys;
	this.undefinedKeys = [];
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
		var template = keys[i];
		var temp = createTemplate(template, $.template[template].value.toString());
		if (temp !== true) {
			temp.template = template;
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
		volumeLabel.innerText = root.path + '/';
		volumeLabel.setAttribute('title', root.path + '/');
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

Object.keys($.template).forEach(function(legend) {
	if (legend != 'container') {
		var el = $.template[legend];

		el.addEventListener('focus', function(e) {
			$.legend.container.setAttribute('legend', el.getAttribute('name'));
		});

		el.addEventListener('input', function(e) {
			// $.legend.container.setAttribute('legend', el.getAttribute('name'));
			console.log(el.name)
      template[el.name].dirty = true;
			
		});
	}
})

$.fileInput.addEventListener('change', function(e) {
	var files = e.target.files || e.dataTransfer.files;
	if (files.length) {
		var file = files[0];
		var reader = new FileReader();
		rootListInfo('Loading......');
		$.generate.setAttribute('disabled', '');
		$.save.setAttribute('disabled', '');
		reader.readAsArrayBuffer(file);
		reader.onload = function(result) {
			var ab = result.target.result;
			locate = new Locate32(ab);
			if (locate.error) {
				rootListInfo(locate.error);
				return;
			}
			$.generate.removeAttribute('disabled');
			rootList(locate.roots);
		}
	}

})


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
	};
	a.download = filename;
	a.href = URL.createObjectURL(blob);
	a.dataset.downloadurl = t + ':' + a.download + ':' + a.href;
	e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
	a.dispatchEvent(e)
}

rootListInfo('Load a DB to get started');
var list = '';
// var dCount=0,fCount=0,tdCount=0,tfCount=0;
// var totals=0,totalsCount=0;

$.generate.addEventListener('click', function(e) {
	var dCount = 0,
		fCount = 0,
		tdCount = 0,
		tfCount = 0;
	var totals = 0,
		totalsCount = 0;
	var volumes = [];
	[].forEach.call($.rootList.querySelectorAll('input[type="checkbox"]'), function(el) {
		if (el.checked) {
			var v = el.getAttribute('volume');
			totals += locate.roots[v].files;
			totals += locate.roots[v].directories;
			volumes.push(v);
		}
	})
	// console.log('totals',totals);
	if (!volumes.length) return;
	$.save.setAttribute('disabled', '');
	$.load.setAttribute('disabled', '');
	$.generate.setAttribute('disabled', '');
	list = '';
	dCount = 0;
	fCount = 0;
	// totals=0;
	totalsCount = 0;
	var temp = createTemplates(template);
	if (temp === true) {
		var dateRaw = new Date();
		var date = dateRaw.toString();
		dateRaw = dateRaw.getTime();
		var dCount = 0,
			fCount = 0;

		// Header
		createDates(locate.header);
		list += template['header'].func(locate.header, date, dateRaw);

		console.time('Scan Took');

		function scanIt(index) {
			createDates(locate.roots[index]);
			list += template['root'].func(locate.roots[index], date, dateRaw);

			locate.roots[index].scan(function(item, path) {
				if (item.event) {

					switch (item.event) {

						case 'end':
							// console.log('Scan Complete');

							// console.log('Directories:', dCount, 'Files:', fCount, "Toatal:", fCount + dCount);
							dCount = 0;
							fCount = 0;
							var next = volumes.pop();
							if (next) scanIt(next);
							else {
								// true end
								console.timeEnd('Scan Took');
								list += template['footer'].func(locate.header, date, dateRaw);
								$.save.removeAttribute('disabled');
								$.load.removeAttribute('disabled');
								$.generate.removeAttribute('disabled');
								$.progress.style.width = '0%';
							}
							return;
							// console.log(files)
							break;

						case 'pause':
							console.log('Scan Paused');
							console.timeEnd('Amount of time to pause');
							break;

						case 'continue':
							console.log('Scan Continuing');
							break;

						case 'updir':
							/*
                This event is called whenever we leave a directory and are back in its parent
                You can use this with the rest to reconstruct full trees if you want
              */
							// console.log('updir');
							break;
					}
				} else if (item.attrs.directory) {
					createDates(item);
					dCount++;
					list += template['directory'].func(item, path, date, dateRaw);
					totalsCount += 1;
					$.progress.style.width = ((totalsCount / totals) * 100) + '%';
					// testy = path.match(/.*[a-zA-Z].*[0-9]/); // just a useless regex to make it do something each item
					// testy = item.name.match(/.*[a-zA-Z].*[0-9]/); // just a useless regex to make it do something each item
					// files+=' '+path+item.name;
				} else {
					createDates(item);
					// testy = item.name.match(/.*[a-zA-Z].*[0-9]/); // just a useless regex to make it do something each item
					// files+=' '+path+item.name;
					fCount++;
					totalsCount += 1;
					list += template['file'].func(item, path, date, dateRaw);
				}
			});
		}

		scanIt(volumes.pop());

	} else {
		alert('Unable to generate template.\nUnkown variable/s...\n' + temp.join(', ') + '\n...was used in...\n' + temp.template);
		$.save.setAttribute('disabled', '');
		$.load.removeAttribute('disabled');
		$.generate.removeAttribute('disabled');
	}

});

$.save.addEventListener('click', function(e) {

	save(list);
});