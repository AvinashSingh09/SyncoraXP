const express = require('express');
const router = express.Router();
const Config = require('../models/config.model');

router.get('/bulk/keys', async (req, res, next) => {
    try {
        const { keys } = req.query;
        if (!keys) {
            return res.status(200).json({ success: true, configs: {} });
        }
        const keyList = keys.split(',');
        const configs = await Config.find({ key: { $in: keyList } });
        
        const result = {};
        keyList.forEach(k => {
            const found = configs.find(c => c.key === k);
            result[k] = found ? found.value : null;
        });

        res.status(200).json({
            success: true,
            configs: result
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:key', async (req, res, next) => {
    try {
        const { key } = req.params;
        const config = await Config.findOne({ key });
        res.status(200).json({
            success: true,
            value: config ? config.value : null
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { key, value } = req.body;
        const config = await Config.findOneAndUpdate(
            { key },
            { value },
            { new: true, upsert: true }
        );
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        next(error);
    }
});

const fs = require('fs');
const path = require('path');

router.post('/upload', async (req, res, next) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ success: false, message: 'No image data provided' });
        }

        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ success: false, message: 'Invalid base64 image data' });
        }

        const ext = matches[1].split('/')[1] || 'png';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `bg_${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, filename);

        fs.writeFileSync(filePath, buffer);

        res.status(200).json({
            success: true,
            url: `http://localhost:5000/uploads/${filename}`
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
