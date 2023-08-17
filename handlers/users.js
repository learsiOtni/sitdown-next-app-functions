const { db, admin } = require('../util/admin');
const firebaseConfig = require('../util/config');

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const userCollection ='users';


exports.login = async (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    // validation code goes here

    try {
        const firebaseUser = await signInWithEmailAndPassword(auth, user.email, user.password);
        const token = await firebaseUser.user.getIdToken();
        return res.status(200).json({ token });
    } catch(e) {
        return res.status(403).json({ general: 'Wrong credentials, please try again!'});
    }
}

exports.userInfo = async (req, res) => {
    const user = {
        firstname: req.body['firstname'],
        lastname: req.body['lastname'],
        areaNumber: req.body['areaNumber'],
        contactNumber: req.body['contactNumber']
    };

    try {
        const newDoc = await db.collection(userCollection).add(user);
        res.status(201).send(`successfuly created a new user: ${newDoc.id}`)
    } catch(e) {
        res.status(400).send(`unable to create user`);
    }
    
}

exports.getUser = async (req,res) => {
    try {
        const data = await db.collection(userCollection).get();
        const users = [];
        data.forEach( doc => {
            users.push({
                id: doc.id,
                data: doc.data()
            });
        })

        res.status(200).json(users);
    } catch(e) {
        res.status(500).send(e);
    }
}