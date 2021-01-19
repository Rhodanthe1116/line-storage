[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/Rhodanthe1116/line-storage)

# Storage Bot

A bot who can backup files automatically.

## How to host your own bot?

### Install deps

``` shell
npm install
```
### Cloud Storage Credentials

Please see google cloud storage document.

### Configuration 

``` shell
// .env
CHANNEL_SECRET=YOUR_CHANNEL_SECRET
CHANNEL_ACCESS_TOKEN=YOUR_CHANNEL_ACCESS_TOKEN
PORT=1234 
GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json
GOOGLE_CREDENTIALS=RAW_JSON_CREDENTIALS
```

### Run

``` shell
npm run start
```

## Webhook URL

```
https://your.base.url/callback
```
