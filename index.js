const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: ["http://localhost:5174", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static("uploads")); // Serve uploaded files from this directory

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.b6ckjyi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

async function run() {
  try {
    await client.connect();

    //
    // Students Collection
    //

    const StudentsCollection = client.db("BizConnect").collection("students");
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

    // POST - Create a new student
    app.post("/students", upload.single("cv"), async (req, res) => {
      try {
        const newStudent = {
          ...req.body,
          cv: req.file.path, // Save the file path
        };
        const result = await StudentsCollection.insertOne(newStudent);
        res.status(201).json(result.ops[0]);
      } catch (error) {
        res.status(500).json({ message: "Error creating student", error });
      }
    });

    // PATCH - Update a student by email
    app.patch("/students/:email", upload.single("cv"), async (req, res) => {
      try {
        const { email } = req.params;
        const updates = req.file
          ? { ...req.body, cv: req.file.path }
          : req.body;
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
    // email (text)
    // job_title (text)
    // job_description (text)
    // job_requirements (text)
    // company_name (text)
    // skills (array)
    // deadline (date)

    // GET - Retrieve all job postings
    app.get("/jobpostings", async (req, res) => {
      try {
        const jobPostings = await JobPostingsCollection.find({}).toArray();
        res.status(200).json(jobPostings);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error retrieving job postings", error });
      }
    });

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
      const email = req.params.studentEmail;
  
      try {
          const studentData = await StudentsCollection.findOne({ email });
  
          if (!studentData) {
              return res.status(404).json({ message: "Student not found" });
          }
  
          const {
              skills,
              introduction,
              major,
              graduation_year,
              interested_fields,
              experience,
              highest_education_degree
          } = studentData;
  
          const suggestedSkills_prompt = `Based on the student's skills: ${skills.join(', ')}, major: ${major}, graduation year: ${graduation_year}, and interested fields: ${interested_fields.join(', ')}, suggest new skills the student should learn. Provide the suggestions as an array.`;
          const skillsRoadmap_prompt = `Based on the student's skills: ${skills.join(', ')}, major: ${major}, graduation year: ${graduation_year}, and interested fields: ${interested_fields.join(', ')}, provide a roadmap for acquiring these skills. Provide the roadmap as a text.`;
          const suggestedCourses_prompt = `Based on the student's skills: ${skills.join(', ')}, major: ${major}, graduation year: ${graduation_year}, and interested fields: ${interested_fields.join(', ')}, suggest courses the student should take. Provide the suggestions as an array.`;
          const careerPath_prompt = `Based on the student's skills: ${skills.join(', ')}, major: ${major}, graduation year: ${graduation_year}, and interested fields: ${interested_fields.join(', ')}, suggest a suitable career path. Provide the suggestion as a text.`;
          const careerRoadmap_prompt = `Based on the student's skills: ${skills.join(', ')}, major: ${major}, graduation year: ${graduation_year}, and interested fields: ${interested_fields.join(', ')}, provide a roadmap for the student's career. Provide the roadmap as a text.`;
  
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
          const suggestedSkillsResult = await model.generateContent(suggestedSkills_prompt);
          const suggestedSkillsResponse = await suggestedSkillsResult.response;
          const suggestedSkills = suggestedSkillsResponse.candidates[0].content.parts[0].text;
  
          const skillsRoadmapResult = await model.generateContent(skillsRoadmap_prompt);
          const skillsRoadmapResponse = await skillsRoadmapResult.response;
          const skillsRoadmap = skillsRoadmapResponse.candidates[0].content.parts[0].text;
  
          const suggestedCoursesResult = await model.generateContent(suggestedCourses_prompt);
          const suggestedCoursesResponse = await suggestedCoursesResult.response;
          const suggestedCourses = suggestedCoursesResponse.candidates[0].content.parts[0].text;
  
          const careerPathResult = await model.generateContent(careerPath_prompt);
          const careerPathResponse = await careerPathResult.response;
          const careerPath = careerPathResponse.candidates[0].content.parts[0].text;
  
          const careerRoadmapResult = await model.generateContent(careerRoadmap_prompt);
          const careerRoadmapResponse = await careerRoadmapResult.response;
          const careerRoadmap = careerRoadmapResponse.candidates[0].content.parts[0].text;
  
          const data_to_push = {
              email,
              suggestedSkills,
              skillsRoadmap,
              suggestedCourses,
              careerPath,
              careerRoadmap,
          };
  
          await CourseSuggestionsCollection.insertOne(data_to_push);
  
          res.status(201).json(data_to_push);
  
      } catch (error) {
          console.error("Error generating AI content:", error);
          res.status(500).json({ message: "Error generating AI content", error });
      }
  });
// GET - Retrieve course suggestions by student email
app.get('/coursesuggestions/:email', async (req, res) => {
  const email = req.params.email;

  try {
      const courseSuggestions = await CourseSuggestionsCollection.findOne({ email });

      if (!courseSuggestions) {
          return res.status(404).json({ message: 'Course suggestions not found for this student' });
      }

      res.status(200).json(courseSuggestions);
  } catch (error) {
      console.error("Error retrieving course suggestions:", error);
      res.status(500).json({ message: 'Error retrieving course suggestions', error });
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
