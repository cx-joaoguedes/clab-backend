require('dotenv').config()
const { postRequest } = require('../utils/requests')
const AUTH_SERVICE_ENDPOINT = process.env.auth_service

const Login = async (req, res) => {
    const { username, password } = req.body;
    const create_token_endpoint = `${AUTH_SERVICE_ENDPOINT}/create`

    if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });

    const encodedCredentials = Buffer.from(JSON.stringify({ username, password })).toString('base64');

    const body = { data: encodedCredentials };

    try {
        const response = await postRequest(create_token_endpoint, body);
        const { token } = response;

        if (token) {
            res.cookie('sk_token', token, { httpOnly: true, secure: true });
            return res.json({ message: 'Authentication successful' });
        } else {
            return res.status(401).json({ message: 'Authentication failed' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

const ValidateToken = async (req, res) => {
    const user = req.user.data
    return res.status(200).json({ message: 'Token is valid', user });
}

module.exports = { Login, ValidateToken }