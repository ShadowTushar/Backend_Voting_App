const express = require('express')
const app = express()
const db = require('./db')

require('dotenv').config()

const bodyParser = require('body-parser')
app.use(bodyParser.json()) //Stores in req.body

const userRoutes = require('./routes/userRoutes')
app.use('/user', userRoutes)

const candidateRoutes = require('./routes/candidateRoutes')
app.use('/candidate', candidateRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("Server Running on PORT 3000")
})