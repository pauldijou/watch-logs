const { action } = require('mobx');
// const privateSymbol = Symbol('private');
const privateSymbol = '__private__';

function init(files, loggers, file) {
  const normalizer = normalize(files, loggers);

  return function (log) {
    log[privateSymbol] = {
      path: file.path,
      date: Date.parse(log.timestamp),
      clock: log.timestamp.split('T')[1].slice(0, -1),
      opened: false,
      color: null,
      bgColor: null,
      enabled: true
    };

    return normalizer(log);
  };
}

function normalize(files, loggers) {
  return function (log) {
    if (log.logger && loggers[log.logger] !== undefined) {
      log[privateSymbol].color = logger.color;
      log[privateSymbol].bgColor = logger.bgColor;
    } else {
      log[privateSymbol].color = null;
      log[privateSymbol].bgColor = null;
    }
    return log;
  };
}

// function bestLogger(loggers) {
//
//   return Object.
//
//   return function (log) {
//     if (!log.logger) { return false; };
//   };
// }


function getClock(log) {
  return log[privateSymbol].clock;
}

function getColor(log) {
  return log[privateSymbol].color;
}

function getBgColor(log) {
  return log[privateSymbol].bgColor;
}

const toggle = action('toggleLog', (log) => {
  log[privateSymbol].opened = !log[privateSymbol].opened;
});

function isOpen(log) {
  return log[privateSymbol].opened;
}

const matchPath = path => log => {
  return log[privateSymbol].path === path;
};

const matchPaths = paths => log => {
  return paths.indexOf(log[privateSymbol].path) >= 0;
};

const matchLevel = level => log => {
  return log.level === level;
};

const matchLevels = levels => log => {
  return levels.indexOf(log.level) >= 0;
};

const matchPeriod = (from, to) => log => {
  return (from === undefined || from <= log[privateSymbol].date)
    && (to === undefined || log[privateSymbol].date <= to);
};

const matchTags = tags => log => {
  return tags.reduce((acc, tag) => {
    return acc || (log.tags || []).indexOf(tag) >= 0;
  }, false);
};

const matchLogger = logger => log => {
  return log.logger && log.logger.indexOf(logger) === 0;
};

const matchMessage = msg => log => {
  return log.message && log.message.indexOf(msg) >= 0;
};

function fullMatch(filters) {
  const isMatchLevel = filters.levels && filters.levels.length > 0 ? matchLevels(filters.levels) : () => true;
  const isMatchPeriod = filters.from || filters.to ? matchPeriod(filters.from, filters.to) : () => true;
  const isMatchTags = filters.tags && filters.tags.length > 0 ? matchTags(filters.tags) : () => true;
  const isMatchLogger = filters.logger ? matchLogger(filters.logger) : () => true;
  const isMatchMessage = filters.message ? matchMessage(filters.message) : () => true;

  return function isFullMatch(log) {
    return log[privateSymbol].enabled
      && isMatchLevel(log)
      && isMatchPeriod(log)
      && isMatchTags(log)
      && isMatchLogger(log)
      && isMatchMessage(log);
  }
}

module.exports = {
  init,
  normalize,
  toggle,
  isOpen,
  getClock,
  getColor,
  getBgColor,
  matchPath,
  matchPaths,
  matchLevel,
  matchPeriod,
  matchTags,
  matchLogger,
  matchMessage,
  fullMatch
}
