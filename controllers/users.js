const { NODE_ENV, JWT_SECRET } = process.env;
const bcrypt = require('bcryptjs'); // подключаем модуль для хэширования
const jwt = require('jsonwebtoken'); // импортируем модуль jsonwebtoken для создания токена
const User = require('../models/user');
const BadRequestError = require('../errors/bad-req-err'); // 400
const AuthError = require('../errors/auth-err'); // 401
const NotFoundError = require('../errors/not-found-err'); // 404
const ConflictError = require('../errors/conflict-err'); // 409

const CREATED = 201;
const OK = 200;

// req - запрос, который прислали. res - ответ
// создаёт пользователя
const createUser = (req, res, next) => {
  const {
    email,
    password,
    name,
  } = req.body;

  // делаем сам хэш и соль(подмешиваем какие-то свои значения в стандарный хэш)
  bcrypt.hash(String(password), 10)
    .then((hashedPassword) => {
      User.create({
        email,
        password: hashedPassword,
        name,
      })
        .then((user) => {
          res.status(CREATED).send({
            name: user.name,
            email: user.email,
            _id: user._id,
          });
        })
        .catch((err) => {
          if (err.name === 'ValidationError') {
            next(new BadRequestError('Переданы некорректные данные при создании пользователя'));
          } else if (err.code === 11000) {
            next(new ConflictError('Пользователь с таким email уже существует'));
          } else {
            next(err);
          }
        });
    });
};

// проверка логина и пароля и создание IWT
const login = (req, res, next) => {
  // вытаскиваем email и password
  const { email, password } = req.body;
  // ситуация если юзер передаёт пустые поля
  if (!email || !password) {
    throw new AuthError('Введены неправильные данные для входа');
  }
  // проверяем, существует ли пользователь с таким email
  User.findOne({ email })
    // отменяем скрытие пароля, котрое назначили в схеме
    .select('+password')
    // если не существует, то ошибка
    .orFail(() => next(new AuthError('Введены неправильные данные для входа')))
    .then((user) => {
      // проверяем, совпадает ли пароль
      bcrypt.compare(String(password), user.password)
        .then((isValidUser) => {
          if (isValidUser) {
            // создаётся JWT
            const token = jwt.sign(
              { _id: user._id },
              NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret', // секретный код
              // токен будет просрочен через неделю после создания);
              { expiresIn: '7d' },
            );
            // JWT прикрепляется к куке
            res.cookie('token', token, { // 1 параметрт просто название, второй параметр это то что мы туда кладём
              maxAge: 3600000 * 24 * 7, // срок хранения 7 дней
              httpOnly: true, // кука доступна только в http запросах,лучше делать по умолчанию
              sameSite: true, // куки я сндекса не будут например уходить в гугл
              secure: true,
            });
            // если совпадает, то возвращаем юзера
            res.send(user.toJSON());
          } else {
            // если не совпадает, возвращаем ошибку
            next(new AuthError('Введены неправильные данные для входа'));
          }
        });
    })
    .catch(next);
};

const signout = (req, res, next) => {
  try {
    res
      .status(OK)
      .clearCookie('token', {
        sameSite: 'none',
        secure: true,
      })
      .send({ message: 'Вы вышли из аккаунта' });
  } catch (err) {
    next(err);
  }
};

// возвращает информацию о текущем пользователе (email и имя)
const getUserInfo = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь по указанному _id не найден');
      }
      res.status(OK).send(user);
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};

// обновляет профиль (email и имя)
const updateUser = (req, res, next) => {
  const { email, name } = req.body;

  User.findByIdAndUpdate(req.user._id, { email, name }, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь с указанным _id не найден');
      }
      res.status(OK).send(user);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные при редактировании профиля'));
      } else if (err.code === 11000) {
        next(new ConflictError('Пользователь с таким email уже существует'));
      } else {
        next(err);
      }
    });
};

module.exports = {
  createUser,
  login,
  signout,
  getUserInfo,
  updateUser,
};
