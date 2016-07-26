const { action } = require('mobx');
const privateSymbol = Symbol('private');
// const privateSymbol = '__private__';

const findFile = files => path => files.find(file => file.path === path);
const findLogger = loggers => name => loggers.find(logger => logger.name === name);
const findBestLogger = loggers => name => {
  return loggers.reduce((best, logger) => {
    if (name.indexOf(logger.name) === 0) {
      return best && best.name > logger.name ? best : logger;
    }
    return best;
  }, false);
};

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

function init(loggers, settings, initPayload, file) {
  const normalizerLoggers = normalizeLoggers(loggers);
  const normalizerSettings = normalizeSettings(settings, initPayload);

  return function doInit(log) {
    log[privateSymbol] = {
      file: file,
      logger: null,
      opened: false,
    };

    return normalizerSettings(normalizerLoggers(log));
  };
}

function normalizeLoggers(loggers) {
  const doFindLogger = findBestLogger(loggers);

  return function (log) {
    if (log.logger) {
      log[privateSymbol].logger = doFindLogger(log.logger);
    }
    return log;
  };
}

function normalizeSettings(settings, initPayload) {
  return function (log) {
    log[privateSymbol].payload = settings.payloadKey ? log[settings.payloadKey] : log.payload;

    try {
      log[privateSymbol].date = new Date(settings.timestampKey ? log[settings.timestampKey] : log.timestamp || log.time);
      if (settings.payloadParse && typeof log[privateSymbol].payload === 'string') {
        log[privateSymbol].payload = JSON.parse(log[privateSymbol].payload);
      }
    } catch (e) {
      console.warn('Failed to normalize log', log, log[privateSymbol]);
      console.error(e);

    }

    if (log[privateSymbol].payload) {
      log[privateSymbol].payload = initPayload(log[privateSymbol].payload);
    }

    if (isNaN(log[privateSymbol].date.valueOf())) {
      log[privateSymbol].date = new Date();
      log[privateSymbol].clock = 'Invalid date';
      log[privateSymbol].fullClock = 'Invalid date';
    } else {
      log[privateSymbol].clock = '' +
        pad(log[privateSymbol].date.getHours()) +
        ':' +
        pad(log[privateSymbol].date.getMinutes()) +
        ':' +
        pad(log[privateSymbol].date.getSeconds()) +
        '.' +
        pad2(log[privateSymbol].date.getMilliseconds());

      log[privateSymbol].fullClock = '' +
        log[privateSymbol].date.getFullYear() +
        '-' +
        pad(1 + log[privateSymbol].date.getMonth()) +
        '-' +
        pad(log[privateSymbol].date.getDate()) +
        ' ' +
        log[privateSymbol].clock;
    }

    return log;
  }
}

function compare(log1, log2) {
  return log2[privateSymbol].date - log1[privateSymbol].date;
}

function getClock(log) {
  return log[privateSymbol].clock;
}

function getFullClock(log) {
  return log[privateSymbol].fullClock;
}

function getPayload(log) {
  return log[privateSymbol].payload;
}

function getFileColor(log) {
  return log[privateSymbol].file.color;
}

function getStyle(log) {
  if (log[privateSymbol].logger) {
    return {
      color: log[privateSymbol].logger.color,
      backgroundColor: hexToRgba(log[privateSymbol].logger.bgColor, log[privateSymbol].logger.bgOpacity)
    };
  }
  return {};
}

const renderEvent = new Event('render');

const toggle = (log) => {
  log[privateSymbol].opened = !log[privateSymbol].opened;
  document.dispatchEvent(renderEvent);
};

function isOpen(log) {
  return log[privateSymbol].opened;
}

function isEnabled(log) {
  return log[privateSymbol].file.enabled
    && (!log[privateSymbol].logger || log[privateSymbol].logger.enabled);
}

const matchPath = path => log => {
  return log[privateSymbol].file.path === path;
};

const matchPaths = paths => log => {
  return paths.indexOf(log[privateSymbol].file.path) >= 0;
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
    return isEnabled(log)
      && isMatchLevel(log)
      && isMatchPeriod(log)
      && isMatchTags(log)
      && isMatchLogger(log)
      && isMatchMessage(log);
  }
}

module.exports = {
  findFile,
  findLogger,
  not,
  init,
  normalizeLoggers,
  normalizeSettings,
  compare,
  toggle,
  isOpen,
  isEnabled,
  getClock,
  getFullClock,
  getPayload,
  getFileColor,
  getStyle,
  matchPath,
  matchPaths,
  matchLevel,
  matchPeriod,
  matchTags,
  matchLogger,
  matchMessage,
  fullMatch
}
