const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');

const {
  getSaveMovies,
  createMovie,
  deleteMovie,
} = require('../controllers/movies');
// при обращении к get '/' и т.д выполнится getSaveMovies и т.д
router.get('/', getSaveMovies); // возвращает все сохранённые текущем пользователем фильмы
router.post('/', createMovie); // создаёт фильм с переданными в теле country, director, duration, year, description, image, trailer, nameRU, nameEN и thumbnail, movieId
router.delete('/:movieId', celebrate({
  params: Joi.object().keys({
    movieId: Joi.string().length(24).hex(),
  }),
}), deleteMovie); // удаляет сохранённый фильм по id

module.exports = router;
