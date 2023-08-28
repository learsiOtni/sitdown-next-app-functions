const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth')

// initialize firebase in order to acces its services
const admin = initializeApp();

// initialize auth services;
const adminAuth = getAuth(admin);

// initialize database and the collection
const db = getFirestore();


module.exports = { admin, adminAuth, db, FieldValue }