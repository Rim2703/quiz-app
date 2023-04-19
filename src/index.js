const express = require('express')
const router = require('./routes/route')
const mongoose = require('mongoose')
const app = express()

app.use(express.json())

mongoose.connect("mongodb+srv://Rimsha:RimAtlas@cluster0.ij9mujl.mongodb.net/quiz-app", {
    useNewUrlParser: true
})
    .then(() => console.log("Mongodb is Connected"))
    .catch(err => console.log(err))

app.use('/', router)

app.listen(3000, () => {
    console.log("server is running")
})