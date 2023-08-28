const { db, admin } = require('../util/admin');
const { projectsCollection } = require('../util/collections');

exports.getProjects = async (req, res) => {

    try {
        const docs = await db.collection(projectsCollection).orderBy('createdAt', 'desc').get();
        
        const projects = [];
        docs.forEach( doc => {
            projects.push({
                ...doc.data(),
                id: doc.id
            })
        });
        return res.status(200).json(projects);

    } catch(e) {
        return res.status(500).json({ error: e.code })
    }

}

exports.getProject = async (req, res) => {

    try {
        const doc = db.collection(projectsCollection).doc(req.params.projectId).get();
        if(!doc.exist) return res.status(404).json({ error: "Project not found!"});
        
        return res.status(200).json({...doc.data(), id: doc.id})


    } catch(e) {
        return res.status(500).json({ error: e.code })
    }
    
}

exports.createProject = async (req, res) => {

    const newProject = {
        //id: req.body['id'],
        title: req.body['title'],
        body: req.body['body'],
        //user: { id, name } who created it?
        createdAt: new Date().toISOString(),
        teamMembers: req.body['teamMembers'],
    }

    try {
        const doc = await db.collection(projectsCollection).add(newProject);

        return res.json({ ...newProject, id: doc.id})

    } catch(e) {
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
        const { projectId } = req.params;

        const result = await db.collection(projectsCollection).doc(projectId).update(newProject);

        // check if result was succesful

        return res.status(201).json({ ...newProject, id: projectId})

    } catch(e) {
        return res.status(500).json({ error: e.code })
    }
    
}

exports.deleteProject = async (req, res) => {

    try {
        // need to check if document is ready to delete
        await db.collection(projectsCollection).doc(req.params.projectId).delete();
    
        return res.status(200).json({ message: "Project successfully deleted!"})

    } catch(e) {
        return res.status(500).json({ error: e.code })
    }
    
}