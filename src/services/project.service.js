const ApiError = require('../utils/ApiError');
const Project = require('../models/project.model');
const Task = require('../models/task.model');

async function getOwnedProject(id, userId) {
  const project = await Project.findByIdForUser(id, userId);
  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

async function createProject(userId, data) {
  const id = await Project.create({ userId, ...data });
  return Project.findByIdForUser(id, userId);
}

const listProjects = (userId, filters) => Project.findAllByUser(userId, filters);

const getProject = (id, userId) => getOwnedProject(id, userId);

async function updateProject(id, userId, data) {
  await getOwnedProject(id, userId);
  await Project.update(id, userId, data);
  return Project.findByIdForUser(id, userId);
}

async function deleteProject(id, userId) {
  await getOwnedProject(id, userId);
  await Project.remove(id, userId);

  try {
    await Task.deleteMany({ projectId: id, userId });
  } catch (err) {
    console.error(`Failed to delete tasks of project ${id}:`, err.message);
  }
}

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject };
