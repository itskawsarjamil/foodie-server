const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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


app.get("/services", async (req, res) => {
    try {
        const query = {};
        const options = { title: 1 };
        const result = await servicesCollection.find(query, options).toArray();
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

app.post("/addreview", async (req, res) => {
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

app.post("/addservice", async (req, res) => {
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

app.listen(port, () => {
    console.log(`server is running on port : ${port}`);
})