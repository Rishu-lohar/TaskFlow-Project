import Task from "../models/Task.mjs";


// CREATE TASK
export const createTask = async (req, res) => {
  try {

    const { title, priority, deadline } = req.body;

    const task = await Task.create({
      user: req.user._id,
      title,
      priority,
      deadline,
    });

    res.status(201).json(task);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


// GET ALL TASKS
export const getTasks = async (req, res) => {
  try {

    const tasks = await Task.find({
      user: req.user._id,
    });

    res.json(tasks);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


// UPDATE TASK
export const updateTask = async (req, res) => {
  try {

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.completed = !task.completed;

    const updatedTask = await task.save();

    res.json(updatedTask);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


// DELETE TASK
export const deleteTask = async (req, res) => {
  try {

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    await task.deleteOne();

    res.json({
      message: "Task deleted",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};