import { query, update, text, Principal, float64, Result, nat64, ic, Vec, Err, Ok, Canister, Record, StableBTreeMap, Opt } from 'azle';

// Task
const Task = Record({
    id: text,
    title: text,
    description: text,
    reward: float64,
    poster: Principal,
    assignedTo: Opt(Principal),
    status: text,
    createdAt: nat64,
    updatedAt: Opt(nat64)
});

type Task = typeof Task;
const taskStorage = StableBTreeMap(text, Task, 1);

export default Canister({
    // Create a new task
    createTask: update(
        [text, text, float64],
        Result(text, text),
        (title, description, reward) => {
            const caller = ic.caller();
            const task = {
                id: ic.principal(), // Use Azle's built-in functionalities for generating unique identifiers
                title,
                description,
                reward,
                poster: caller,
                assignedTo: null,
                status: 'open',
                createdAt: ic.time(),
                updatedAt: null
            };
            taskStorage.insert(task.id, task);
            return Ok(`Task "${task.title}" created successfully.`);
        }
    ),

    // Get all tasks
    getAllTasks: query([], Result(Vec(Task), text), () => {
        const tasks = taskStorage.values();
        return Ok(tasks);
    }),

    // Get task by ID
    getTaskById: query([text], Result(Task, text), (taskId: string) => {
        const task = taskStorage.get(taskId);
        if ('None' in task) {
            return Err(`Task with ID ${taskId} not found.`); // Provide specific details about the error
        }
        return Ok(task.Some);
    }),

    // Assign task to user
    assignTask: update(
        [text, Principal],
        Result(text, text),
        (taskId: string, assignee: Principal) => {
            const task = taskStorage.get(taskId);
            if ('None' in task) {
                return Err(`Task with ID ${taskId} not found.`); // Provide specific details about the error
            }
            const updatedTask: Task = {
                ...task.Some,
                assignedTo: assignee,
                status: 'assigned',
                updatedAt: ic.time()
            };
            taskStorage.insert(taskId, updatedTask);
            return Ok(`Task "${updatedTask.title}" assigned to ${assignee}`);
        }
    ),

    // Complete task
    completeTask: update(
        [text],
        Result(text, text),
        (taskId: string) => {
            const task = taskStorage.get(taskId);
            if ('None' in task) {
                return Err(`Task with ID ${taskId} not found.`); // Provide specific details about the error
            }
            const updatedTask: Task = {
                ...task.Some,
                status: 'completed',
                updatedAt: ic.time()
            };
            taskStorage.insert(taskId, updatedTask);
            return Ok(`Task "${updatedTask.title}" marked as completed.`);
        }
    ),

    // Get tasks assigned to a specific user
    getTasksByAssignee: query([Principal], Result(Vec(Task), text), (assignee: Principal) => {
        const tasks = taskStorage.values().filter(task => task.assignedTo === assignee);
        return Ok(tasks);
    }),

    // Get tasks posted by a specific user
    getTasksByPoster: query([Principal], Result(Vec(Task), text), (poster: Principal) => {
        const tasks = taskStorage.values().filter(task => task.poster === poster);
        return Ok(tasks);
    }),

    // Get tasks by status
    getTasksByStatus: query([text], Result(Vec(Task), text), (status: text) => {
        const tasks = taskStorage.values().filter(task => task.status === status);
        return Ok(tasks);
    }),

    // Update task details
    updateTask: update(
        [text, text, text, float64],
        Result(text, text),
        (taskId: string, title: string, description: string, reward: float64) => {
            const task = taskStorage.get(taskId);
            if ('None' in task) {
                return Err(`Task with ID ${taskId} not found.`); // Provide specific details about the error
            }
            const updatedTask: Task = {
                ...task.Some,
                title,
                description,
                reward,
                updatedAt: ic.time()
            };
            taskStorage.insert(taskId, updatedTask);
            return Ok(`Task "${updatedTask.title}" updated successfully.`);
        }
    ),

    // Delete task
    deleteTask: update(
        [text],
        Result(text, text),
        (taskId: string) => {
            const task = taskStorage.get(taskId);
            if ('None' in task) {
                return Err(`Task with ID ${taskId} not found.`); // Provide specific details about the error
            }
            taskStorage.remove(taskId);
            return Ok(`Task "${task.Some.title}" deleted successfully.`);
        }
    )
});
