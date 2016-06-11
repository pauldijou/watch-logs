const privateSymbol = Symbol('private');

const normalize = path => log => {
  log[privateSymbol] = {
    path,
    timestamp: Date.parse(log.timestamp),
    clock: log.timestamp.split('T')[1].split('.')[0]
  };
  return log;
};

function getClock(log) {
  return log[privateSymbol].clock;
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

const matchPeriod = (from = Date.now(), to = Date.now()) => log => {
  return from <= log[privateSymbol].timestamp && log[privateSymbol].timestamp <= to;
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
  const isMatchPaths = filters.paths ? matchPaths(filters.paths) : () => true;
  const isMatchLevel = filters.levels ? matchLevels(filters.levels) : () => true;
  const isMatchPeriod = filters.from || filters.to ? matchPeriod(filters.from, filters.to) : () => true;
  const isMatchTags = filters.tags ? matchTags(filters.tags) : () => true;
  const isMatchLogger = filters.logger ? matchLogger(filters.logger) : () => true;
  const isMatchMessage = filters.message ? matchMessage(filters.message) : () => true;

  return function isFullMatch(log) {
    return isMatchPaths(log)
      && isMatchLevel(log)
      && isMatchPeriod(log)
      && isMatchTags(log)
      && isMatchLogger(log)
      && isMatchMessage(log);
  }
}

module.exports = {
  normalize,
  getClock,
  matchPath,
  matchPaths,
  matchLevel,
  matchPeriod,
  matchTags,
  matchLogger,
  matchMessage,
  fullMatch
}
