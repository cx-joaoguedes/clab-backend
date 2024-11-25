const Project = require('../models/project')

const getProjects = async (req, res) => {
    return res.status(200).send('ok')
}

const createProject = async (req, res) => {
    const { project_name, project_description, project_language, project_owner } = req.body;

    if (!project_name || !project_language || !project_owner) {
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