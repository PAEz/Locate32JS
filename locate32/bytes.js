/*
	Bytes
	PAEz

	My utility belt for dealing with array buffers with an emphasis on bytes.
	Some of its just me and a bunch was ripped from all over the place
	I really wish I kept a record of what I got where, respect to the original authors and apologies :(
*/

var Bytes = (function() {

	var Bytes = function(ab, opt_offset, opt_length) {
		if (!ab) return;
		var offset = opt_offset || 0;
		var length = opt_length || ab.byteLength || ab.length || 0;
		var buffer;

		if (ab instanceof ArrayBuffer) buffer = ab;
		else if (typeof ab == 'number') buffer = new ArrayBuffer(ab);
		else if (ab.isBytes) buffer = ab.buffer;
		else if (typeof ab == 'string') buffer = strToUTF8Arr(ab).buffer;
		else buffer = new Uint8Array(ab).buffer;

		if (opt_offset || opt_length) buffer = buffer.slice(offset, offset + length);
		var arr = new Uint8Array(buffer);
		augment(arr, funcs, true);
		arr.view = new DataView(buffer);
		return arr;
	};

	//base64
	function base64clean(str) {
		// Node strips out invalid characters like \n and \t from the string, base64-js does not
		str = str.trim().replace(INVALID_BASE64_RE, '')
		// Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
		while (str.length % 4 !== 0) {
			str = str + '='
		}
		return str
	}

	function uint6ToB64(nUint6) {
		return nUint6 < 26 ?
			nUint6 + 65 : nUint6 < 52 ?
			nUint6 + 71 : nUint6 < 62 ?
			nUint6 - 4 : nUint6 === 62 ?
			43 : nUint6 === 63 ?
			47 :
			65;
	}

	function b64ToUint6(nChr) {
		return nChr > 64 && nChr < 91 ?
			nChr - 65 : nChr > 96 && nChr < 123 ?
			nChr - 71 : nChr > 47 && nChr < 58 ?
			nChr + 4 : nChr === 43 ?
			62 : nChr === 47 ?
			63 :
			0;
	}
	//\base64

	function augment(what, funcs, silent) {
		Object.keys(funcs).forEach(function(func) {
			if (!silent) what[func] = funcs[func];
			else Object.defineProperty(what, func, {
				value: funcs[func],
				writable: true,
				enumerable: false,
				configurable: true
			});
		});
	};

	function toArray(sub) {
		var type = typeof sub;
		if (type == 'string') return strToUTF8Arr(sub);
		else if (type == 'number') return [sub];
		// else if (sub.isBytes) return sub;
		return sub;
	}

	var funcs = {
		//types
		readUInt24BE: function(off) {
			return (((this[off] << 8) + this[off + 1]) << 8) + this[off + 2];
		},

		readUInt24LE: function(off) {
			return (((this[off + 2] << 8) + this[off + 1]) << 8) + thiss[off];
		},

		getUint24: function(off, le) {
			return le ? this.readUInt24LE(off) : this.readUInt24BE(off);
		},

		syncSafe32Int: function(off) { // not sure what section...types?
			var value = this.view.getUint32(off, false),
				out = 0,
				mask = 0x7F000000;

			while (mask) {
				out >>= 1;
				out |= value & mask;
				mask >>= 8;
			}

			return out;
		},

		charAt: function(off) {
			return String.fromCharCode(this[off]);
		},

		getBit: function(off, pos) {
			return !!(this[off] & (1 << pos));
		},
		//\types

		//bitarray
		// wish I could remember who I stole the idea for this off, SUCH a cool idea!
		toBitArray: function(index, length) {
			length = length || this.length;
			if (length > 4) length = 4;
			index = index || 0;
			var bits = new Bytes(length * 8);
			for (var i = 0; i < length; i += 1) {
				for (var b = 0, bEnd = 8; b < bEnd; b += 1) {
					bits[(i * 8) + b] = (this[index + i] & (128 >> b)) ? 1 : 0;
				}
			}
			return bits;
		},

		fromBitArray: function() {
			var total = [];
			for (var i = 0, iEnd = this.length; i < iEnd; i += 8) {
				var byte = 0;
				for (var b = 0; b < 8; b += 1) {
					if (this[i + b]) byte = byte | (128 >> b);
				}
				total.push(byte);
			}
			return new Bytes(total);
		},

		bitArrayToNumber: function(start, end) {
			var result = 0;
			start = start || 0;
			end = end || this.length;
			if (end - start > 32) end = start + 32;
			var pos = end - start - 1;
			for (; start < end; start += 1) {
				result = result | (this[start] << (pos--));
			}
			return result;
		},
		//\bitarray

		//base64
		// https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_.232_.E2.80.93_rewriting_atob()_and_btoa()_using_TypedArrays_and_UTF-8
		fromBase64: function(sBase64, nBlocksSize) {
			sBase64 = base64clean(sBase64);
			var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""),
				nInLen = sB64Enc.length,
				nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2,
				taBytes = new Bytes(nOutLen);

			for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
				nMod4 = nInIdx & 3;
				nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
				if (nMod4 === 3 || nInLen - nInIdx === 1) {
					for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
						taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
					}
					nUint24 = 0;

				}
			}
			return taBytes;
		},

		toBase64: function() {
			var aBytes = this;
			var nMod3 = 2,
				sB64Enc = "";

			for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
				nMod3 = nIdx % 3;
				if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) {
					sB64Enc += "\r\n";
				}
				nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
				if (nMod3 === 2 || aBytes.length - nIdx === 1) {
					sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
					nUint24 = 0;
				}
			}
			return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');
		},
		//\base64

		//alter
		append: function(buffer2) {
			var buffer1 = this;
			buffer2 = new Bytes(buffer2);
			var tmp = new Bytes(buffer1.length + buffer2.length);
			tmp.set(buffer1, 0);
			tmp.set(buffer2, buffer1.length);
			return tmp;
		},

		reverse: function() {
			var arr = new Bytes(this.length),
				left = 0,
				right = this.length - 1;
			for (; left < right; left += 1, right -= 1) {
				arr[left] = this[right];
				arr[right] = this[left];
			}
			if (left == right) arr[left] = this[left];
			return arr;
		},

		// Copied straight from browserify's Buffer
		// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
		copy: function(target, target_start, start, end) {
			var source = this

			if (!start) start = 0;
			if (!end && end !== 0) end = source.length;
			if (!target_start) target_start = 0;

			// Copy 0 bytes; we're done
			if (end === start) return;
			if (target.length === 0 || source.length === 0) return;

			// Fatal error conditions
			if (end < start) throw new TypeError('sourceEnd < sourceStart');
			if (target_start < 0 || target_start >= target.length)
				throw new TypeError('targetStart out of bounds');
			if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds');
			if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds');

			// Are we oob?
			if (end > source.length)
				end = source.length;
			if (target.length - target_start < end - start)
				end = target.length - target_start + start;

			var len = end - start;

			if (len < 1000) {
				for (var i = 0; i < len; i++) {
					target[i + target_start] = source[i + start];
				}
			} else {
				target.set(source.subarray(start, start + len), target_start);
			}

			return source;
		},

		slice: function(off, off2) {
			off = off || 0;
			off2 = off2 || this.length;
			if (off2 - off <= 0) return new Bytes(0);
			return new Bytes(this.buffer, off, off2 - off);
		},
		//\alter

		//values
		sum: function(start, end) {
			var sum = 0;
			start = start || 0;
			end = end || this.length;
			for (var i = start, iMod = start < end ? 1 : -1; i != end; i += iMod) {
				sum += this[i];
			}
			return sum;
		},

		equals: function(b, index) {
			b = toArray(b);
			index = index || 0;
			if (this.length < index + b.length) return false;
			for (var i = 0; i < b.length; ++i)
				if (this[index + i] !== b[i]) return false;
			return true;
		},

		indexOf: function(sub, idx, lastIdx) {
			sub = toArray(sub);
			var idx = idx || 0,
				lastIdx = lastIdx || this.length,
				//len = lastIdx ? lastIdx : this.length - (sub.length - 1),
				subSize = sub.length,
				found = -1;
			if (idx == lastIdx) lastIdx += 1;
			for (var idxMod = idx < lastIdx ? 1 : -1; idx != lastIdx; idx += idxMod) {
				if (this[idx] == sub[0]) {
					for (var i = 0; i < subSize; i += 1) {
						if (this[idx + i] !== sub[i]) break;
						if (i == subSize - 1) found = idx;
					}
					if (found !== -1) return found;
				}
			}
			return -1;
		},

		findNull16: function(index, end) {
		  var i = index,end=end||this.length;
		    while (this[i] !== 0 || this[i+1] !== 0) {
		      if (i >= end) return end;
		      i += 2;
		    }
		    return i;
		},

		lastIndexOf: function(sub, idx, lastIdx) {
			if (lastIdx === undefined) lastIdx = -1;
			if (idx === undefined) idx = sub.length - 1;
			return this.indexOf(sub, idx, lastIdx);
		},
		//\values

		//util
		save: function(filename) {
			filename = filename || 'save.bin';
			var blob = new Blob([this], {
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
		},

		// I have no idea what a good hash is....
		// https://github.com/jasondavies/bloomfilter.js/blob/master/bloomfilter.js#L92
		hash: function() {
			var v = this;
			var n = v.length,
				a = 2166136261,
				c,
				d,
				i = -1;
			while (++i < n) {
				c = v[i];
				if (d = c & 0xff000000) {
					a ^= d >> 24;
					a += (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
				}
				if (d = c & 0xff0000) {
					a ^= d >> 16;
					a += (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
				}
				if (d = c & 0xff00) {
					a ^= d >> 8;
					a += (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
				}
				a ^= c & 0xff;
				a += (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
			}
			// From http://home.comcast.net/~bretm/hash/6.html
			a += a << 13;
			a ^= a >> 7;
			a += a << 3;
			a ^= a >> 17;
			a += a << 5;
			return a & 0xffffffff;
		},
		//\util

		//string
		decodeString: function(encoding, start, end) {
			start = start || 0;
			end = end || this.length;

			if (start > end)
				return;

			var bytes = this.subarray(start, end);
			var sString = '';
			switch (encoding) {
				case 'utf-16':
				case 'utf-16le':
				case 'utf-16be':
				case 'utf16':
				case 'utf16le':
				case 'utf16be':
					sString = readUTF16String(bytes);
					break;

				case 'utf-8':
				case 'utf8':
					sString = readUTF8String(bytes);
					break;

				case 'iso-8859-1':
				case 'iso':
				case 'oem':
					sString = readISOString(bytes);
					break;

				case 'ascii':
					sString = readASCII(bytes);
					break;

				default:
					sString = readUTF8String(bytes);
					break;
			}

			return sString;
		},
		//\string
		isBytes: true,
		view: null
	};
	//string
	funcs.toString = funcs.decodeString;
	//\string
	augment(Bytes, funcs);

	// this isnt in the a string section as its not about
	// reading a string from bytes, but turning a string into
	// an array to turn into a Bytes.
	function strToUTF8Arr(sDOMStr) {
		var aBytes, nChr, nStrLen = sDOMStr.length,
			nArrLen = 0;

		/* mapping... */

		for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
			nChr = sDOMStr.charCodeAt(nMapIdx);
			nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
		}

		aBytes = new Uint8Array(nArrLen);

		/* transcription... */

		for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
			nChr = sDOMStr.charCodeAt(nChrIdx);
			if (nChr < 128) {
				/* one byte */
				aBytes[nIdx++] = nChr;
			} else if (nChr < 0x800) {
				/* two bytes */
				aBytes[nIdx++] = 192 + (nChr >>> 6);
				aBytes[nIdx++] = 128 + (nChr & 63);
			} else if (nChr < 0x10000) {
				/* three bytes */
				aBytes[nIdx++] = 224 + (nChr >>> 12);
				aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
				aBytes[nIdx++] = 128 + (nChr & 63);
			} else if (nChr < 0x200000) {
				/* four bytes */
				aBytes[nIdx++] = 240 + (nChr >>> 18);
				aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
				aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
				aBytes[nIdx++] = 128 + (nChr & 63);
			} else if (nChr < 0x4000000) {
				/* five bytes */
				aBytes[nIdx++] = 248 + (nChr >>> 24);
				aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
				aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
				aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
				aBytes[nIdx++] = 128 + (nChr & 63);
			} else /* if (nChr <= 0x7fffffff) */ {
				/* six bytes */
				aBytes[nIdx++] = 252 + (nChr >>> 30);
				aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
				aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
				aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
				aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
				aBytes[nIdx++] = 128 + (nChr & 63);
			}
		}

		return aBytes;
	}

	//string
	function readISOString(input) {
		var INDEX_BY_POINTER = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ";
		var ERROR_CHAR = '\uFFFD';

		var length = input.length;
		var index = -1;
		var byteValue;
		var pointer;
		var result = '';
		while (++index < length) {
			byteValue = input[index];
			// “If `byte` is in the range `0x00` to `0x7F`, return a code point whose
			// value is `byte`.”
			if (byteValue >= 0x00 && byteValue <= 0x7F) {
				result += String.fromCharCode(byteValue);
				continue;
			}
			// “Let `code point` be the index code point for `byte − 0x80` in index
			// `single-byte`.”
			pointer = byteValue - 0x80;
			if (pointer <= 256) {
				// “Return a code point whose value is `code point`.”
				result += INDEX_BY_POINTER[pointer];
			} else {
				// “If `code point` is `null`, return `error`.”
				result += ERROR_CHAR;
			}
		}
		return result;
	}

	function readUTF16String(bytes, bigEndian, maxBytes) {
		var ix = 0;
		var offset1 = 1,
			offset2 = 0;
		maxBytes = Math.min(maxBytes || bytes.length, bytes.length);

		if (bytes[0] == 0xFE && bytes[1] == 0xFF) {
			bigEndian = true;
			ix = 2;
		} else if (bytes[0] == 0xFF && bytes[1] == 0xFE) {
			bigEndian = false;
			ix = 2;
		}
		if (bigEndian) {
			offset1 = 0;
			offset2 = 1;
		}

		var arr = [];
		for (var j = 0; ix < maxBytes; j++) {
			var byte1 = bytes[ix + offset1];
			var byte2 = bytes[ix + offset2];
			var word1 = (byte1 << 8) + byte2;
			ix += 2;
			if (word1 == 0x0000) {
				break;
			} else if (byte1 < 0xD8 || byte1 >= 0xE0) {
				arr[j] = String.fromCharCode(word1);
			} else {
				var byte3 = bytes[ix + offset1];
				var byte4 = bytes[ix + offset2];
				var word2 = (byte3 << 8) + byte4;
				ix += 2;
				arr[j] = String.fromCharCode(word1, word2);
			}
		}
		// var string = new String(arr.join(""));
		var string = arr.join("");
		string.bytesReadCount = ix;
		return string;
	}

	function readUTF8String(bytes, maxBytes) {
		var sView = "";

		for (var nPart, nLen = bytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
			nPart = bytes[nIdx];
			///PAEz
			if (nPart===0)break;
			sView += String.fromCharCode(
				nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
				/* (nPart - 252 << 30) may be not so safe in ECMAScript! So...: */
				(nPart - 252) * 1073741824 + (bytes[++nIdx] - 128 << 24) + (bytes[++nIdx] - 128 << 18) + (bytes[++nIdx] - 128 << 12) + (bytes[++nIdx] - 128 << 6) + bytes[++nIdx] - 128 : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
				(nPart - 248 << 24) + (bytes[++nIdx] - 128 << 18) + (bytes[++nIdx] - 128 << 12) + (bytes[++nIdx] - 128 << 6) + bytes[++nIdx] - 128 : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
				(nPart - 240 << 18) + (bytes[++nIdx] - 128 << 12) + (bytes[++nIdx] - 128 << 6) + bytes[++nIdx] - 128 : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
				(nPart - 224 << 12) + (bytes[++nIdx] - 128 << 6) + bytes[++nIdx] - 128 : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
				(nPart - 192 << 6) + bytes[++nIdx] - 128 : /* nPart < 127 ? */ /* one byte */
				nPart
			);
		}

		return sView;
	}


	// function readUTF8String(bytes, maxBytes) {
	// 	var ix = 0;
	// 	maxBytes = bytes.length;

	// 	if (bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF) {
	// 		ix = 3;
	// 	}

	// 	var arr = [];
	// 	for (var j = 0; ix < maxBytes; j++) {
	// 		var byte1 = bytes[ix++];
	// 		if (byte1 == 0x00) {
	// 			break;
	// 		} else if (byte1 < 0x80) {
	// 			arr[j] = String.fromCharCode(byte1);
	// 		} else if (byte1 >= 0xC2 && byte1 < 0xE0) {
	// 			var byte2 = bytes[ix++];
	// 			arr[j] = String.fromCharCode(((byte1 & 0x1F) << 6) + (byte2 & 0x3F));
	// 		} else if (byte1 >= 0xE0 && byte1 < 0xF0) {
	// 			var byte2 = bytes[ix++];
	// 			var byte3 = bytes[ix++];
	// 			arr[j] = String.fromCharCode(((byte1 & 0xFF) << 12) + ((byte2 & 0x3F) << 6) + (byte3 & 0x3F));
	// 		} else if (byte1 >= 0xF0 && byte1 < 0xF5) {
	// 			var byte2 = bytes[ix++];
	// 			var byte3 = bytes[ix++];
	// 			var byte4 = bytes[ix++];
	// 			var codepoint = ((byte1 & 0x07) << 18) + ((byte2 & 0x3F) << 12) + ((byte3 & 0x3F) << 6) + (byte4 & 0x3F) - 0x10000;
	// 			arr[j] = String.fromCharCode(
	// 				(codepoint >> 10) + 0xD800, (codepoint & 0x3FF) + 0xDC00
	// 			);
	// 		}
	// 	}
	// 	var string = arr.join("");
	// 	string.bytesReadCount = ix;
	// 	return string;
	// }

	// function decodeUtf8Char(str) {
	// 	try {
	// 		return decodeURIComponent(str)
	// 	} catch (err) {
	// 		return String.fromCharCode(0xFFFD) // UTF 8 invalid char
	// 	}
	// }

	// function readUTF8String(buf, start, end) {
	// 	var res = '';
	// 	var tmp = '';
	// 	end = Math.min(buf.length, end);
	// 	start = start || 0;
	// 	end = end || buf.length;

	// 	for (var i = start; i < end; i++) {
	// 		if (buf[i] <= 0x7F) {
	// 			res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
	// 			tmp = ''
	// 		} else {
	// 			tmp += '%' + buf[i].toString(16)
	// 		}
	// 	}
	// 	//console.log('here', base64clean(res + decodeUtf8Char(tmp)))
	// 	return res + decodeUtf8Char(tmp)
	// }

	// function decodeUtf8Char(str) {
	// 	try {
	// 		return decodeURIComponent(str)
	// 	} catch (err) {
	// 		return String.fromCharCode(0xFFFD) // UTF 8 invalid char
	// 	}
	// }

	// function utf8Slice(buf, start, end) {
	// 	var res = ''
	// 	var tmp = ''
	// 	end = Math.min(buf.length, end)

	// 	for (var i = start; i < end; i++) {
	// 		if (buf[i] <= 0x7F) {
	// 			res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
	// 			tmp = ''
	// 		} else {
	// 			tmp += '%' + buf[i].toString(16)
	// 		}
	// 	}

	// 	return res + decodeUtf8Char(tmp)
	// }

	function readASCII(buf) {
		var ret = '',
			end = buf.length;

		for (var i = 0; i < end; i++) {
			ret += String.fromCharCode(buf[i])
		}
		return ret
	}
	//\string

	return Bytes;
})();


// a = new Bytes([255, 251, 144, 4])
// b = a.toBitArray();
// console.log(b);
// a = b.fromBitArray();
