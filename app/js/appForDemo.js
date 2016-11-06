collar.enableDevtool();

const ns = collar.ns('com.collarjs.example.filename-shortener');

const input = ns.input('input');
const output = ns.output('output');


const {ipcRenderer, remote} = require('electron');
const shorten = remote.require('./shorten');

function getFileName(path) {
  return path
    .replace(/^.*[\\\/]/, '')
    .replace(/\.[^/.]+$/, '');
}

/**
 *  initiationg flow
 */

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
      var limit = parseInt(document.querySelector('#length').value);
      e.preventDefault()
      for (let f of e.dataTransfer.files) {
        sensor.send({
          msg: 'shorten file name',
          path: f.path,
          limit: limit
        })
      }
      return false;
    }

    $("#length").ionRangeSlider({
      min: 1,
      max: 256,
      from: 128,
      grid: true
    });

  }
});

uiSensor.to(input);

input
  .when('init app', signal => {
    return signal.get('msg') === 'init app';
  })
  .do('init ui sensor', signal => {
    uiSensor.watch('init app');
  })
  .map('prepare "ui initiated" message', signal => {
    return signal.new({
      msg: 'ui initiated'
    });
  })
  .to(output);



/**
 *  shorten file name flow
 */
const shortenFileName = input
  .when('shorten file name', signal => {
    return signal.get('msg') === 'shorten file name'
  })
  .map('input validation', signal => {
    if (!signal.get('path') || !signal.get('limit')) 
      throw new Error('"path" and "limit" property required');
    return signal.set('name', getFileName(signal.get('path')));
  })
  .map('check file name length', signal => {
    if (signal.get('name').length > signal.get('limit')) {
      return signal.set('msg', 'longer than limit');    
    } else {
      return signal.set('msg', 'shorter than limit');   
    }
  }); 

shortenFileName
  .when('shorter than limit', signal => {
    return signal.get('msg') === 'shorter than limit';
  })
  .map('prepare "file name unchanged" message', signal => {
    return signal.new({
      msg: 'file name unchanged',
      path: signal.get('path'),
      limit: signal.get('limit')
    })
  })
  .to(output);

shortenFileName
  .when('longer than limit', signal => {
    return signal.get('msg') === 'longer than limit';
  })
  .actuator('shorten file name', function (signal, done) {
    shorten.shortenFilename(
      signal.get('path'),
      signal.get('name'),
      signal.get('limit'), done);
  })
  .map('prepare "file name shortened" message', signal => {
    return signal.new({
      msg: 'file name shortened',
      path: signal.get('path'),
      newPath: signal.getResult().path,
      oldName: signal.get('name'),
      newName: signal.getResult().name
    });
  })
  .to(output);


/**
 * init app
 */
  input.push({
    msg: 'init app'
  })
