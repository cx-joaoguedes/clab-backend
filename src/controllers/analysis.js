const Analysis = require('../models/analysis');

const CreateAnalysis = async (req, res) => {
    try {
        const { result_unique_id, state, comment } = req.body
        const user = req.user.data
        const owner = user.username

        const newAnalysis = new Analysis({ result_unique_id, state, comment, owner })
        const createdAnalysis = await newAnalysis.save()

        return res.status(201).json(createdAnalysis)
    } catch (error) {
        console.error("Error creating analysis:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

const GetAnalysis = async (req, res) => {
    try {
        const result_unique_id = req.params.result_unique_id
        const analysis = await Analysis.find({ result_unique_id }).sort({ created_at: -1 }) // Fetching by unique_id and sorting by date
        return res.status(200).json(analysis)
    } catch (error) {
        console.error("Error fetching analysis:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    CreateAnalysis,
    GetAnalysis
}