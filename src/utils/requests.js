const axios = require('axios');


const getRequest = async (url, params = {}) => {
    try {
        const response = await axios.get(url, { params })
        return response.data
    } catch (error) {
        console.error('Error making GET request:', error)
        throw error
    }
}

const postRequest = async (url, data) => {
    try {
        const response = await axios.post(url, data)
        return response.data
    } catch (error) {
        console.error('Error making POST request:', error)
        throw error
    }
}

module.exports = {
    getRequest,
    postRequest
}