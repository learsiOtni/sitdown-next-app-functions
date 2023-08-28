const { db, FieldValue } = require('../util/admin');
const { updatesCollection, usersCollection, projectsCollection, tagsCollection } = require('../util/collections');
const { handleTag, isArraysEqual, addUpdateToProject, deleteUpdateFromProject } = require('../util/helpers');


exports.getUpdates = async (req, res) => {
    try {
        const docs = await db.collection(updatesCollection).orderBy('createdAt', 'desc').get();
        
        const updates = [];
        const structuredUpdates = [];

        docs.forEach( async doc => {
            updates.push({
                id: doc.id,
                ...doc.data()
            })
        })

        // fetch user and project info,
        for (const update of updates) {
            const { id, createdAt, title, body, tags, userId, projectId } = update;

            const user = await db.collection(usersCollection).doc(userId).get();
            const project = await db.collection(projectsCollection).doc(projectId).get();

            const { firstname } = user.data();
            const projectTitle = project.data().title;

            // if one field is missing, it returns error, FIX IN FUTURE
            structuredUpdates.push({
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
                    id: projectId,
                    title: projectTitle,
                }
            })
        }
        
        return res.status(200).json(structuredUpdates);
    
    } catch(e) {
        return res.status(500).json({ error: "Something went wrong!"})
    }

}


exports.getUpdate = async (req, res) => {

    try{
        const update = await db.collection(updatesCollection).doc(req.params.updateId).get();

        if(!update.exists) return res.status(404).json({ error: 'Status update not found!'});

        return res.status(200).json({ ...update.data(), id: update.id})
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

                if (!newTags.includes(oldTag)) oldTagRef.update({ updates: FieldValue.arrayRemove(updateId)});
                else unchangedTags.push(oldTag);
            });

            // create a new array for new tags to commit
            const tagsToCommit = newTags.filter(newTag => unchangedTags.indexOf(newTag) < 0); 

            tagsToCommit.forEach( tag => { // commit & write tags collection
                handleTag(tag, updateId)
            })
        }
        // ---- End of Handle TAG changes ----
        console.log('here');

        // ---- Handle projectId changes ----
        const projectId = req.body['projectId'];
        
        const oldProjectId = update.data().projectId;
        console.log(projectId, oldProjectId)

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
        // need to check if document is ready to delete
        await db.collection(updatesCollection).doc(req.params.updateId).delete();
    
        return res.status(200).json({ message: "Status update successfully deleted!"})
    } catch(e) {
        return res.status(500).send({ error: e.code})
    }

}