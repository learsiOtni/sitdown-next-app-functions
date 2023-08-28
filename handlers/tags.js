const { db } = require('../util/admin');
const { tagsCollection } = require('../util/collections');

exports.getTags = async (req, res) => {

    try {
        const docs = await db.collection(tagsCollection).get();

        const tags = [];
        docs.forEach( doc => {
            tags.push( doc.id )
        })

        return res.status(200).json(tags);
    } catch(e) {
        return res.status(500).json({ error: e.code });
    }
}

exports.getTag = async (req, res) =>{

    try {
        const doc = await db.collection(tagsCollection).doc(req.params.tagId).get();
        if (!doc.exists) return res.status(404).json({ error: "Tag not found!"});

        // get all status updates within that tag
        return res.status(200).json({ ...doc.data(), id: doc.id })

    } catch(e) {
        return res.status(500).json({ error: e.code})
    }
    
}

exports.createTag = async (req, res) => {

    const tag = {
        createdAt: new Date().toISOString(),
        //updates: []
    }

    try {
        const doc = await db.collection(tagsCollection).doc(req.body['tag']).set(tag);


    } catch(e) {
        return res.status(500).json({ error: e.code})
    }
}

/* status updates can have many tags
tags can have many status updates

projects can have many status updates
status updates can have one project

users can have many status updates
status updates can have one user

projects can be made by one user
projects can be in multiple users
users can have many projects








*/