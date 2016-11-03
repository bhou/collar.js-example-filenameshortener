// collar.enableDevtool();

const ns = collar.ns('com.collarjs.example.filename-shortener');

const input = ns.input('input');
const output = ns.output('output');


const {ipcRenderer, remote} = require('electron');
const shorten = remote.require('./shorten');


// shared data for the flow
var lengthLimit = 128;


// flow starts here
const uiSensor = ns.sensor('ui sensor', function (options) {
	var sensor = this;
	if (options === 'init app') {
		const holder = document.getElementById('holder')
		holder.ondragover = () => {
			return false;
		}
		holder.ondragleave = holder.ondragend = () => {
			return false;
		}
		holder.ondrop = (e) => {
			e.preventDefault()
			for (let f of e.dataTransfer.files) {
				sensor.send({
					msg: 'shorten file name',
					path: f.path,
					name: f.name
				})
			}
			return false;
		}

		// init limit range control
		$("#length").ionRangeSlider({
			min: 1,
			max: 256,
			from: 128,
			grid: true,
			onChange: function (data) {
				sensor.send({
					msg: 'change limit',
					value: data.from
				});
			},
		});
	}
});

uiSensor.to(input);

input
	.when('change limit', function (signal) {
		return signal.get('msg') === 'change limit';
	})
	.do('change limit setting', function (signal) {
		lengthLimit = signal.get('value') || 128;
	})
	.to(output);


input
	.when('init app', function (signal) {
		return signal.get('msg') === 'init app';
	})
	.do('setup ui sensor', function (signal) {
		uiSensor.watch('init app');
	})
	.map('prepare "app initiated" msg', function (signal) {
		return signal.new({
			msg: 'app initiated'
		})
	})
	.to(output);


const shortenFilenamePipeline = input
	.when('shorten file name', function (signal) {
		return signal.get('msg') === 'shorten file name';
	})
	.map('validate msg', function (signal) {
		if (!signal.get('path')) {
			throw new Error('invalid message format, "path" property required');
		}

		if (!signal.get('name')) {
			throw new Error('invalid message format, "name" property required');
		}
		return signal;
	})
	.map('check file name length', function (signal) {
		var name = signal.get('name');
		if (name.length > lengthLimit) {
			return signal.new({
				msg: 'file name longer than limit',
				path: signal.get('path'),
				name: signal.get('name')
			});
		} else {
			return signal.new({
				msg: 'file name shorter than limit',
				path: signal.get('path'),
				name: signal.get('name')
			});
		}
	})
	.errors(function (signal, rethrow) {
		rethrow(signal.new({
			type: 'invalid msg',
			reason: signal.error.message
		}));
	});

shortenFilenamePipeline
	.when('file name longer than limit', function (signal) {
		return signal.get('msg') === 'file name longer than limit';
	})
	.actuator('shorten file name', function (signal, done) {
		shorten.shortenFilename(
			signal.get('path'),
			signal.get('name'),
			lengthLimit, done);
	})
	.map('prepare "file name shortened" msg', function (signal) {
		return signal.new({
			msg: 'file name shortened',
			oldPath: signal.get('path'),
			newPath: signal.getResult().path,
			oldName: signal.get('name'),
			newName: signal.getResult().name
		})
	})
	.to(output);

shortenFilenamePipeline
	.when('file name shorter than limit', function (signal) {
		return signal.get('msg') === 'file name shorter than limit';
	})
	.map('prepare "file name unchanged" msg', function (signal) {
		return signal.new({
			msg: 'file name unchanged',
			path: signal.get('path'),
			name: signal.get('name')
		});
	})
	.to(output);

shortenFilenamePipeline
	.when('invalid msg', function (signal) {
		return signal.get('msg') === 'invalid msg';
	})
	.to(output);


// initiate the app
input.push({
	msg: 'init app'
});
