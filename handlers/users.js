const { db, admin } = require('../util/admin');
const firebaseConfig = require('../util/config');

const { initializeApp } = require('firebase/app');

const { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} = require('firebase/auth');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const usersCollection ='users';


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
        return res.status(403).json({ error: 'Wrong credentials, please try again!'});
    }
}

exports.signup = async (req, res) => {
    const newUser = {
        email: req.body['email'],
        password: req.body['password'],
        confirmPassword: req.body['confirmPassword'],
        firstname: req.body['firstname'],
        surname: req.body['surname'],
    }

    try {
        // validation code goes here

        const firebaseUser = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
        
        const userId = firebaseUser.user.uid;
        const token = await firebaseUser.user.getIdToken();

        const newUserInfo = {
            firstname: newUser.firstname,
            surname: newUser.surname,
            email: newUser.email,
            createdAt: new Date().toISOString()
            // add default image?
        }

        await db.collection(usersCollection).doc(userId).set(newUserInfo);
        return res.status(201).json({ token })

    } catch(e) {

        if (e.code === 'auth/email-already-in-use') return res.status(400).json({ error: 'Email is already in use!'})
        return res.status(500).json({ error: e.code})
    }
}

exports.googleLogin = async (res, req) => {

    try{
        const result = await signInWithPopup(auth, googleProvider);

        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;

        // to be continued

    } catch(e) {
        res.status(500).json({ error: e.code})
    }
}

exports.getUsers = async (req, res) => {

    try {
        const docs = await db.collection(usersCollection).get();
        const users = [];

        docs.forEach( doc => {
            users.push({
                ...doc.data(),
                id: doc.id
            })
        })

        res.status(200).json(users)
    } catch(e) {
        res.status(500).json({ error: e.code});
    }
    
}

exports.getUser = async (req,res) => {
    try {
        const doc = await db.collection(usersCollection).doc(req.params.userId).get();

        // validation, check if user exists

        res.status(200).json({ ...doc.data(), id: doc.id });
    } catch(e) {
        res.status(500).json({ error: e.code});
    }
}