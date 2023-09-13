const { db, bucket } = require('../util/admin');
const { projectsCollection, updatesCollection } = require('../util/collections');
const firebaseConfig = require('../util/config');
const { validateLogin, validateSignup } = require('../util/validators');

const { initializeApp } = require('firebase/app');
const Busboy = require('busboy');

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

    // validation
    const { errors, isValid }  = validateLogin(user);
    if(!isValid) return res.status(400).json(errors);

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
        lastname: req.body['lastname'],
    }

    // validation
    const { errors, isValid }  = validateSignup(newUser);
    if(!isValid) return res.status(400).json(errors);

    try {
        const firebaseUser = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
        
        const userId = firebaseUser.user.uid;
        const token = await firebaseUser.user.getIdToken();

        const newUserInfo = {
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            email: newUser.email,
            updates: [],
            projects: [],
            createdAt: new Date().toISOString(),
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
        const user = await db.collection(usersCollection).doc(req.params.userId).get();
        if(!user.exists) return res.status(404).json({ error: "User not found"});

         // Fetch its project
        const userProjects = user.data().projects;
        const projects = [];
        
        if (userProjects) {
            for(const project of userProjects) {
                const doc = await db.collection(projectsCollection).doc(project).get();
                projects.push({
                    ...doc.data(),
                    id: doc.id
                })
            }
        }

        // Fetch its status update
        // TODO: make this code reusable;
       const userUpdates = user.data().updates;
       const updates = [];

       if (userUpdates) {
            for(const update of userUpdates) {
                const doc = await db.collection(updatesCollection).doc(update).get();
                updates.push({
                    ...doc.data(),
                    id: doc.id
                })
            }
       }


        res.status(200).json({ ...user.data(), id: user.id, projects, updates });
    } catch(e) {
        res.status(500).json({ error: e.code});
    }
}

exports.updateProfile = async (req, res) => {

    const newDetails = {
        firstname: req.body['firstname'],
        lastname: req.body['lastname'],
        position: req.body['position']
    }

    try {
        await db.collection(usersCollection).doc(req.user.userId).update(newDetails);
        return res.status(200).json({ message: 'Details updated successfully!'});

    } catch(e) {
        return res.status(500).json({ error: e.code});
    }
}
  

exports.uploadProfileImage = async (req, res) => {

    const path = require('path');
    const fs = require('fs');
    const os = require('os');

    const busboy = Busboy({ headers: req.headers});
    let imageFileName = '';
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, stream, file) => {
        
        if(file.mimeType !== 'image/png' && file.mimeType !== 'image/jpeg') {
            return res.status(400).json({ error: 'JPG and PNG file format only!'});
        };

        const filenameArray = file.filename.split('.');
        const imageExt = filenameArray[filenameArray.length - 1];
        imageFileName = `${Math.round(Math.random() * 1000000000)}.${imageExt}`; // e.g. 973413248134.png

        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimeType: file.mimeType }
        stream.pipe(fs.createWriteStream(filepath));
    })

 
    
    busboy.on('finish', async () => {

        try {
            await bucket.upload(
                imageToBeUploaded.filepath, {
                    resumable: false,
                    metadata: {
                        metadata: { contentType: imageToBeUploaded.mimeType }
                    }
                }
            )
    
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
            await db.collection(usersCollection).doc(req.user.userId).update({ image: imageUrl });
            return res.json({ message: 'Image uploaded successfully!'})
        } catch(e) {
            return res.status(500).json({ error: 'Something went wrong!'});
        }
    });

    busboy.end(req.rawBody);
};