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



app.listen(port, () => {
    console.log(`server is running on port : ${port}`);
})