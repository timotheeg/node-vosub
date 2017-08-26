const Promise  = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);

class Idx {
	static loadFromFile(filename) {
		return readFile(filename)
			.then(Idx.parse)
			.catch(err => console.error);
	}

	static parse(source_txt) {
		const idx = new Idx();

		source_txt
			.toString()
			.split(/[\r\n]+/)
			.filter(line => line && /^[^#]/.test(line))
			.forEach(line => {
				let m = line.match(/^([^:]+): (.+)$/);

				if (!m) return;

				idx.addSetting(m[1], m[2]);
			});

		return idx;
	}

	constructor() {
		this.settings = [];
		this.timestamps = [];
	}

	addSetting(name, _value) {
		if (!settings_parsers.has(name)) {
			console.warn(`Unrecognized setting ${name}: ${_value}`);
			return;
		}

		try {
			let value = settings_parsers.get(name)(_value);

			if (name ==='timestamp') {
				this.timestamps.push(value);
			}
			else {
				this.settings.push({name, value});
			}
		}
		catch(e) {
			console.warn(`Unable to parse value for ${name}: ${_value}`, e);
			return;
		}
	}
}

module.exports.Idx = Idx;

const settings_parsers = new Map()

.set('size', v => {
	let m = v.match(/^(\d+)x(\d+)$/);

	if (!m) throw new TypeError('Invalid size');

	return {
		width:  parseInt(m[1], 10),
		height: parseInt(m[2], 10),
	};
})

.set('org', v => {
	let m = v.match(/^(\d+),\s+(\d+)$/);

	if (!m) throw new TypeError('Invalid origin');

	return {
		top:  parseInt(m[1], 10),
		left: parseInt(m[2], 10),
	};
})

.set('scale', v => {
	let m = v.match(/^(\d+)%,\s+(\d+)%$/);

	if (!m) throw new TypeError('Invalid scale');

	return {
		width:  parseInt(m[1], 10) / 100,
		height: parseInt(m[2], 10) / 100,
	};
})

.set('alpha', v => {
	let m = v.match(/^(\d+)%$/);

	if (!m) throw new TypeError('Invalid alpha');

	return parseInt(m[1], 10) / 100;
})

.set('smooth', v => {
	return 'ON' === v;
})

.set('fadein/out', v => {
	let m = v.match(/^(\d+),\s+(\d+)$/);

	if (!m) throw new TypeError('fadein/out');

	return {
		in:  parseInt(m[1], 10),
		out: parseInt(m[2], 10),
	};
})

.set('align', v => v /* TODO */)

.set('time offset', v => {
	let m = v.match(/^(\d+)$/);

	if (!m) throw new TypeError('Invalid scale');

	return {
		in:  parseInt(m[1], 10),
		out: parseInt(m[2], 10),
	};
})

.set('forced subs', v => {
	return 'ON' === v;
})

.set('palette', v => {
	let m = v.match(/^([0-9a-f]{6})(\s*,\s*([0-9a-f]{6}))*$/i);

	if (!m) throw new TypeError('Invalid palette');

	return v.split(/\s*,\s*/).map(c => parseInt(c, 16));
})

.set('custom colors', v => {
	let m = v.match(/^(ON|OFF)\s*,\s*tridx:\s*(\d+)\s*,\s*colors:\s*([0-9a-f]{6})(\s*,\s*([0-9a-f]{6}))*$/i);

	if (!m) throw new TypeError('Invalid custom colors');

	return {
		enabled: 'ON' === m[1],
		tridx:   parseInt(m[2], 16),
		colors:  m[3].split(/\s*,\s*/).map(c => parseInt(c, 16))
	}
})

.set('id', v => {
	let m = v.match(/^([a-z]+)\s*,\s*index:\s*(\d+)$/i);

	if (!m) throw new TypeError('Invalid id');

	return m[1];
})

.set('timestamp', v => {
	let m = v.match(/^(\d\d):(\d\d):(\d\d):(\d\d\d)\s*,\s*filepos: ([0-9a-f]+)$/i);

	if (!m) throw new TypeError('Invalid timestamp');

	return {
		time: (
			  parseInt(m[1], 10) * 3600000
			+ parseInt(m[2], 10) * 60000
			+ parseInt(m[3], 10) * 1000
			+ parseInt(m[4], 10)
		),
		pos: parseInt(m[5], 16)
	};
});
