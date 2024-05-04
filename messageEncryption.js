const crypto = require('crypto');

// Encryption function
function encryptMessage(message, secretKey) {
    const cipher = crypto.createCipher('aes-256-cbc', secretKey);
    let encryptedMessage = cipher.update(message, 'utf8', 'hex');
    encryptedMessage += cipher.final('hex');
    return encryptedMessage;
}

// Decryption function
function decryptMessage(encryptedMessage, secretKey) {
    const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
    let decryptedMessage = decipher.update(encryptedMessage, 'hex', 'utf8');
    decryptedMessage += decipher.final('utf8');
    return decryptedMessage;
}

module.exports = { encryptMessage, decryptMessage };