'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
require('dotenv').config()
var logger = require('morgan');

// file
const fs = require('fs');
const fetch = require('node-fetch');
const fileType = require('file-type');
const { Storage } = require('@google-cloud/storage');


const storage = new Storage();
const bucketName = 'line-storage';
const bucket = storage.bucket(bucketName)
fs.mkdir('./files', { recursive: true }, (err) => {
  if (err) throw err;
});

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();
app.use(logger('dev'));

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
    console.log(req.body)
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

async function uploadFile(filename) {
    // Uploads a local file to the bucket
    await bucket.upload(filename, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
        },
    });

    console.log(`${filename} uploaded.`);
}

// event handler
function handleEvent(event) {
    if (event.type === 'message' && event.message.type === 'text' && event.message.text === 'List') {
        console.log('event: list')
        return handleListEvent(event)
    } else if (event.type === 'message' && event.message.type === 'file') {
        console.log('event: upload')
        return handleUploadEvent(event)
    } else {
        // ignore non-file-message event
        console.log('non-file message')
        return Promise.resolve(null);
    }

}

function handleListEvent(event) {
    let echo = { type: 'text', text: '已備份檔案：\n' };

    return bucket.getFiles()
        .then((data) => {
            const files = data[0];
            files.forEach(file => {
                echo.text = echo.text.concat(file.name + '\n');
            });
            console.log(echo.text)
        }).catch(err => {
            console.error(err)
            echo.text = `取用失敗...${err}`
        }).finally(() => {
            // use reply API
            return client.replyMessage(event.replyToken, echo);
        });
}

function handleUploadEvent(event) {
    console.log(event.message)

    const { id, fileName } = event.message

    // create a echoing text message
    let echo = { type: 'text', text: ' ' };

    // download
    return fetch(`https://api-data.line.me/v2/bot/message/${id}/content`, {
        headers: {
            'Authorization': `Bearer ${config.channelAccessToken}`
        }
    }).then(res => {
        const dest = fs.createWriteStream(`./files/${fileName}`);
        res.body.pipe(dest);
    }).then(res => {
        const filename = `./files/${fileName}`;
        return uploadFile(filename)
    }).then(() => {
        echo.text = `${fileName}已備份至雲端 ${event.message.toString()}`
    }).catch(err => {
        console.error(err)
        echo.text = `備份至雲端失敗...${err}`
    }).finally(() => {
        // use reply API
        return client.replyMessage(event.replyToken, echo);
    });
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});

