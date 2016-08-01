const { action } = require('mobx');
const privateSymbol = Symbol('private');

const { findLevel, findBestLogger, findDuration, pad, pad2, hexToRgba } = require('./utils');

function init(loggers, levels, settings, initPayload, file) {
  const normalizerLoggers = normalizeLoggers(loggers);
  const normalizerLevels = normalizeLevels(levels);
  const normalizerSettings = normalizeSettings(settings, initPayload);

  return function doInit(log) {
    log[privateSymbol] = {
      file: file,
      logger: null,
      level: null,
      opened: false,
    };

    return normalizerLevels(normalizerLoggers(normalizerSettings(log)));
  };
}

function normalizeLoggers(loggers) {
  const doFindLogger = findBestLogger(loggers);

  return function (log) {
    if (log[privateSymbol].rawLogger) {
      log[privateSymbol].logger = doFindLogger(log[privateSymbol].rawLogger);
    }
    return log;
  };
}

function normalizeLevels(levels) {
  const doFindLevel = findLevel(levels);

  return function (log) {
    if (log[privateSymbol].rawLevel) {
      log[privateSymbol].level = doFindLevel(log[privateSymbol].rawLevel);
    }
    return log;
  };
}

function normalizeSettings(settings, initPayload) {
  return function (log) {
    log[privateSymbol].user = log[settings.userKey || 'user'];
    log[privateSymbol].rawLevel = log[settings.levelKey || 'level'];
    log[privateSymbol].rawLogger = log[settings.loggerKey || 'logger'];
    log[privateSymbol].payload = log[settings.payloadKey || 'payload'];

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

function getFile(log) {
  return log[privateSymbol].file;
}

function getLogger(log) {
  return log[privateSymbol].logger;
}

function getLevel(log) {
  return log[privateSymbol].level;
}

function getClockStyle(log) {
  if (log[privateSymbol].level) {
    return {
      color: 'white',
      backgroundColor: log[privateSymbol].level.color,
    };
  }
  return {};
}

function getStyle(log) {
  if (log[privateSymbol].logger) {
    return {
      color: log[privateSymbol].logger.color,
      backgroundColor: hexToRgba(log[privateSymbol].logger.bgColor, log[privateSymbol].logger.bgOpacity)
    };
  } else if (log[privateSymbol].level) {
    return {
      color: 'black',
      backgroundColor: log[privateSymbol].level.hexColor,
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
    && (!log[privateSymbol].logger || log[privateSymbol].logger.enabled)
    && (!log[privateSymbol].level || log[privateSymbol].level.enabled);
}

const matchPath = path => log => {
  return log[privateSymbol].file.path === path;
};

const matchPaths = paths => log => {
  return paths.indexOf(log[privateSymbol].file.path) >= 0;
};

const matchDuration = (duration, now) => log => {
  return (now - log[privateSymbol].date) >= duration.duration;
};

const matchLogger = logger => log => {
  return log[privateSymbol].rawLogger
    && log[privateSymbol].rawLogger.indexOf(logger) === 0;
};

const matchMessage = msg => log => {
  return log.message && log.message.indexOf(msg) >= 0;
};

const matchUser = user => log => {
  return log[privateSymbol].user === user;
};

function fullMatch(filters) {
  const duration = findDuration(filters.duration);
  const isMatchDuration = duration.duration > 0 ? matchDuration(duration, new Date()) : () => true;
  const isMatchLogger = filters.logger ? matchLogger(filters.logger) : () => true;
  const isMatchMessage = filters.message ? matchMessage(filters.message) : () => true;
  const isMatchUser = filters.user ? matchUser(filters.user) : () => true;

  return function isFullMatch(log) {
    return isEnabled(log)
      && isMatchDuration(log)
      && isMatchLogger(log)
      && isMatchMessage(log)
      && isMatchUser(log);
  }
}

module.exports = {
  init,
  normalizeLoggers,
  normalizeLevels,
  normalizeSettings,
  compare,
  toggle,
  isOpen,
  isEnabled,
  getClock,
  getFullClock,
  getPayload,
  getLogger,
  getLevel,
  getFile,
  getFileColor,
  getClockStyle,
  getStyle,
  matchPath,
  matchPaths,
  matchDuration,
  matchLogger,
  matchMessage,
  fullMatch
}
