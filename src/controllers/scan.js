const Scan = require('../models/scan')
const ObjectId = require('mongoose').Types.ObjectId
const gridFSManager = require('../config/gridfs')
const { fetchFileFromGridFS } = require('../utils/gridfs')

const getScans = async (req, res) => {
    try {
        const project_id = req.params.project_id

        if (!project_id) return res.status(400).send({ error: 'project_id is missing' })

        const mongoProjectId = new ObjectId(project_id)
        const scans = await Scan.find({ project_id: mongoProjectId })

        return res.status(200).send(scans)
    } catch (error) {
        console.log(error)
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}

const getScanFileContent = async (req, res) => {
    try {
        const content_id = req.params.content_id

        const bucket = gridFSManager.getScanFileContentBucket();
        const fileContent = await fetchFileFromGridFS(content_id, bucket);
        return res.status(200).send(fileContent);
    } catch (error) {
        console.log(error);
        if (error.message === "File not found") {
            return res.status(404).json({ message: "File not found" });
        }
        return res.status(500).json({ message: "Failed to fetch file" });
    }
}

module.exports = {
    getScans: getScans,
    getScanFileContent: getScanFileContent
}