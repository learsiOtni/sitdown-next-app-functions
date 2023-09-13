const functions = require('firebase-functions');
const express = require('express');
const app = express();

const FBAuth = require('./util/FBAuth');

const {
    login, 
    signup,
    googleLogin,
    getUsers, 
    getUser,
    updateProfile,
    uploadProfileImage
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
// Profile
app.post('/profile', FBAuth, updateProfile);
app.post('/profile/upload', FBAuth, uploadProfileImage);

// STATUS UPDATES
app.get('/updates', getUpdates);
app.get('/updates/:updateId', getUpdate);
app.post('/updates', FBAuth, createUpdate);
app.post('/updates/:updateId', FBAuth, updateUpdate);
app.delete('/updates/:updateId', FBAuth, deleteUpdate);

// PROJECTS
app.get('/projects', getProjects);
app.get('/projects/:projectId', getProject);
app.post('/projects', FBAuth, createProject);
app.post('/projects/:projectId', FBAuth, updateProject);
app.delete('/projects/:projectId', FBAuth, deleteProject);

// TAGS
app.get('/tags', getTags);
app.get('/tags/:tagId', getTag);
app.post('/tags', createTag);

// define google cloud function name
exports.api = functions.https.onRequest(app);


// ---- TODO: create notification functions
// - for adding project, notify all added members
// - for project author, notify all status updates