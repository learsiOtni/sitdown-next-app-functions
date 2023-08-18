const functions = require('firebase-functions');

const express = require('express');
const app = express();

const {
    login, 
    signup,
    googleLogin,
    getUsers, 
    getUser
} = require('./handlers/users');

const { 
    getUpdates,
    getUpdate,
    createUpdate,
    updateUpdate,
    deleteUpdate
} = require('./handlers/updates')

const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
} = require('./handlers/projects')

// ----- ROUTES ----- //
// LOGIN
app.post('/login', login);
app.post('/signup', signup);
app.post('/googleLogin', googleLogin);
// Users
app.get('/users', getUsers );
app.get('/users/:userId', getUser);

// STATUS UPDATES
app.get('/updates', getUpdates);
app.get('/updates/:updateId', getUpdate);
app.post('/updates', createUpdate);
app.post('/updates/:updateId', updateUpdate);
app.delete('/updates/:updateId', deleteUpdate);

// PROJECTS
app.get('/projects', getProjects);
app.get('/projects/:projectId', getProject);
app.post('/projects', createProject);
app.post('/projects/:projectId', updateProject);
app.delete('/projects/:projectId', deleteProject);

// define google cloud function name
exports.api = functions.https.onRequest(app);