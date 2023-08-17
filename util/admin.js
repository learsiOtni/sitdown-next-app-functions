const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// initialize firebase in order to acces its services
const admin = initializeApp();

// initialize database and the collection
const db = getFirestore();

module.exports = { admin, db, FieldValue }