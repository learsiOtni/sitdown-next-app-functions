const functions = require('firebase-functions');
const express = require('express');
const app = express();

const FBAuth = require('./util/FBAuth');

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

const {
    getTags,
    getTag,
    createTag,
    //updateTag,
    //deleteTag,
} = require('./handlers/tags')

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
app.post('/updates', FBAuth, createUpdate);
app.post('/updates/:updateId', FBAuth, updateUpdate);
app.delete('/updates/:updateId', deleteUpdate);

// PROJECTS
app.get('/projects', getProjects);
app.get('/projects/:projectId', getProject);
app.post('/projects', createProject);
app.post('/projects/:projectId', updateProject);
app.delete('/projects/:projectId', deleteProject);

// TAGS
app.get('/tags', getTags);
app.get('/tags/:tagId', getTag);
app.post('/tags', createTag);

// define google cloud function name
exports.api = functions.https.onRequest(app);