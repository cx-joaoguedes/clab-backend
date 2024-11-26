const Project = require('../models/project')

const getProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        return res.status(200).json(projects)
    } catch (error) {
        console.error("Error fetching projects:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

const createProject = async (req, res) => {
    const { project_name, project_description, project_language } = req.body;
    const project_owner = req.user.data.username

    if (!project_name || !project_language) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const newProject = new Project({ project_name, project_description, project_language, project_owner });
        const savedProject = await newProject.save();
        
        return res.status(201).json(savedProject);
    } catch (error) {
        console.error("Error saving project:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports = {
    getProjects: getProjects,
    createProject: createProject
}