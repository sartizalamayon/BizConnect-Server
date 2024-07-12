const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.b6ckjyi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        await client.connect();
        const UserCollection = client.db("BizConnect").collection("users");

        app.get('/ai/:prompt', async (req, res) => {
            let prompt = req.params.prompt;
            prompt = "Act as a Interviewer. The candidate is applying for a job as a software engineer. He has 5 years of experience in the field. He is proficient in Java, Python, and C++, React, and Angular. Considering his experience and skills, What skills would you suggest he should learn next? Suggest Courses, Certifications, or Technologies that would be beneficial for him to learn next. Give the response in a JSON format.";
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
            const result = await model.generateContent(prompt);
            const response = await result.response;
            res.send(response.candidates[0].content.parts[0].text);
        });

        // Uncomment the following line if you want to close the connection after the server stops
        // await client.close();
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello BizConnect!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
