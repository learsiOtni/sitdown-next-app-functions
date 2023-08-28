const { db, FieldValue } = require('../util/admin');
const { tagsCollection, projectsCollection } = require('../util/collections');

exports.handleTag = async (tag, updateId) => {

    const tagRef = db.collection(tagsCollection).doc(tag);
    const tagDoc = await tagRef.get();

    if (tagDoc.exists) {
        tagRef.update({
            updates: FieldValue.arrayUnion(updateId)
        })
    } else {
        // create new tag collection;
        tagRef.set({
            createdAt: new Date().toISOString(),
            updates: [updateId]
        })
    }
}

exports.isArraysEqual = (array1, array2) => {

    if (array1.length !== array2.length) return false;

    // Check if each item in array1 appears in array2
    for (const item of array1) {
        if (!array2.includes(item)) return false;
    }

    return true;
}

exports.addUpdateToProject = async (updateId, projectId) => {
    // write to project collection - projectId must be passed from front end
    await db.collection(projectsCollection).doc(projectId).update({ 
        updates: FieldValue.arrayUnion(updateId)
    });
}

exports.deleteUpdateFromProject = async (updateId, projectId) => {

    await db.collection(projectsCollection).doc(projectId).update({
        updates: FieldValue.arrayRemove(updateId)
    });
}