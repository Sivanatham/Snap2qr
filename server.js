const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const streamifier = require('streamifier');
const path = require('path');
const cors = require('cors');

// Initialize Express
const app = express();
const port = 5500;
app.use(express.static(path.join(__dirname, 'public')));


// Google OAuth2 configuration
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// Setup Google OAuth2 client
const Oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);
Oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Google Drive API client
const drive = google.drive({
    version: 'v3',
    auth: Oauth2Client
});

// Setup multer for file upload
const storage = multer.memoryStorage();  // Use memory storage to access the file buffer directly
const upload = multer({ storage: storage });

// Enable CORS
app.use(cors());

// Endpoint to serve the front-end HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to handle the image upload and send to Google Drive
app.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            console.log('No file uploaded');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Ensure the file is a PNG image
        if (file.mimetype !== 'image/png') {
            console.log('Invalid file type: ', file.mimetype);
            return res.status(400).json({ error: 'Only PNG files are allowed' });
        }

        // Create a readable stream from the buffer using streamifier
        const fileStream = streamifier.createReadStream(file.buffer);

        // Upload the file to Google Drive
        const response = await drive.files.create({
            requestBody: {
                name: 'captured_image.png',
                mimeType: 'image/png',
            },
            media: {
                mimeType: 'image/png',
                body: fileStream,
            },
        });

        const fileId = response.data.id;
        console.log('File uploaded successfully to Google Drive with file ID:', fileId);

        // Set permissions to make the file public
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Construct the public URL for the file
        const fileUrl = `https://drive.google.com/uc?id=${fileId}`;
        console.log('File URL:', fileUrl);

        // Return the image URL to the client
        res.json({ imageUrl: fileUrl });

    } catch (error) {
        console.error('Error uploading image:', error); // Log error details
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
