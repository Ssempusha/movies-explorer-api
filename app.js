require('dotenv').config(); // для .evn(файл для скрытия переменных)
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { celebrate, Joi, errors } = require('celebrate');
const { requestLogger, errorLogger } = require('./middlewares/logger'); // импорт логгеров
const errorHandler = require('./middlewares/errors');
const NotFoundError = require('./errors/not-found-err');

const app = express();
mongoose.connect('mongodb://localhost:27017/bitfilmsdb', { family: 4 });
const { createUser, login, signout } = require('./controllers/users');
const auth = require('./middlewares/auth');
const usersRouter = require('./routes/users');
const moviesRouter = require('./routes/movies');
const { limiter } = require('./utils/limiter');

app.use(cors({
  origin: ['http://localhost:3001', 'http://moviessempusha.nomoreparties.co', 'https://moviessempusha.nomoreparties.co'],
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 30,
}));

app.use(express.json()); // приложение прочитает тело запроса и выведет в формате json
app.use(helmet()); // защита от уязвимостей
app.use(cookieParser());

// подключаем rate-limiter
app.use(limiter);
app.use(requestLogger); // подключаем логгер запросов

app.post('/signup', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    name: Joi.string().min(2).max(30),
  }),
}), createUser);

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), login);

app.use(auth); // нужно размещать над теми запросами, где нужна проверка на токен

app.post('/signout', signout);

// при обращении на /users используется usersRouter
app.use('/users', usersRouter);
app.use('/movies', moviesRouter);
// при обращении на любые другие роуты произойдёт ошибка
app.use('*', (req, res, next) => {
  next(new NotFoundError('Страница не найдена'));
});

app.use(errorLogger); // подключаем логгер ошибок
app.use(errors()); // обработчик ошибок celebrate
// мидлвара которая обрабатывает ошибки. нужно подключать в конце файла
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Сервер запущен');
});
