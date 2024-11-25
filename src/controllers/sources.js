const AdmZip = require('adm-zip');
const ObjectId = require('mongoose').Types.ObjectId
const { traverseAndUpload } = require('../utils/zip')
const { fetchFileFromGridFS } = require('../utils/gridfs')
const gridFSManager  = require('../config/gridfs')
const SourceItem = require('../models/SourceItem');
const Project = require('../models/project');

const UploadSource = async (req, res) => {
    const project_id = req.body.project_id
    const zipFile = req.file
    if (!project_id) return res.status(400).json({ error: "Missing required fields" })
    if (!zipFile) return res.status(400).json({ error: "Missing zip file" })

    const existingProject = await Project.findById(project_id)
    if (!existingProject) return res.status(404).json({ error: "Project does not exist" })

    try {
        const zip = new AdmZip(req.file.buffer)
        const zipEntries = zip.getEntries()
        const uploadedFiles = await traverseAndUpload(zipEntries, project_id);
        res.status(200).send({ uploadedFiles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to process zip file' });
    }
}

const GetTreeItem = async (req, res) => {
    const project_id = req.params.project_id
    const parent_id = req.query.parent || null
    try {
        const mongoProjectId = new ObjectId(project_id)
        const mongoParentId = parent_id == null ? parent_id : new ObjectId(parent_id)
        const treeItems = await SourceItem.find({ project_id: mongoProjectId, parent_id: mongoParentId })
        return res.status(200).json(treeItems)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch tree items' });
    }
}

const getFileSource = async (req, res) => {
    try {
        const file_id = req.params.file_id;
        
        const bucket = gridFSManager.getSourceContentBucket();
        const fileContent = await fetchFileFromGridFS(file_id, bucket);
        return res.status(200).send(fileContent);
    } catch (error) {
        console.log(error);
        if (error.message === "File not found") {
            return res.status(404).json({ message: "File not found" });
        }
        return res.status(500).json({ message: "Failed to fetch file" });
    }
};


module.exports = {
    UploadSource: UploadSource,
    GetTreeItem: GetTreeItem,
    getFileSource: getFileSource
}