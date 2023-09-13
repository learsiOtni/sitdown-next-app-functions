const { db, adminAuth } = require('./admin');
const { usersCollection } = require("./collections");

// Middleware - decodes the sent Authorization token, and send back decoded user
module.exports = async (req, res, next) => {

    let idToken; // this comes from the client app sent through headers

    const { authorization } = req.headers;

    if (authorization && authorization.startsWith('Bearer')) {
        idToken = authorization.split('Bearer ')[1];
    } else {
        return res.status(403).json({ error: "Unauthorized Access!"});
    }

    try { 
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const user = await db.collection(usersCollection).doc(userId).get();
        if (!user.exists) return res.status(404).json({ error: "Cannot find user!"});

        req.user = {
            userId,
            ...user.data()
        }

        return next();

    } catch(e) {
        return res.status(403).json({ error: "Unauthorized Command!"})
    }
}