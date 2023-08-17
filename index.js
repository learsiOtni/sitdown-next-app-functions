const functions = require('firebase-functions');

const express = require('express');
const app = express();

const {
    login, userInfo, getUser
} = require('./handlers/users');

const helloWorld = (req, res) => {
    res.send('Hello World')
}

app.post('/login', login);
app.get('/', helloWorld);
app.post('/users', userInfo );
app.get('/user', getUser);

// define google cloud function name
exports.api = functions.https.onRequest(app)

//exports.helloWorld = functions.https.onRequest((req, res) => {
//    res.send("Hello")
//})