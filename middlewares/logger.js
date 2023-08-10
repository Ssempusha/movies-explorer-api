// импортируем нужные модули
const winston = require('winston');
const expressWinston = require('express-winston');

// создадим логгер запросов
const requestLogger = expressWinston.logger({
  // transports отвечает за то, куда нужно писать лог. В нашем случае это файл request.log
  // также transports — массив, в него можно записать и другие транспорты.
  transports: [new winston.transports.File({ filename: 'request.log' })],
  // format отвечает за формат записи логов
  // мы указали json, потому что его удобно анализировать
  format: winston.format.json(),
});

// логгер ошибок
const errorLogger = expressWinston.errorLogger({
  transports: [new winston.transports.File({ filename: 'error.log' })],
  format: winston.format.json(),
});

module.exports = {
  requestLogger,
  errorLogger,
};
