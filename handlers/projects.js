const { db, admin, FieldValue } = require('../util/admin');
const { projectsCollection, usersCollection, updatesCollection } = require('../util/collections');
const { handleTeamMembers, isArraysEqual, deleteRecordInAllDocument } = require('../util/helpers');

exports.getProjects = async (req, res) => {
    try {
        const docs = await db.collection(projectsCollection).orderBy('createdAt', 'desc').get();

        const projects = [];
        docs.forEach(doc => {
            projects.push({
                ...doc.data(),
                id: doc.id
            })
        });
        
        const structuredProjects = [];
        // fetch user info
        for (const project of projects) {
            const { id, body, createdAt, teamMembers, title, userId, updates } = project;

            const user = await db.collection(usersCollection).doc(userId).get();
            const { firstname } = user.data();

            structuredProjects.push({
                id,
                body,
                createdAt,
                teamMembers,
                title,
                user: {
                    id: userId,
                    firstname
                },
                updates
            });
        }

        return res.status(200).json(structuredProjects);

    } catch (e) {
        return res.status(500).json({ error: e.code })
    }
}

exports.getProject = async (req, res) => {

    try {
        const projectId = req.params.projectId;

        const project = await db.collection(projectsCollection).doc(projectId).get();
        if (!project.exists) return res.status(404).json({ error: "Project not found!" });

        // add user and get all status associated with this project
        const { body, createdAt, teamMembers, title, userId } = project.data();
        
        // project author
        const user = await db.collection(usersCollection).doc(userId).get();
        const { firstname } = user.data();
        
        const updatesDoc = await db.collection(updatesCollection)
            .where('projectId', '==', projectId)
            //.orderBy('createdAt', 'desc')
            .get();

            
        if (updatesDoc.empty) return res.status(404).json({ error: "No matching document!"})

        const updates = [];
        updatesDoc.forEach( update => {
            updates.push({
                id: update.id,
                ...update.data()
            })
        })

        //updates
        const structuredUpdates = []
        for (const update of updates) {
            const { id, createdAt, title, body, tags, userId, projectId } = update;
            
            //update author
            const user = await db.collection(usersCollection).doc(userId).get();
            const { firstname } = user.data();

            structuredUpdates.push({
                id,
                createdAt,
                title,
                body,
                tags,
                projectId,
                user: {
                    id: user.id,
                    firstname
                }
            })
        }

        const structuredProject = {
            id: projectId,
            body,
            createdAt,
            teamMembers,
            title,
            updates: structuredUpdates,
            user: {
                id: userId,
                firstname
            }
        };

        return res.status(200).json(structuredProject)
    } catch (e) {
        return res.status(500).json({ error: e.code })
    }

}

exports.createProject = async (req, res) => {

    const userId = req.user.userId;

    const newProject = {
        title: req.body['title'],
        body: req.body['body'],
        userId,
        createdAt: new Date().toISOString(),
        teamMembers: req.body['teamMembers'], // array fof userIds
        updates: []
    }

    try {
        const project = await db.collection(projectsCollection).add(newProject);

        // write to team members' users collection
        newProject.teamMembers.forEach( userId => {
            handleTeamMembers(userId, project.id)
        })

        // write to authors' users collection, way to check project author is by its user id
        await db.collection(usersCollection).doc(userId).update({
            projects: FieldValue.arrayUnion(project.id)
        })

        return res.json({ ...newProject, id: project.id })
    } catch (e) {
        return res.status(500).json({ error: e.code })
    }

}

exports.updateProject = async (req, res) => {

    const newProject = {
        title: req.body['title'],
        body: req.body['body'],
        teamMembers: req.body['teamMembers'],
    }

    try {
        const projectId = req.params.projectId;
        const projectRef = db.collection(projectsCollection).doc(projectId);
        const project = await projectRef.get();

        if(!project.exists) return res.status(404).json({ error: 'Project not found!'});
        if(project.data().userId !== req.user.userId) return res.status(403).json({ error: 'Unauthorized project change!'});

        const result = await projectRef.update(newProject);

        // Handle team members change
        const newMembers = req.body['teamMembers'];
        const oldMembers = project.data().teamMembers;
        const unchangedMembers = [];

        if(!isArraysEqual(newMembers, oldMembers)) {
            
            oldMembers.forEach( userId => {
                const oldMemberRef = db.collection(usersCollection).doc(userId);

                if(!newMembers.includes(oldMembers)) oldMemberRef.update({ 
                    projects: FieldValue.arrayRemove(projectId)
                })
                else unchangedMembers.push(userId);
            });

            const membersToCommit = newMembers.filter( newMember => unchangedMembers.indexOf(newMember) < 0);

            membersToCommit.forEach( userId => {
                handleTeamMembers(userId, projectId)
            });
        }

        return res.status(201).json({ ...newProject, id: projectId })
    } catch (e) {
        return res.status(500).json({ error: e.code })
    }

}

exports.deleteProject = async (req, res) => {

    try {
        const projectId = req.params.projectId;
        const projectRef = db.collection(projectsCollection).doc(projectId);

        const project = await projectRef.get();
        if (!project.exists) return res.status(404).json({ error: "Document not found!"});

        const { userId, teamMembers } = project.data();
        if (req.user.userId !== userId) return res.status(403).json({ error: "Unauthorized Action!"});

        // remove project record in all members
        const allMembers = [...teamMembers, userId] //add project author for batch deletion
        const batch = deleteRecordInAllDocument(allMembers, usersCollection, projectsCollection, projectId);
        

        // need to delete all the updates associated with the project
        // but then would need to delete all the infos associated with
        // all that status update

        // solution: leave the updates as it is, and just make a project check
        // if not found, say, unavailable project, but can still access,
        
        batch.delete(projectRef);
        await batch.commit();

        return res.status(200).json({ message: "Project successfully deleted!" })

    } catch (e) {
        return res.status(500).json({ error: e.code })
    }

}