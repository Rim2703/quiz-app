const quizModel = require('../models/quizModel')
const CronJob = require('cron').CronJob
const NodeCache = require('node-cache')

const cache = new NodeCache({ stdTTL: 60 * 60 }); // set cache expiry to 1 hour

const cacheMiddleware = (req, res, next) => {
    const key = req.originalUrl;
    const cachedData = cache.get(key)

    if (cachedData) {
        console.log('Returning data from cache...')
        return res.send(cachedData)
    }

    res.sendResponse = res.send;
    res.send = (body) => {
        cache.set(key, body)
        console.log('Caching data...')
        res.sendResponse(body)
    }

    next();
}


//____________________________create api______________________________

const createQuiz = async (req, res) => {
    try {
        let data = req.body
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please provide data in request body" })

        let addQuiz = await quizModel.create(data)
        return res.status(201).send({ status: true, data: addQuiz })

    }
    catch (err) {
        return res.status(500).send({ status: false, Error: err.message })
    }

}


//_________________________get api of active________________________________________

const getActiveQuiz = async (req, res) => {
    try {
        const quiz = await quizModel.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        })
        if (!quiz) {
            throw new Error('No active quiz found')
        }
        return res.status(200).send({ status: true, data: quiz })
    }
    catch (err) {
        return res.status(500).send({ status: false, Error: err.message })
    }
}


//___________________________________get result api______________________________

const getResult = async (req, res) => {
    try {
        const quiz = await quizModel.findById(req.params.id)
        if (!quiz) {
            res.status(404).send({ status: false, message: 'Quiz not found' })
        } else if (quiz.status !== 'finished') {
            res.status(400).send({ status: false, message: 'Quiz is not finished yet' })
        } else {
            res.status(200).send({ status: true, result: quiz.rightAnswer })
        }
    } catch (err) {
        return res.status(500).send({ status: false, Error: err.message })
    }
}


//____________________________get api for all data_______________________________

const getAllQuizData = async (req, res) => {
    try {
        const quizzes = await quizModel.find()
        res.status(200).send(quizzes)
    }
    catch (err) {
        return res.status(500).send({ status: false, Error: err.message })
    }
}


//____________time scheduler_________
const job = new CronJob('* * * * * *',
    async function () {
        // console.log('You will see this message every second')

        const now = new Date();

        // Find all quizzes that are either inactive or active
        const quizzes = await quizModel.find({ status: { $in: ['inactive', 'active'] } })

        // Loop through each quiz
        for (const quiz of quizzes) {

            // Check if the quiz is inactive and the start time has passed
            if (quiz.status === 'inactive' && quiz.startDate <= now) {
                quiz.status = 'active'
                await quiz.save()
            }
            // Check if the quiz is active and the end time has passed
            if (quiz.status === 'active' && quiz.endDate <= now) {
                quiz.status = 'finished'
                await quiz.save()
            }

        }
    },
    null,
    true,
    'America/Los_Angeles'
)
job.start()

module.exports = { createQuiz, getActiveQuiz, getResult, getAllQuizData, cacheMiddleware }