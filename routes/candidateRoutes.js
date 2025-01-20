const express = require('express')
const router = express.Router()
const { jwtAuthMiddleware, generateToken } = require('./../jwt')
const Candidate = require('./../models/candidate')
const User = require('../models/user')

const checkAdmin = async (userID) => {
    try {
        const user = await User.findById(userID)
        return user.role === "admin"
    }
    catch (err) {
        return false
    }
}

router.post('/', jwtAuthMiddleware, async (req, res) => {

    try {
        if (!await checkAdmin(req.user.id)) {
            return res.status(403).json({ message: 'User has no Admin Role' })
        }
        const data = req.body
        const newCandidate = new Candidate(data)

        const response = await newCandidate.save()
        console.log('Data Saved')
        res.status(200).json({ response: response })
    }   
    catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

router.put('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!await checkAdmin(req.user.id)) {
            return res.status(403).json({ message: 'User has no Admin Role' })
        }
        const candidateId = req.params.candidateID
        const updatedCandidateData = req.body

        const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData, {
            new: true,
            runValidators: true,
        })

        if (!response) {
            res.status(404).json({ error: 'Candidate Not Found' })
        }

        console.log('Data Updated')
        res.status(200).json(response)
    }
    catch {
        console.log('Error Updating Data')
        res.status(500).json({ Error: 'Internal Server Error' })
    }
})

router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!await checkAdmin(req.user.id)) {
            return res.status(403).json({ message: 'User has no Admin Role' })
        }
        const candidateId = req.params.candidateID
        const response = await Candidate.findByIdAndDelete(candidateId)

        if (!response) {
            res.status(404).json({ error: 'Candidate Not Found' })
        }

        console.log('Data Deleted')
        res.status(200).json('Candidate Deleted Successfully')
    }
    catch {
        console.log('Error Deleting Data')
        res.status(500).json({ Error: 'Internal Server Error' })
    }
})

router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
    const candidateID = req.params.candidateID
    const userID = req.user.id

    try {
        const candidate = await Candidate.findById(candidateID)
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate Not Found' })
        }

        const user = await User.findById(userID)
        if (!user) {
            return res.status(404).json({ message: 'User Not Found' })
        }

        if (user.hasVoted) {
            return res.status(400).json({ message: 'You have already Voted' })
        }

        if (user.role === 'Admin') {
            return res.status(403).json({ message: 'Admin is not allowed to Vote' })
        }

        candidate.votes.push({ user: userID })
        candidate.voteCount++
        await candidate.save()

        user.hasVoted = true
        await user.save()

        return res.status(200).json({ message: 'Vote recorded Successfully' })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ Error: 'Internal Server Error' })
    }
})

router.get('/vote/count', async (req, res) => {
    try {
        const candidate = await Candidate.find().sort({ voteCount: 'desc' })

        const voteRecord = candidate.map((data) => {
            return {
                party: data.party,
                count: data.voteCount
            }
        })
        return res.status(200).json(voteRecord)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ Error: 'Internal Server Error' })
    }
})

router.get('/', async (req, res) => {
    try {
        // First Method
        // const candidate = await Candidate.find()
        // const record = candidate.map((data) => {
        //     return {
        //         name: data.name,
        //         party: data.party
        //     }
        // })

        // res.status(200).json(record)

        // Second Method
        const candidates = await Candidate.find({}, 'name party -_id');
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err)
        res.status(500).json({ Error: 'Internal Server Error' })
    }
})

module.exports = router