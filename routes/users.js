const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
  getUserInfo,
  updateUser,
} = require('../controllers/users');
// при обращении к get '/me' и т.д выполнится getUserInfo и т.д
router.get('/me', getUserInfo); // возвращает информацию о текущем пользователе
router.patch('/me', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    name: Joi.string().required().min(2).max(30),
  }),
}), updateUser); // обновляет профиль

module.exports = router;
