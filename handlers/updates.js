const { db } = require('../util/admin');

const updatesCollection = 'updates';

exports.getUpdates = async (req, res) => {
    try {
        const docs = await db.collection(updatesCollection).orderBy('createdAt', 'desc').get();
        const updates = [];

        docs.forEach( doc => {
            updates.push({
                ...doc.data(), 
                id: doc.id
            })
        })

        res.status(200).json(updates);
    } catch(e) {
        res.status(500).json({ error: e.code})
    }

}


exports.getUpdate = async (req, res) => {

    try{
        const doc = await db.collection(updatesCollection).doc(req.params.updateId).get();

        if(!doc.exists) return res.status(404).json({ error: 'Status update not found!'});

        return res.status(200).json({ ...doc.data(), id: doc.id})
    } catch(e) {
        res.status(500).json({ error: e.code});
    }
}

exports.createUpdate = async (req, res) => {
    const newUpdate = {
        title: req.body['title'],
        body: req.body['body'],
        tags: req.body['tags'],
        createdAt: new Date().toISOString(),
        //userId: req.user.uid,
        // add project ID
    }

    try {
        const doc = await db.collection(updatesCollection).add(newUpdate);

        return res.status(200).json({ ...newUpdate, id: doc.id });
    } catch(e) {
        return res.status(500).json({ error: 'Something went wrong!'});
    }
}

exports.updateUpdate = async (req, res) => {

    const newUpdate = {
        title: req.body['title'],
        body: req.body['body'],
        tags: req.body['tags'],
    }

    const { updateId } = req.params;

    try {
        const doc = await db.collection(updatesCollection).doc(updateId).update(newUpdate);

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
        res.status(500).send({ error: e.code})
    }

}