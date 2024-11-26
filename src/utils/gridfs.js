const fetchFileFromGridFS = async (searchQuery, bucket) => {
    try {
        const fileMetadata = await bucket.find(searchQuery).limit(1).toArray();
        if (fileMetadata.length === 0) {
            throw new Error("File not found");
        }

        const objectId = fileMetadata[0]._id;
        const downloadStream = bucket.openDownloadStream(objectId);

        const fileData = [];
        for await (const chunk of downloadStream) {
            fileData.push(chunk);
        }

        const fileBuffer = Buffer.concat(fileData);
        return fileBuffer;
    } catch (error) {
        console.error("Error fetching file from GridFS:", error);
        throw error;
    }
};

const uploadFileToGridFS = async (fileIndex, dataBuffer, metadata, bucket) => {
    try {
        const uploadStream = bucket.openUploadStream(fileIndex, { metadata });
        uploadStream.end(dataBuffer);
        return new Promise((resolve, reject) => {
            uploadStream.on('finish', () => resolve(uploadStream.id));
            uploadStream.on('error', (err) => reject(err));
        });
    } catch (error) {
        console.error('Error uploading file to GridFS:', error);
        throw error;
    }
};

const uploadStreamToGridFS = async (fileIndex, dataStream, metadata, bucket) => {
    try {
        const uploadStream = bucket.openUploadStream(fileIndex, { metadata });
        dataStream.pipe(uploadStream);
        return new Promise((resolve, reject) => {
            uploadStream.on('finish', () => resolve(uploadStream.id));
            uploadStream.on('error', (err) => reject(err));
        });
    } catch (error) {
        console.error('Error uploading file to GridFS:', error);
        throw error;
    }
}

module.exports = {
    fetchFileFromGridFS: fetchFileFromGridFS,
    uploadFileToGridFS: uploadFileToGridFS,
    uploadStreamToGridFS: uploadStreamToGridFS
}