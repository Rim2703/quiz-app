const express = require('express')
const router = express.Router()
const quizController = require('../controllers/quizController')

router.post('/quizzes', quizController.createQuiz)
router.get('/quizzes/active', quizController.getActiveQuiz)
router.get('/quizzes/:id/result', quizController.getResult)
router.get('/quizzes/all', quizController.cacheMiddleware, quizController.getAllQuizData)

module.exports = router;
