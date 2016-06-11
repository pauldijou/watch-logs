var winston = require('winston');

winston.add(winston.transports.File, { filename: 'winston.log' });
winston.remove(winston.transports.Console);

winston.log('info', 'Hello distributed log files!');
winston.info('Hello again distributed logs', { payload: { toto: [1,2], a: true, b: 50, z: { y: 'a' } } });
