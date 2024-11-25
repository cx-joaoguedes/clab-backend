const SourceItem = require('../models/SourceItem');
const gridFSManager = require('../config/gridfs')
const path = require('path')

const uploadFileToGridFS = async (entry) => {
    const entryData = entry.fileBuffer
    const entryPath = entry.path
    try {
        const bucket = await gridFSManager.getSourceContentBucket();
        const metadata = {
            project_id: entry.project_id,
            name: entry.item_name,
            type: entry.type
        }
        const uploadStream = bucket.openUploadStream(entryPath, { metadata });
        uploadStream.end(entryData);
        return new Promise((resolve, reject) => {
            uploadStream.on('finish', () => resolve(uploadStream.id));
            uploadStream.on('error', (err) => reject(err));
        });
    } catch (error) {
        console.error('Error uploading file to GridFS:', error);
        throw error;
    }
};


const normalizePath = (inputPath) => {
    return path
        .normalize(inputPath)
        .replace(/\\/g, '/')
        .replace(/\/+$/, '')
}

const processEntries = (entries, project_id) => {
    return entries.map((entry) => {
        const entryPath = normalizePath(entry.entryName);
        const parentPath = normalizePath(path.dirname(entryPath));
        const nameParts = entryPath.split('/').filter(Boolean);

        return {
            project_id,
            item_name: nameParts.pop(),
            path: entryPath,
            type: entry.isDirectory ? 'dir' : 'file',
            parent_id: null,
            parentPath: parentPath || '.',
            size: entry.header.size,
            extension: path.extname(entryPath) || 'no extension',
            content_id: null,
            nestingLevel: nameParts.length,
            fileBuffer: entry.getData()
        };
    });
};

const uploadTree = async (tree) => {
    let currentNestingLevel = 0;
    let uploadedItems = 0;
    const pathToIdMap = { '.': null };

    while (tree.length > 0) {
        const levelEntries = tree.filter(entry => entry.nestingLevel === currentNestingLevel);
        tree = tree.filter(entry => entry.nestingLevel > currentNestingLevel);

        if (levelEntries.length > 0) {
            const batch = await Promise.all(levelEntries.map(async (entry) => {
                let content_id = null;

                if (entry.type === 'file' && entry.fileBuffer) {
                    content_id = await uploadFileToGridFS(entry);
                }

                return {
                    project_id: entry.project_id,
                    item_name: entry.item_name,
                    path: entry.path,
                    type: entry.type,
                    parentPath: entry.parentPath,
                    size: entry.size,
                    extension: entry.extension,
                    parent_id: pathToIdMap[entry.parentPath] || null,
                    content_id: content_id
                };
            }));

            const uploadedBatch = await SourceItem.insertMany(batch);

            // Update pathToIdMap
            uploadedBatch.forEach((result, index) => {
                pathToIdMap[levelEntries[index]['path']] = result['_id'];
            });

            uploadedItems += uploadedBatch.length;
        }

        currentNestingLevel++;
    }

    return uploadedItems;
};


const traverseAndUpload = async (zipEntries, project_id) => {
    const treeEntries = await processEntries(zipEntries, project_id)
    const itemsToUpload = uploadTree(treeEntries)
    return itemsToUpload
}

module.exports = {
    traverseAndUpload: traverseAndUpload
};
