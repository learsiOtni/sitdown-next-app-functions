const { db, FieldValue } = require('../util/admin');
const { updatesCollection, usersCollection, projectsCollection, tagsCollection } = require('../util/collections');
const { handleTag, isArraysEqual, addUpdateToProject, deleteUpdateFromProject, deleteRecordInAllDocument, structureUpdate } = require('../util/helpers');


exports.getUpdates = async (req, res) => {
    try {
        const docs = await db.collection(updatesCollection).orderBy('createdAt', 'desc').get();
        
        const updates = [];
        const structuredUpdates = [];

        docs.forEach( doc => {
            updates.push({
                ...doc.data(),
                id: doc.id
            })
        })

        // fetch user and project info,
        for (const update of updates) {
            structuredUpdates.push( await structureUpdate(update) )
        }
        
        return res.status(200).json(structuredUpdates);
    
    } catch(e) {
        return res.status(500).json({ error: "Something went wrong!"})
    }

}


exports.getUpdate = async (req, res) => {

    try{
        const updateId = req.params.updateId;
        const update = await db.collection(updatesCollection).doc(updateId).get();
        if(!update.exists) return res.status(404).json({ error: 'Status update not found!'});

        // add user and project info
        const structuredUpdate = await structureUpdate({...update.data(), id: updateId});

        return res.status(200).json(structuredUpdate);
    } catch(e) {
        return res.status(500).json({ error: e.code});
    }
}

exports.createUpdate = async (req, res) => {
    const newUpdate = {
        title: req.body['title'],
        body: req.body['body'],
        tags: req.body['tags'],
        createdAt: new Date().toISOString(),
        userId: req.user.userId,
        projectId: req.body['projectId']
    }

    try {
        const update = await db.collection(updatesCollection).add(newUpdate);

        // write tags collection
        newUpdate.tags.forEach( tag => {
            handleTag(tag, update.id);
        })
        // handle project collection
        addUpdateToProject(update.id, newUpdate.projectId);

        //add updates to user
        await db.collection(usersCollection).doc(req.user.userId).update({
            updates: FieldValue.arrayUnion(update.id)
        });
        
        return res.status(200).json({ ...newUpdate, id: update.id });
    } catch(e) {
        return res.status(500).json({ error: 'Something went wrong!'});
    }
}

exports.updateUpdate = async (req, res) => {

    const newUpdate = {
        title: req.body['title'],
        body: req.body['body'],
        tags: req.body['tags'],
        projectId: req.body['projectId']
    }

    try {
        const { updateId } = req.params;
        const updateRef = db.collection(updatesCollection).doc(updateId);
        const update = await updateRef.get();

        if(!update.exists) return res.status(404).json({ error: 'Status update not found!'});

        // if logged in user is not same as the original update author, then give error (can allow admin users)
        if (update.data().userId !== req.user.userId) return res.status(403).json({ error: "Unauthorized update changes!" });

        // Write new changes to updates to DB
        const result = await updateRef.update(newUpdate);

        // ---- Handle TAG changes ----
        const newTags = req.body['tags'];
        const oldTags = update.data().tags;
        const unchangedTags = [];

        if(!isArraysEqual(newTags, oldTags)) { // if newTag and oldTag are not the same then make changes,
            
            // delete old tags record not present in new tags
            oldTags.forEach( oldTag => {
                const oldTagRef = db.collection(tagsCollection).doc(oldTag);

                if (!newTags.includes(oldTag)) oldTagRef.update({ 
                    updates: FieldValue.arrayRemove(updateId)
                });
                else unchangedTags.push(oldTag);
            });

            // create a new array for new tags to commit
            const tagsToCommit = newTags.filter(newTag => unchangedTags.indexOf(newTag) < 0); 

            tagsToCommit.forEach( tag => { // commit & write tags collection
                handleTag(tag, updateId)
            })
        }
        // ---- End of Handle TAG changes ----

        // ---- Handle projectId changes ----
        const projectId = req.body['projectId'];
        const oldProjectId = update.data().projectId;

        if(projectId !== oldProjectId) {
            deleteUpdateFromProject(updateId, oldProjectId);
            addUpdateToProject(updateId, projectId);
        }

        return res.status(201).json({ ...newUpdate, id: updateId })
    } catch(e){
        return res.status(500).json({ error: e.code})
    }
}

exports.deleteUpdate = async (req, res) => {

    try {
        const updateId = req.params.updateId;
        const updateRef = db.collection(updatesCollection).doc(updateId);
        // get update document
        const update = await updateRef.get();
        if (!update.exists) return res.status(404).json({ error: "Document not found!"});

        const { userId, tags, projectId } = update.data();
        if (req.user.userId !== userId) return res.status(403).json({ error: "Unauthorized Action!"});

        // remove update record in all tags it had
        const batch = deleteRecordInAllDocument(tags, tagsCollection, updatesCollection, updateId);

        // remove update record in its project document
        deleteUpdateFromProject(updateId, projectId);

        // remove from authors updates record
        const userRef = db.collection(usersCollection).doc(userId);
        batch.update(userRef, {
            updates: FieldValue.arrayRemove(updateId)
        });

        // delete actual document
        batch.delete(updateRef); 
        await batch.commit();
    
        return res.status(200).json({ message: "Status update successfully deleted!"})
    } catch(e) {
        return res.status(500).send({ error: e.code})
    }
}
    