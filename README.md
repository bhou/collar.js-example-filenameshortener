# File Name Shortener

A collarjs example application to shorten file name

## Screenshot

![screenshot](https://github.com/bhou/collar.js-example-filenameshortener/blob/master/filenameshortener-screenshot.png)

## Usage

1. change the range slider to setup the maximum file name length (default 128)
2. drag a single file or multiple files to the app to shorten their file name according to the maximum file name length

Note: the file extension will not be changed! 

## How it works?

see the following flow
![flow](https://github.com/bhou/collar.js-example-filenameshortener/blob/master/filenameshortener-flow.jpg)

To check the living flow:

Install collar dev server
```
sudo npm install collar-dev-server -g
```
Run the collar dev server
```
collar-dev-server
```
Enable collar dev tool
Edit `/app/js/app.js`, uncomment the first line:
```javascript
collar.enableDevtool();
```
Run the application by 
```
npm run start
```

Check collar dev server portal at [http://localhost:7500](http://localhost:7500)

## Installation
```
git clone https://github.com/bhou/collar.js-example-filenameshortener.git
```

```
npm install
```

## start the app
```
npm run start
```

## package it to native app
for macos
```
npm run package-macos
```
for windows
```
npm run package-win
```

