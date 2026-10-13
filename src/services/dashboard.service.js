const Project = require('../models/project.model');
const Task = require('../models/task.model');

const countIf = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });

async function getDashboard(userId) {
  const [projectStats, taskAgg] = await Promise.all([
    Project.getStatsByUser(userId),
    Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: countIf({ $eq: ['$status', 'completed'] }),
          pending: countIf({ $ne: ['$status', 'completed'] }),
          highPriority: countIf({ $eq: ['$priority', 'high'] }),
        },
      },
    ]),
  ]);

  const t = taskAgg[0] || { total: 0, completed: 0, pending: 0, highPriority: 0 };

  return {
    projects: {
      total: projectStats.total,
      active: projectStats.active,
      completed: projectStats.completed,
    },
    tasks: {
      total: t.total,
      pending: t.pending,
      completed: t.completed,
      highPriority: t.highPriority,
    },
  };
}

module.exports = { getDashboard };
