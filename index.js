const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path')
const multer = require('multer');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express();

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.wrzra5v.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




const storage = multer.diskStorage({
    destination: './upload',
    filename: (req, file, cb) => {
        return cb(null, `${file.originalname.split('.')[0]}_${((Math.random())).toString().split('.')[1]}${path.extname(file.originalname)}`)
    }
})

const upload = multer(
    {
        storage: storage
    }
)

function verifyJWT(req, res, next) {
 
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ status: 'unauthorized access' })
    }
    else {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN, function (e, decoded) {
            if (e) {
                return res.status(403).send({ status: 'Forbidden' })
            }
            req.decoded = decoded;
            next()
        })
    }
}


async function fun() {
    try {
        const submitCollections = client.db('FileUpload').collection('submitList');
        const adminCollections = client.db('FileUpload').collection('adminList');

        app.get('/',async (req, res) => {
            res.send('Server Running.')
        })
        app.post('/upload', upload.single('image'), async (req, res) => {
            const url = req?.file?.path;
            res.send({ path: url });
        })
        app.post('/insert', async (req, res) => {
            const data = req.body;
            const result = await submitCollections.insertOne(data);
            res.send(result);
        })
        app.get('/allcandidates', async (req, res) => {
            const query = {}
            const result = await submitCollections.find(query).toArray();
            res.send(result);
        })
        app.post('/login', async (req, res) => {
            const email = req.body.email
            const password = req.body.password
            const query = { email: email, password: password }
            const admin = await adminCollections.findOne(query);
            if (admin) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token, email: admin.email })
            }
            else {
                res.status(403).send({ accessToken: 'No token' })
            }
        })
        app.get('/verifyuser', verifyJWT, async (req, res) => {

            const email = req.decoded.email;
            const foundAdmin = await adminCollections.findOne({ email: email })
            if (foundAdmin) {
                res.send({ email: email })
            }
            else {
                res.status(403).send({ status: 'unauthorized access' })
            }
        })
        // app.use('/upload',express.static('upload'))
    }
    finally {

    }
}

fun().catch(error => console.log(error))





app.listen(port, () => {
    console.log('Port: ', port)
})