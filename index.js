const express = require("express");
const cors = require("cors");
// const multer = require("multer");
// const path = require("path");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: ["http://localhost:5174", "http://localhost:5173",'http://localhost:5175'],
    credentials: true,
  })
);
app.use(express.json());
// app.use(express.static("uploads")); // Serve uploaded files from this directory

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.b6ckjyi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Set up multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}_${file.originalname}`);
//   },
// });
// const upload = multer({ storage });

async function run() {
  try {
    await client.connect();

    //
    // Users Collection
    //
    const UsersCollection = client.db("BizConnect").collection("users");
    app.get('/users', async(req, res) => {
      const users = await UsersCollection.find({}).toArray();
      res.status(200).json(users);
    })

    app.post("/users", async (req, res) => {
      try {
        const newUser = req.body;
        const result = await UsersCollection.insertOne(newUser);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error creating user", error });
      }
    }
    );

    app.patch("/users/:email", async (req, res) => {
      console.log(req.params.email)
      try {
        const { email } = req.params;
        const updates = req.body;
        const result = await UsersCollection.updateOne(
          { email },
          { $set: updates }
        );
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "User updated successfully" });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error updating user", error });
      }
    }
    );
    


    //new:::check
    app.get("/users/role/:email", async(req, res)=>{
      const { email } = req.params;
      try {
        const user = await UsersCollection.find({email}).toArray();
        res.status(200).send(user[0].role);
      } catch (error) {
        res.status(500).json({ message: "Error retrieving role", error });
      }
    });

    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = await UsersCollection.findOne({ email: email });
      res.json(user);
  });

    //new:::check
    app.get("/data/:role/:email", async(req, res)=>{
      const {role} = req.params
      const {email} = req.params
      console.log(role, email)
      if(role && email){
        if(role === "entrepreneur"){
          const userData = await EntrepreneursCollection.findOne({email});
          console.log(userData)
          res.status(200).json(userData);
        }
        if(role === "investor"){
          const userData = await InvestorsCollection.findOne({email});
          res.status(200).json(userData);
        }
        if(role === "student"){
          const userData = await StudentsCollection.findOne({email});
          res.status(200).json(userData);
        }
      }else{
        res.status(400).json({message: "Invalid Request"})
      }
    })



    //
    // Notification Collection
    //
    // from, to, date, type,
    const NotificationCollection = client.db("BizConnect").collection("notifications");


    //
    // Entrepreneurs Collection
    //
    const EntrepreneursCollection = client.db("BizConnect").collection("entrepreneurs");
    app.post("/entrepreneurs", async (req, res) => {
      try {
        const newEntrepreneur = req.body;
        const result = await EntrepreneursCollection.insertOne(newEntrepreneur);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error creating entrepreneur", error });
      }
    }
    );

    app.get("/entrepreneurs/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const entrepreneur = await EntrepreneursCollection.findOne({ email });
        if (entrepreneur) {
          res.status(200).json(entrepreneur);
        } else {
          res.status(404).json({ message: "Student not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error retrieving student", error });
      }
    });


    //
    // Entrepreneurstartups Collection
    //
    const EntrepreneurStartupsCollection = client.db("BizConnect").collection("entrepreneurstartups");

    app.get('/entrepreneurs', async(req, res)=>{
      const entrepreneurs = await EntrepreneursCollection.find({open_for_partnership:true}).toArray()
      res.status(200).json(entrepreneurs)
    })

    app.get('/entrepreneur-startups/funding', async(req, res)=>{
      const startups = await EntrepreneurStartupsCollection.find({open_for_fund_raising:true}).toArray()
      res.status(200).json(startups)
    })

    // In your Express app

app.get('/partners', async (req, res) => {
  try {
    const users = await UsersCollection.find({}).toArray();
    const entrepreneurs = await EntrepreneursCollection.find({ open_for_partnership: true }).toArray();

    // Create a map of user details by email
    const userDetails = users.reduce((acc, user) => {
      acc[user.email] = user;
      return acc;
    }, {});

    // Merge user details with entrepreneurs data
    const partners = entrepreneurs.map(entrepreneur => ({
      ...entrepreneur,
      ...userDetails[entrepreneur.email],
    }));

    res.status(200).json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});


    app.get('/startups/:email', async(req, res)=>{
      const {email} = req.params;
      const startups = await EntrepreneurStartupsCollection.find({email:email}).toArray()
      res.status(200).json(startups)
    })

    app.post('/startup/new', async(req, res)=>{
      const startup = req.body;
      const result = await EntrepreneurStartupsCollection.insertOne(startup);
      res.status(201).json(result)
    })


    //
    // Investors Collection
    //
    const InvestorsCollection = client.db("BizConnect").collection("investors");
    app.post("/investors", async (req, res) => {
      try {
        const newInvestor = req.body;
        const result = await InvestorsCollection.insertOne(newInvestor);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error creating investor", error });
      }
    }
    );
    app.get('/investors', async (req, res) => {
      try {
        const users = await UsersCollection.find({}).toArray();
        const investors = await InvestorsCollection.find({ open_for_investments: true }).toArray();
    
        // Create a map of user details by email
        const userDetails = users.reduce((acc, user) => {
          acc[user.email] = user;
          return acc;
        }, {});
    
        // Merge user details with investors data
        const detailedInvestors = investors.map(investor => ({
          ...investor,
          ...userDetails[investor.email],
        }));
    
        res.status(200).json(detailedInvestors);
      } catch (error) {
        console.error('Error fetching investors:', error);
        res.status(500).json({ error: 'Failed to fetch investors' });
      }
    });

    app.get('/mentors', async (req, res) => {
      try {
        const users = await UsersCollection.find({}).toArray();
        const mentors = await InvestorsCollection.find({ open_for_mentorship: true }).toArray();
    
        // Create a map of user details by email
        const userDetails = users.reduce((acc, user) => {
          acc[user.email] = user;
          return acc;
        }, {});
    
        // Merge user details with mentors data
        const detailedMentors = mentors.map(mentor => ({
          ...mentor,
          ...userDetails[mentor.email],
        }));
    
        res.status(200).json(detailedMentors);
      } catch (error) {
        console.error('Error fetching mentors:', error);
        res.status(500).json({ error: 'Failed to fetch mentors' });
      }
    });
    
    

    app.get("/investors/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const investor = await InvestorsCollection.findOne({ email });
        if (investor) {
          res.status(200).json(investor);
        } else {
          res.status(404).json({ message: "Investor not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error retrieving investor", error });
      }
    });

    app.get('/students', async (req, res) => {
      try {
        const users = await UsersCollection.find({}).toArray();
        const students = await StudentsCollection.find({ open_for_employment: true }).toArray();
    
        // Create a map of user details by email
        const userDetails = users.reduce((acc, user) => {
          acc[user.email] = user;
          return acc;
        }, {});
    
        // Merge user details with students data
        const detailedStudents = students.map(student => ({
          ...student,
          ...userDetails[student.email],
        }));
    
        res.status(200).json(detailedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
      }
    });
    


    //
    // Students Collection
    //

    const StudentsCollection = client.db("BizConnect").collection("students");

    app.post("/students", async (req, res) => {
      try {
        const newStudent = req.body;
        const result = await StudentsCollection.insertOne(newStudent);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error creating student", error });
      }
    }
  );


    // GET - Retrieve all students
    app.get("/students", async (req, res) => {
      try {
        const students = await StudentsCollection.find({}).toArray();
        res.status(200).json(students);
      } catch (error) {
        res.status(500).json({ message: "Error retrieving students", error });
      }
    });

    // GET - Retrieve a single student by email
    app.get("/students/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const student = await StudentsCollection.findOne({ email });
        if (student) {
          res.status(200).json(student);
        } else {
          res.status(404).json({ message: "Student not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error retrieving student", error });
      }
    });


    // PATCH - Update a student by email
    app.patch("/students/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const updates = req.body;
        const result = await StudentsCollection.updateOne(
          { email },
          { $set: updates }
        );
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Student updated successfully" });
        } else {
          res.status(404).json({ message: "Student not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error updating student", error });
      }
    });

    // DELETE - Remove a student by email
    app.delete("/students/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const result = await StudentsCollection.deleteOne({ email });
        if (result.deletedCount > 0) {
          res.status(200).json({ message: "Student deleted successfully" });
        } else {
          res.status(404).json({ message: "Student not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error deleting student", error });
      }
    });

    //
    // studentprojects Collection
    //
    const StudentProjectsCollection = client
      .db("BizConnect")
      .collection("studentprojects");

    // Schema
    // email (text)
    // project_title (text)
    // description (text)
    // project_skills (array)
    // project_url (text)
    // GET - Retrieve all student projects
    app.get("/studentprojects", async (req, res) => {
      try {
        const projects = await StudentProjectsCollection.find({}).toArray();
        res.status(200).json(projects);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error retrieving student projects", error });
      }
    });

    // GET - Retrieve a single project by email
    app.get("/studentprojects/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const projects = await StudentProjectsCollection.find({
          email,
        }).toArray();
        if (projects.length > 0) {
          res.status(200).json(projects);
        } else {
          res
            .status(404)
            .json({ message: "No projects found for this student" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error retrieving student projects", error });
      }
    });

    // POST - Create a new student project
    app.post("/studentprojects", async (req, res) => {
      try {
        const newProject = req.body;
        const result = await StudentProjectsCollection.insertOne(newProject);
        res.status(201).json(result.ops[0]);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error creating student project", error });
      }
    });

    // PATCH - Update a student project by email and project title
    app.patch("/studentprojects/:email/:project_title", async (req, res) => {
      try {
        const { email, project_title } = req.params;
        const updates = req.body;
        const result = await StudentProjectsCollection.updateOne(
          { email, project_title },
          { $set: updates }
        );
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Project updated successfully" });
        } else {
          res.status(404).json({ message: "Project not found" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error updating student project", error });
      }
    });

    // DELETE - Remove a student project by email and project title
    app.delete("/studentprojects/:email/:project_title", async (req, res) => {
      try {
        const { email, project_title } = req.params;
        const result = await StudentProjectsCollection.deleteOne({
          email,
          project_title,
        });
        if (result.deletedCount > 0) {
          res.status(200).json({ message: "Project deleted successfully" });
        } else {
          res.status(404).json({ message: "Project not found" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error deleting student project", error });
      }
    });

    //
    // studentcertification Collection
    //
    const StudentCertificationsCollection = client
      .db("BizConnect")
      .collection("studentcertifications");

    // Schema
    // email (text)
    // certificate_title (text)
    // issuedby (text)
    // date (date)
    // description (text)

    // GET - Retrieve all student certifications
    app.get("/studentcertifications", async (req, res) => {
      try {
        const certifications = await StudentCertificationsCollection.find(
          {}
        ).toArray();
        res.status(200).json(certifications);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error retrieving student certifications", error });
      }
    });

    // GET - Retrieve certifications by student email
    app.get("/studentcertifications/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const certifications = await StudentCertificationsCollection.find({
          email,
        }).toArray();
        if (certifications.length > 0) {
          res.status(200).json(certifications);
        } else {
          res
            .status(404)
            .json({ message: "No certifications found for this student" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error retrieving student certifications", error });
      }
    });

    // POST - Create a new student certification
    app.post("/studentcertifications", async (req, res) => {
      try {
        const newCertification = req.body;
        const result = await StudentCertificationsCollection.insertOne(
          newCertification
        );
        res.status(201).json(result.ops[0]);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error creating student certification", error });
      }
    });

    // PATCH - Update a student certification by email and certificate title
    app.patch(
      "/studentcertifications/:email/:certificate_title",
      async (req, res) => {
        try {
          const { email, certificate_title } = req.params;
          const updates = req.body;
          const result = await StudentCertificationsCollection.updateOne(
            { email, certificate_title },
            { $set: updates }
          );
          if (result.matchedCount > 0) {
            res
              .status(200)
              .json({ message: "Certification updated successfully" });
          } else {
            res.status(404).json({ message: "Certification not found" });
          }
        } catch (error) {
          res
            .status(500)
            .json({ message: "Error updating student certification", error });
        }
      }
    );

    // DELETE - Remove a student certification by email and certificate title
    app.delete(
      "/studentcertifications/:email/:certificate_title",
      async (req, res) => {
        try {
          const { email, certificate_title } = req.params;
          const result = await StudentCertificationsCollection.deleteOne({
            email,
            certificate_title,
          });
          if (result.deletedCount > 0) {
            res
              .status(200)
              .json({ message: "Certification deleted successfully" });
          } else {
            res.status(404).json({ message: "Certification not found" });
          }
        } catch (error) {
          res
            .status(500)
            .json({ message: "Error deleting student certification", error });
        }
      }
    );

    //
    // jobpostings Collection
    //
    const JobPostingsCollection = client
      .db("BizConnect")
      .collection("jobpostings");
    // Schema
    // _id
    // email (text)
    // job_title (text)
    // job_description (text)
    // job_requirements (text)
    // company_name (text)
    // skills (array)
    // deadline (date)
    app.get('/jobs/:email', async (req, res) => {
      const { email } = req.params;
      const jobs = await JobPostingsCollection.find({ email: email }).toArray();
      console.log(jobs)
      res.status(200).json(jobs);
    });
    
    app.post('/job/new/:email', async (req, res) => {
      console.log('sd')
      const job = req.body;
      const { email } = req.params;
      if (result){
        const data = {
          email: email,
          ...job
        }
        const rest = await JobPostingsCollection.insertOne(data);
        res.status(201).json(rest);
      }
    });

    app.delete('/jobs/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const result = await JobPostingsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
          res.status(200).json({ message: 'Job deleted successfully' });
        } else {
          res.status(404).json({ error: 'Job not found' });
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job' });
      }
    });
    
    app.get('/jobs', async(req, res)=>{
      const jobs = await JobPostingsCollection.find({}).toArray();
      res.status(200).json(jobs)
    })

    // GET - Retrieve job postings by student email
    app.get("/jobpostings/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const jobPostings = await JobPostingsCollection.find({
          email,
        }).toArray();
        if (jobPostings.length > 0) {
          res.status(200).json(jobPostings);
        } else {
          res
            .status(404)
            .json({ message: "No job postings found for this email" });
        }
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error retrieving job postings", error });
      }
    });

    // POST - Create a new job posting
    app.post("/jobpostings", async (req, res) => {
      try {
        const newJobPosting = req.body;
        const result = await JobPostingsCollection.insertOne(newJobPosting);
        res.status(201).json(result.ops[0]);
      } catch (error) {
        res.status(500).json({ message: "Error creating job posting", error });
      }
    });

    // PATCH - Update a job posting by email and job title
    app.patch("/jobpostings/:email/:job_title", async (req, res) => {
      try {
        const { email, job_title } = req.params;
        const updates = req.body;
        const result = await JobPostingsCollection.updateOne(
          { email, job_title },
          { $set: updates }
        );
        if (result.matchedCount > 0) {
          res.status(200).json({ message: "Job posting updated successfully" });
        } else {
          res.status(404).json({ message: "Job posting not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error updating job posting", error });
      }
    });

    // DELETE - Remove a job posting by email and job title
    app.delete("/jobpostings/:email/:job_title", async (req, res) => {
      try {
        const { email, job_title } = req.params;
        const result = await JobPostingsCollection.deleteOne({
          email,
          job_title,
        });
        if (result.deletedCount > 0) {
          res.status(200).json({ message: "Job posting deleted successfully" });
        } else {
          res.status(404).json({ message: "Job posting not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error deleting job posting", error });
      }
    });

    //
    // coursesuggestions Collection
    //
    const CourseSuggestionsCollection = client
      .db("BizConnect")
      .collection("coursesuggestions");

    // AI Part - CourseSuggestions
    app.post("/ai/:studentEmail", async (req, res) => {
      console.log('aisi')
      const email = req.params.studentEmail;
      const regan = req.body.regan
  
      try {
          const studentData = await StudentsCollection.findOne({ email });
  
          if (!studentData) {
              return res.status(404).json({ message: "Student not found" });
          }

          const suggestion = await CourseSuggestionsCollection.findOne({email, date:-1})
          if(suggestion && !regan){
            
            res.status(200).send(suggestion)
            return
          }
  
          const {
              skills,
              major,
              graduation_year,
              interested_fields,
              experience,
              highest_education_degree
          } = studentData;
  
          const suggestedSkills_prompt = `Given the student's current skills: ${skills.join(', ')}, major in ${major}, expected graduation year of ${graduation_year}, and interests in ${interested_fields.join(', ')}, recommend specific 4 new skills the student should acquire. Respond with skills separed by comma. For example, your response could look like this: 'React:Given you know JS, react might be an excellent choice, NodeJs:you need somthing to build backends with as well'`;
          const skillsRoadmap_prompt = `Considering the student's current skills: ${skills.join(', ')}, and their major in ${major}, suggest a step-by-step roadmap for skill development in their field. Provide the response as plain text. Make it very concise. Only a few lines`;
          const suggestedCourses_prompt = `Based on the student's skills: ${skills.join(', ')}, major in ${major}, and interests in ${interested_fields.join(', ')}, recommend courses that would enhance their expertise. Respond with 4 course sugeestions separated by comma.  For example, your response could look like this: 'React & Vue.js(Udemy), Introduction to ML(coursera)'`;
          const careerPath_prompt = `Given the student's skills: ${skills.join(', ')}, major in ${major}, and interests in ${interested_fields.join(', ')}, Provide the response as plain text. Make it very concise. Only a few lines.`;
          const careerRoadmap_prompt = `Provide a career roadmap considering the student's current skills: ${skills.join(', ')}, major in ${major}, and expected graduation year of ${graduation_year}. Provide the response as plain text. Make it very concise. Only a few lines`;
          
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          
  
          const suggestedSkillsResult = await model.generateContent(suggestedSkills_prompt);
          const suggestedSkills = suggestedSkillsResult.response.candidates[0].content.parts[0].text;
          

          const skillsRoadmapResult = await model.generateContent(skillsRoadmap_prompt);
          const skillsRoadmap = skillsRoadmapResult.response.candidates[0].content.parts[0].text;
          

          const suggestedCoursesResult = await model.generateContent(suggestedCourses_prompt);
          const suggestedCourses = suggestedCoursesResult.response.candidates[0].content.parts[0].text;
          
  
          const careerPathResult = await model.generateContent(careerPath_prompt);
          const careerPath = careerPathResult.response.candidates[0].content.parts[0].text;


          const careerRoadmapResult = await model.generateContent(careerRoadmap_prompt);
          const careerRoadmap = careerRoadmapResult.response.candidates[0].content.parts[0].text;



          const data_to_push = {
              email,
              suggestedSkills,
              skillsRoadmap,
              suggestedCourses,
              careerPath,
              careerRoadmap,
          };

 

          // delete all the previous data assosiated with this email in the CourseSuggestionsCollection
          // {email:email}

          await CourseSuggestionsCollection.deleteMany({email:email})
  
          await CourseSuggestionsCollection.insertOne(data_to_push);

          res.status(201).json(data_to_push);
  
      } catch (error) {
          console.error("Error generating AI content:", error);
          res.status(500).json({ message: "Error generating AI content", error });
      }
  });
  


  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello BizConnect!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
