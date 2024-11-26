const AdmZip = require('adm-zip');
const ObjectId = require('mongoose').Types.ObjectId
const { traverseAndUpload } = require('../utils/zip')
const { fetchFileFromGridFS } = require('../utils/gridfs')
const gridFSManager = require('../config/gridfs')
const SourceItem = require('../models/SourceItem');
const Project = require('../models/project');

const UploadSource = async (req, res) => {
    const project_id = req.body.project_id;
    const zipFile = req.file;

    if (!project_id) return res.status(400).json({ error: "Missing required fields" });
    if (!zipFile) return res.status(400).json({ error: "Missing zip file" });

    const existingProject = await Project.findById(project_id);
    if (!existingProject) return res.status(404).json({ error: "Project does not exist" });

    if (existingProject.upload_state !== 'pending') return res.status(409).json({ error: "Source already uploaded or uploading" });

    try {
        const io = req.app.get('io');
        const zip = new AdmZip(req.file.buffer);

        // Generate a unique WebSocket room for this upload
        const socketRoom = `upload-progress-${project_id}`;

        // Notify the client to connect to the WebSocket room
        res.status(202).json({
            message: 'Upload process has started. Connect to WebSocket for progress updates.',
            socketRoom,
        });

        // Start the asynchronous upload process
        traverseAndUpload(zip, project_id, io, socketRoom, existingProject)
    } catch (error) {
        console.error('Controller error:', error);
        return res.status(500).json({ message: 'Failed to process zip file' });
    }
};


const GetTreeItem = async (req, res) => {
    const project_id = req.params.project_id
    const parent = req.query.parent || null
    try {
        const mongoProjectId = new ObjectId(project_id)
        const treeItems = await SourceItem.find({ project_id: mongoProjectId, parent })
        return res.status(200).json(treeItems)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch tree items' });
    }
}

const getFileSource = async (req, res) => {
    try {
        const project_id = req.params.project_id
        const filePath = req.query.filePath
        if (!project_id || !filePath) return res.status(400).json({ message: "Missing required parameters" })

        const bucket = gridFSManager.getSourceContentBucket();
        const searchQuery = { filename: filePath, 'metadata.project_id': new ObjectId(project_id) }
        const fileContent = await fetchFileFromGridFS(searchQuery, bucket)
        return res.status(200).send(fileContent);
    } catch (error) {
        console.log(error);
        if (error.message === "File not found") {
            return res.status(404).json({ message: "File not found" })
        }
        return res.status(500).json({ message: "Failed to fetch file" })
    }
};


module.exports = {
    UploadSource: UploadSource,
    GetTreeItem: GetTreeItem,
    getFileSource: getFileSource
}