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


        //

        const StudentsCollection = client.db("BizConnect").collection("students");

         // GET - Retrieve all students
         app.get('/students', async (req, res) => {
          try {
              const students = await StudentCollection.find({}).toArray();
              res.status(200).json(students);
          } catch (error) {
              res.status(500).json({ message: 'Error retrieving students', error });
          }
      });

      // GET - Retrieve a single student by ID
      app.get('/students/:id', async (req, res) => {
          try {
              const id = new ObjectId(req.params.id);
              const student = await StudentCollection.findOne({ _id: id });
              if (student) {
                  res.status(200).json(student);
              } else {
                  res.status(404).json({ message: 'Student not found' });
              }
          } catch (error) {
              res.status(500).json({ message: 'Error retrieving student', error });
          }
      });

      // POST - Create a new student
      app.post('/students', async (req, res) => {
          try {
              const newStudent = req.body;
              const result = await StudentCollection.insertOne(newStudent);
              res.status(201).json(result.ops[0]);
          } catch (error) {
              res.status(500).json({ message: 'Error creating student', error });
          }
      });

      // PATCH - Update a student by ID
      app.patch('/students/:id', async (req, res) => {
          try {
              const id = new ObjectId(req.params.id);
              const updates = req.body;
              const result = await StudentCollection.updateOne({ _id: id }, { $set: updates });
              if (result.matchedCount > 0) {
                  res.status(200).json({ message: 'Student updated successfully' });
              } else {
                  res.status(404).json({ message: 'Student not found' });
              }
          } catch (error) {
              res.status(500).json({ message: 'Error updating student', error });
          }
      });

      // DELETE - Remove a student by ID
      app.delete('/students/:id', async (req, res) => {
          try {
              const id = new ObjectId(req.params.id);
              const result = await StudentCollection.deleteOne({ _id: id });
              if (result.deletedCount > 0) {
                  res.status(200).json({ message: 'Student deleted successfully' });
              } else {
                  res.status(404).json({ message: 'Student not found' });
              }
          } catch (error) {
              res.status(500).json({ message: 'Error deleting student', error });
          }
      });

        // AI Part - CourseSuggestions WILL
        app.get('/ai/:prompt', async (req, res) => {
            let prompt = req.params.prompt;
            prompt = "Act as a Interviewer. The candidate is applying for a job as a software engineer. He has 5 years of experience in the field. He is proficient in Java, Python, and C++, React, and Angular. Considering his experience and skills, What skills would you suggest he should learn next? Suggest Courses, Certifications, or Technologies that would be beneficial for him to learn next. Give the response in a JSON format.";
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
            const result = await model.generateContent(prompt);
            const response = await result.response;
            res.send(response.candidates[0].content.parts[0].text);
        });


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
