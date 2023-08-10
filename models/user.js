const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Поле "email" должно быть заполнено'],
    unique: true, // поле в базе будет уникальным, если создавать такое же, то будет ошибка
    validate: {
      validator: (v) => validator.isEmail(v),
      message: 'Некорректный email',
    },
  },
  password: {
    type: String,
    select: false, // скрывается поле пароля из тела ответа, но в самой базе пароль остаётся
    required: [true, 'Поле "password" должно быть заполнено'],
  },
  name: {
    type: String,
    required: [true, 'Поле "name" должно быть заполнено'],
    minlength: [2, 'Минимальная длина поля "name" - 2'],
    maxlength: [30, 'Максимальная длина поля "name" - 30'],
  },
});

// юсер схеме добавляем метод скрытия пароля в теле ответа и вызывать когда нужно скрыть пароль
userSchema.methods.toJSON = function () { // toJson - наше название метода, его мы придумываем сами
  // this - это юзер который возвращается из базы, приводим его в js объект
  const user = this.toObject();
  // уlаkяем из этого объекта пароль
  delete user.password;
  // возвращаем юзера
  return user;
};

// создаём модель и экспортируем её
const User = mongoose.model('user', userSchema);

module.exports = User;
