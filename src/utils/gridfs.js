const ObjectId = require('mongoose').Types.ObjectId

const fetchFileFromGridFS = async (fileId, bucket) => {
    const objectId = new ObjectId(fileId);

    const fileMetadata = await bucket.find({ _id: objectId }).toArray();
    if (fileMetadata.length === 0) {
        throw new Error("File not found");
    }

    const downloadStream = bucket.openDownloadStream(objectId);
    const fileData = [];

    for await (const chunk of downloadStream) {
        fileData.push(chunk);
    }

    const fileBuffer = Buffer.concat(fileData);
    return fileBuffer;
};

module.exports = {
    fetchFileFromGridFS: fetchFileFromGridFS
}