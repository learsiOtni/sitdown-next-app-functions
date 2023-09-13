const { db, FieldValue } = require('../util/admin');
const { tagsCollection, projectsCollection, usersCollection } = require('../util/collections');

exports.structureUpdate = async (update) => {
    // TODO: if one field is missing, it returns error, FIX IN FUTURE
    const { id, createdAt, title, body, tags, userId, projectId } = update;
    
    const user = await db.collection(usersCollection).doc(userId).get();
    const project = await db.collection(projectsCollection).doc(projectId).get();

    const { firstname } = user.data();
    const projectTitle = project.exists ? project.data().title : "Project not Found!";

    return {
        id,
        createdAt,
        title,
        body,
        tags,
        user: {
            id: userId,
            firstname
        },
        project: {
            id: project.exists ? projectId : "none",
            title: projectTitle,
        }
    }
}

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

exports.handleTeamMembers = async (userId, projectId) => {
    const userRef = db.collection(usersCollection).doc(userId);
    const user = await userRef.get();

    if(user.exists) {
        userRef.update({
            projects: FieldValue.arrayUnion(projectId)
        })
    } else {
        userRef.set({
            projects: [projectId]
        })
    }
}

exports.isArraysEqual = (newArray, oldArray) => {

    if (newArray.length !== oldArray.length) return false;

    // Check if each item in newArray appears in oldArray
    for (const item of newArray) {
        if (!oldArray.includes(item)) return false;
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

// For example params: tagsArray, tagsCollection, updates, updateId
// go through each tag in tags, go to the document key updates and delete the field containing the updateId
exports.deleteRecordInAllDocument = (array, collectionName, fieldKey, documentId) => {

    const batch = db.batch();
    array.forEach( item => {
        const ref = db.collection(collectionName).doc(item);
        batch.update( ref, {
            [fieldKey]: FieldValue.arrayRemove(documentId)
        })
    })
    
    return batch;
};