const express = require('express')
const router = express.Router()

const User = require('../models/user')
const { jwtAuthMiddleware, generateToken } = require('../jwt')

router.post('/signup', async (req, res) => {
    try {
        const data = req.body

        //Check to verify there is only one Admin
        const adminExists = await User.findOne({ role: 'admin' })
        if (data.role === 'Admin' && adminExists) {
            return res.status(400).json({ message: 'Cannot have more than one Admin' })
        }

        //Check to verify Aadhar Number has exactly 12 Digits
        if (!/^\d{12}$/.test(data.aadharCardNumber)) {
            return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
        }

        //Check to verify whether Aadhar Number already exists
        const existingAadhaar = await User.findOne({ aadharCardNumber: data.aadharCardNumber })
        if (existingAadhaar) {
            return res.status(400).json({ error: 'User with the Same Aadhar Card Number already exists' })
        }

        const newUser = new User(data)
        const response = await newUser.save()
        console.log('Data saved Successfully')

        const payload = {
            id: response.id
        }

        console.log(JSON.stringify(payload))

        const token = generateToken(payload)
        console.log('Token: -', token)

        res.status(200).json({ response: response, token: token })
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ Error: 'Internal Server Error' })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { aadharCardNumber, password } = req.body
        const user = await User.findOne({ aadharCardNumber: aadharCardNumber })

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid Username or Password' })
        }

        const payload = {
            id: user.id,
        }

        const token = generateToken(payload)
        res.json({ token })
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    const userData = req.user
    console.log('User Data: - ', userData)

    const userId = userData.id
    const user = await User.findById(userId)
    try {
        res.status(200).json({ user })
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ Error: 'Internal Server Error' })
    }
})

router.put('/profile/password', async (req, res) => {
    try {
        const userID = req.id
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both Current and New Passwords are required' })
        }
        const user = await User.findById(userID)

        if (!user || !await (user.comparePassword(currentPassword))) {
            return res.status(401).json({ error: 'Invalid Username or Password' })
        }

        user.password = newPassword
        await user.save()

        console.log('Password Updated')
        res.status(200).json({ message: 'Password Changed' })
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

module.exports = router