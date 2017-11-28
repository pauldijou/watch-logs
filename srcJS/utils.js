const durations = [
  { key: 'lastMinute', label: 'Last minute', duration: 60 * 1000 },
  { key: 'lastFiveMinute', label: 'Last 5 minutes', duration: 5 * 60 * 1000 },
  { key: 'lastQuarter', label: 'Last 15 minutes', duration: 15 * 60 * 1000 },
  { key: 'lastHour', label: 'Last hour', duration: 60 * 60 * 1000 },
  { key: 'today', label: 'Today', duration: 24 * 60 * 60 * 1000 },
  { key: 'ever', label: 'Ever', duration: 0 },
];

const mapDurations = durations.reduce((m, d) => {
  m[d.key] = d;
  return m;
}, {});

function by(prop) {
  return function (a, b) {
    if (a[prop] > b[prop]) { return 1; }
    else if (a[prop] < b[prop]) { return -1; }
    else { return 0; }
  };
}

const findFile = files => path => files.find(file => file.path === path);
const findLevel = levels => name => levels.find(level => level.name === name);
const findLogger = loggers => name => loggers.find(logger => logger.name === name);
const findBestLogger = loggers => name => {
  return loggers.reduce((best, logger) => {
    if (name.indexOf(logger.name) === 0) {
      return best && best.name > logger.name ? best : logger;
    }
    return best;
  }, false);
};

function findDuration(key) {
  return mapDurations[key] || mapDurations['ever'];
}


function hexToRgba(hex, a) {
  const num = parseInt(hex.slice(1), 16);
  return `rgba(${num >> 16}, ${num >> 8 & 255}, ${num & 255}, ${a})`;
}

function not(predicate) {
  return function (item) {
    return !predicate(item);
  };
}

function pad(num) {
  return num < 10 ? '0' + num : num;
}

function pad2(num) {
  return num < 10 ? '00' + num : (num < 100 ? '0' + num : num);
}


module.exports = {
  durations: durations,
  by: by,
  hexToRgba: hexToRgba,
  pad: pad,
  pad2: pad2,
  not: not,
  findFile: findFile,
  findLevel: findLevel,
  findLogger: findLogger,
  findBestLogger: findBestLogger,
  findDuration: findDuration,
};
