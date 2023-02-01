const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
var jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}


app.get("/", (req, res) => {
    res.send("foodie server is running");
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.x8fgjzf.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function db() {
    try {
        await client.connect();
        console.log("database connected");
    }
    catch (e) {
        console.log(e);
    }

}

db().catch(e => { console.log(e) })

const servicesCollection = client.db("Foodie").collection("services");
const reviewsCollection = client.db("Foodie").collection("reviews");

app.post('/jwt', (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
    res.send({ token })
})

app.get("/services", async (req, res) => {
    try {
        const query = {};
        const options = { title: 1 };
        const cursor = servicesCollection.find(query, options);
        let result = [];
        const l = req.query.count;
        if (l === "3") {
            // console.log("found");
            result = await cursor.limit(3).toArray();
        }
        else {
            result = await cursor.toArray();
        }


        // console.log(result);
        res.send(result);
    }
    catch (e) {
        console.log(e);
        res.send({
            success: false,
            error: e.message,
        })
    }
})
app.get("/services/:id", async (req, res) => {
    try {
        // console.log(req.params.id);
        const id = req.params.id;
        const query = { service_id: id };

        const result = await servicesCollection.findOne(query);
        // console.log(result);
        res.send(result);
    }
    catch (e) {
        console.log(e);
        res.send({
            success: false,
            error: e.message,
        })
    }
})
app.get("/reviews/:id", async (req, res) => {
    try {
        const page = req.query.page;
        const id = req.params.id;
        const filter = { service_id: id };
        // console.log(filter);
        const options = { title: -1 };
        const cursor = reviewsCollection.find(filter, options);

        const result = await cursor.skip(page * 4).limit(4).toArray();

        const cursorforCount = reviewsCollection.find(filter, options);
        const a = await cursorforCount.toArray();
        const count = a.length;
        // console.log(a.length);
        res.send({ count, result });
    }
    catch (e) {
        console.log(e);
        res.send({
            success: false,
            error: e.message,
        })
    }
})

app.post("/addreview", verifyJWT, async (req, res) => {
    try {
        const data = req.body;
        const result = await reviewsCollection.insertOne(data);
        res.send(data);
    }
    catch (e) {
        console.log(e);
        res.send({
            success: false,
            error: e.message,
        })
    }
})

app.post("/addservice", verifyJWT, async (req, res) => {
    try {
        const data = req.body;
        const count = await servicesCollection.estimatedDocumentCount();
        const id = count + 1;
        const finalData = { service_id: id.toString(), ...data };
        console.log(finalData);
        const result = await servicesCollection.insertOne(finalData);
        console.log(result);
        res.send(result);
    }
    catch (e) {
        console.log(e);
        res.send({
            success: false,
            error: e.message,
        })
    }
})

app.get("/myreviews", verifyJWT, async (req, res) => {
    try {
        const decoded = req.decoded;
        // console.log(decoded.email, req.query.email);
        if (decoded.email !== req.query.email) {
            return res.status(403).send({ message: 'unauthorized access' });
        }
        const email = req.query.email;
        const page = req.query.page;
        const filter = { userEmail: email };
        // console.log(filter);
        const options = { title: 1 };
        const cursor = reviewsCollection.find(filter, options);
        const result = await cursor.skip(page * 4).limit(4).toArray();
        // console.log(result);
        const totalCount = await reviewsCollection.find(filter).toArray();
        const count = totalCount.length;
        res.send({ count, result });
    }
    catch (e) {
        console.log(e);
        res.send({
            success: false,
            error: e.message,
        })
    }

})

app.patch("/modifyreview", verifyJWT, async (req, res) => {
    try {
        const id = req.query.id;
        // console.log(id);
        const data = req.body;
        const find = { _id: ObjectId(id) };
        // console.log(data);
        const updatedDoc = {
            $set: {
                rating: data.rating,
                feedback: data.feedback
            }
        }
        const result = await reviewsCollection.updateOne(find, updatedDoc);
        res.send(result);
    }
    catch (e) {
        console.log(e);
        res.send({
            success: false,
            error: e.message,
        })
    }
})

app.delete("/myreviews/:id", verifyJWT, async (req, res) => {
    try {
        const id = req.params.id;
        const find = { _id: ObjectId(id) };
        const result = await reviewsCollection.deleteOne(find);
        res.send(result);
    }
    catch (e) {
        console.log(e);
        res.send({
            success: false,
            error: e.message,
        })
    }
})

app.listen(port, () => {
    console.log(`server is running on port : ${port}`);
})