const path = require('path');
const gridFSManager = require('../config/gridfs')
const { uploadFileToGridFS } = require('../utils/gridfs')
const Scan = require('../models/scan')
const Result = require('../models/result')
const ResultNode = require('../models/result_node')
const cxParsers = require('../utils/parsers/cx')
const snykParsers = require('../utils/parsers/snyk')
const crypto = require('crypto');
const ObjectId = require('mongoose').Types.ObjectId

const parserList = {
    cx: {
        json: cxParsers.parseCheckmarxJSON,
        sarif: cxParsers.parseCheckmarxSARIF
    },
    snyk: {
        json: snykParsers.parseSnykJSON,
        sarif: snykParsers.parseSnykSARIF
    }
}

const GetResults = async (req, res) => {
    const { project_id, scan_id } = req.params;
    let { page = 1, limit = 10 } = req.query;

    const mongoProjectId = new ObjectId(project_id);
    const mongoScanId = new ObjectId(scan_id);

    page = parseInt(page);
    limit = parseInt(limit);

    try {
        const results = await Result.find({ project_id: mongoProjectId, scan_id: mongoScanId })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalResults = await Result.countDocuments({ project_id: mongoProjectId, scan_id: mongoScanId });

        res.json({
            totalResults,
            totalPages: Math.ceil(totalResults / limit),
            currentPage: page,
            results
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        return res.status(500).send({ error: 'Failed to fetch results' });
    }
};

const UploadResults = async (req, res) => {
    try {
        const resultsFile = req.file;
        const fileType = path.extname(resultsFile.originalname).toLowerCase().split('.').slice(1)[0];
        const fileBuffer = resultsFile.buffer;
        const fileName = resultsFile.originalname
        const source = req.body.source || 'cx';
        const project_id = req.body.project_id

        if (!resultsFile || !project_id) return res.status(400).send({ error: 'scan file or project_id missing' })

        const owner = req.user.data.username

        const handleResponse = await handleResults(source, { fileType, fileBuffer, fileName }, project_id, owner);
        return res.status(200).send(handleResponse);
    } catch (error) {
        console.error('Error parsing results:', error);
        if (error.message.includes("No parser")) return res.status(404).send({ error: 'Parser not found' });
        return res.status(500).send({ error: 'Failed to process the results file.' });
    }
};

const uploadResultsAndNodes = async (resultData, scan_id, project_id) => {
    const resultsDocs = resultData.map(result => ({
        ...result,
        project_id: new ObjectId(project_id),
        scan_id,
        unique_id: generateUniqueId(result),
        node_count: result.nodes.length,
        group_id: null,
    }));
    const insertedResults = await Result.insertMany(resultsDocs);

    // Prepare nodes for bulk insertion
    const nodes = [];
    resultData.forEach((result, index) => {
        result.nodes.forEach((node) => {
            nodes.push({ ...node, result_id: insertedResults[index]._id });
        });
    });
    const insertedNodes = await ResultNode.insertMany(nodes);

    return { insertedResults, insertedNodes }
}

const generateUniqueId = (result) => {
    // Normalize and include every bit of data
    const normalizedResult = {
        query_name: result.original_query_name || '',
        severity: result.original_severity || '',
        node_count: (result.nodes || []).length, // Include the number of nodes
        nodes: (result.nodes || []).map((node) => ({
            file_name: node.file_name || '',
            start_line: node.start_line || 0,
            end_line: node.end_line || 0,
            start_column: node.start_column || 0,
            end_column: node.end_column || 0,
            node_name: node.node_name || '',
        })),
    };

    // Sort nodes to ensure consistent order for hashing
    normalizedResult.nodes.sort((a, b) => {
        if (a.file_name !== b.file_name) return a.file_name.localeCompare(b.file_name);
        if (a.start_line !== b.start_line) return a.start_line - b.start_line;
        if (a.start_column !== b.start_column) return a.start_column - b.start_column;
        if (a.end_line !== b.end_line) return a.end_line - b.end_line;
        return a.end_column - b.end_column;
    });

    // Serialize the entire normalized object deterministically
    const serializedData = JSON.stringify(normalizedResult);

    // Generate a SHA-256 hash of the serialized data
    return crypto.createHash('sha256').update(serializedData).digest('hex');
};

const handleResults = async (source, fileData, project_id, owner) => {
    try {
        const fileType = fileData.fileType

        // Selecting parser and parsing the results
        const parsers = parserList[source];
        if (!parsers) throw new Error(`No parsers found for source: ${source}`)
        const parser = parsers[fileType]
        if (!parser) throw new Error(`No parser found for extension: ${fileType}`)
        const parsedResults = await parser(fileData.fileBuffer);

        // Create new Scan
        const newScan = await new Scan({ project_id, source, type: fileType, owner })
        const uploadedScan = await newScan.save();
        const scanId = uploadedScan._id

        // Upload scan file to GridFS
        const bucket = gridFSManager.getScanFileContentBucket()
        const sourceFileMetadata = { project_id: new ObjectId(project_id), source, type: fileType, scan_id: scanId, owner }
        await uploadFileToGridFS(fileData.fileName, fileData.fileBuffer, sourceFileMetadata, bucket)

        const { insertedResults, insertedNodes } = await uploadResultsAndNodes(parsedResults, scanId, project_id)
        return { insertedResults: insertedResults.length, insertedNodes: insertedNodes.length }
    } catch (error) {
        console.error('Error handling results:', error);
        throw error;
    }
}

const GetResultNodes = async (req, res) => {
    try {
        const result_id = req.params.result_id
        const mongoResultId = new ObjectId(result_id)

        const nodes = await ResultNode.find({ result_id: mongoResultId })
        return res.status(200).json(nodes)
    } catch (error) {
        console.error('Error fetching result nodes:', error);
        return res.status(500).send({ error: 'Failed to fetch result nodes' });
    }
}

module.exports = { UploadResults, GetResults, GetResultNodes };
