// consts
const api = 'http://localhost:9090/api2/todos';
const todosKey = 'todosNew';
const tutorial = `[{"id":"36104Clickont","start":1668629422181,"timed":false,"due":null,"completed":false,"end":null,"title":"Click on the input in the top right to add task","detailed":false,"priority":false},{"id":"71606Clickont","start":1668629440949,"timed":false,"due":null,"completed":false,"end":null,"title":"Click on the task name to quickly change it","detailed":false,"priority":false},{"id":"60153Hoverover","start":1668629452252,"timed":false,"due":null,"completed":false,"end":null,"title":"Hover over a task to show controls","detailed":false,"priority":false},{"id":"15359Clickthe","start":1668629467332,"timed":null,"due":null,"completed":false,"end":null,"title":"Click the yellow pencil icon to modify a task","detailed":true,"details":"From here you can set due date.\\nClick on any of the time buttons to set the due time to it.\\n\\nNo changes check for cancel button!\\nNo limit on the title or description fields!\\nClunky date time picker.\\n\\nChange in the next version + a lot of refactoring","priority":true},{"id":"37400Clickont","start":1668629664363,"timed":false,"due":null,"completed":false,"end":null,"title":"Click on the red trash can icon to remove a task","detailed":false,"priority":false},{"id":"60014Checkout","start":1668629687435,"timed":false,"due":null,"completed":false,"end":null,"title":"Check out the light theme from the moon icon on the top left","detailed":false,"priority":false},{"id":"95186Connectto","start":1668629699705,"timed":false,"due":null,"completed":false,"end":null,"title":"Connect to the web API with the wifi icon","detailed":false,"priority":false}]`;

let user = 'tony';
let isOnline = false;
let active = [];
let done = [];

export function getUser() {
    return user;
}
export function setUser(_user) {
    user = _user;
}

export function getIsOnline() {
    return isOnline;
}
export function setIsOnline(_isOnline) {
    isOnline = _isOnline;
}
export function toggleIsOnline() {
    isOnline = !isOnline;
}

export function getActiveArray() {
    return active;
}

export function clearActiveArray() {
    active = [];
}

export function getDoneArray() {
    return done;
}
export function clearDoneArray() {
    done = [];
}


//// TASKS' FUNCTIONS

export async function aLoadTodos() {
    const tasks = isOnline ? await _getTasks() : _getTodos();
    if (tasks.length > 0) {
        for (const todo of tasks) {
            if (todo.completed)
                done.push(todo);
            else
                active.push(todo);
        }
    }
}

export async function aCreateTodo(todo) {
    if (isOnline) return await _postTask(todo);
    else return _postTodo(todo);
}

export async function aUpdateTodo(todo) {
    let updated = null;
    if (isOnline) updated = await _updateTask(todo);
    else updated = _updateTodo(todo);

    if (updated === null)
        return false;

    if (updated.completed) {
        const index = done.findIndex(t => t.id === todo.id);
        if (index >= 0) {
            done.splice(index, 1, updated);
        }
    } else {
        const index = active.findIndex(t => t.id === todo.id);
        if (index >= 0) {
            active.splice(index, 1, updated);
        }
    }
    return true;
}

export async function aToggleTodo(id) {
    let completed = null;
    if (isOnline) completed = await _toggleTask(id);
    else completed = _toggleTodo(id);

    if (completed === null)
        return null;

    if (completed) {
        const index = active.findIndex(t => t.id === id);
        if (index >= 0) {
            const task = active.splice(index, 1)[0];
            task.completed = completed;
            task.end = Date.now();
            done.unshift(task);
        }
    } else {
        const index = done.findIndex(t => t.id === id);
        if (index >= 0) {
            const task = done.splice(index, 1)[0];
            task.completed = completed;
            active.unshift(task);
        }
    }
}

export async function aDeleteTodo(id) {

    const isActive = active.findIndex(todo => todo.id === id) >= 0;

    if (isActive)
        active.splice(active.findIndex(todo => todo.id === id), 1);
    else
        done.splice(done.findIndex(todo => todo.id === id), 1);


    if (isOnline) return await _deleteTask(id);
    return _deleteTodo(id);
}


////  DATA STORAGE FUNCTIONS

//  READ
// fetch tasks from remote server for current user
async function _getTasks() {
    try {
        let response = await fetch(`${api}/${user}`, {
            method: "GET",
            headers: { "Content-type": "application/json" }
        }).then(res => res.json());
        console.log('RECEIVED', response);
        return response;
    }
    catch (e) {
        console.log(e);
        return [];
    }
}
// load tasks from local storage
function _getTodos() {
    let todos = JSON.parse(localStorage.getItem(todosKey));

    if (!todos) {
        todos = JSON.parse(tutorial);
        localStorage.setItem(todosKey, JSON.stringify(todos));
    }
    console.log('RECEIVED', todos);
    return todos;
}

//  CREATE
// post task to server
async function _postTask(todo) {
    try {
        let response = await fetch(`${api}/${user}`, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(todo)
        }).then(res => res.json());
        console.log('CREATED', response);
        return response;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}
// save task to local storage
function _postTodo(todo) {
    let todos = JSON.parse(localStorage.getItem(todosKey));
    if (!todos) todos = [];

    const fakeUUID = (Math.random() * 100000).toFixed(0) + todo.title.trim().slice(0, 10);

    let newTask = {
        id: fakeUUID,
        start: Date.now(),
        timed: todo.due,
        due: todo.due ?? null,
        completed: false,
        end: null,
        title: todo.title.trim(),
        detailed: false,
        details: null,
        priority: todo.priority ? todo.priority : false,
    };

    if (todo.details) {
        newTask.detailed = true;
        newTask.details = todo.details.trim();
    }

    todos.push(newTask);
    localStorage.setItem(todosKey, JSON.stringify(todos));

    console.log('CREATED', newTask);
    return newTask;
}

//  DELETE
// delete task from server
async function _deleteTask(id) {
    try {
        let response = await fetch(`${api}/${user}/${id}`, {
            method: "DELETE",
            headers: { "Content-type": "application/json" },
        });
        console.log('DELETED', await response.json());
        return response.status === 200;

    }
    catch (e) {
        console.log(e);
        return false;
    }
}
// delete task from local storage
function _deleteTodo(id) {
    let todos = JSON.parse(localStorage.getItem(todosKey));
    if (!todos) return false;

    const task = todos.splice(todos.indexOf(todos.find(todo => todo.id === id)), 1);
    localStorage.setItem(todosKey, JSON.stringify(todos));

    console.log('DELETED', task[0]);
    return true;
}

//  UPDATE
// update task state on server
async function _updateTask(todo) {
    try {
        let response = await fetch(`${api}/${user}/${todo.id}`, {
            method: "PUT",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(todo)
        }).then(res => res.json());
        console.log('UPDATED', response);
        return response;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}
// update task state on local storage
function _updateTodo(todo) {
    let todos = JSON.parse(localStorage.getItem(todosKey));
    if (!todos) return null;

    const task = todos.find(t => t.id === todo.id);

    task.timed = todo.due !== undefined ? todo.due : task.timed;
    task.due = todo.due !== undefined ? todo.due : task.due;
    task.title = todo.title.trim();
    task.detailed = todo.details?.trim() ? true : false;
    task.details = todo.details?.trim() ? todo.details.trim() : task.details;
    task.priority = typeof todo.priority === 'boolean' ? todo.priority : task.priority;

    localStorage.setItem(todosKey, JSON.stringify(todos));

    console.log('UPDATED', task);
    return task;
}

//  TOGGLE
// toggle task state on server
async function _toggleTask(id) {
    try {
        let response = await fetch(`${api}/${user}/toggle/${id}`, {
            method: "PUT",
            headers: { "Content-type": "application/json" }
        }).then(res => res.json());
        console.log('TOGGLED', response);
        return response.completed;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}
// toggle task state on local storage
function _toggleTodo(id) {
    let todos = JSON.parse(localStorage.getItem(todosKey));
    if (!todos) return null;

    const task = todos.find(todo => todo.id === id);
    task.completed = !task.completed;
    localStorage.setItem(todosKey, JSON.stringify(todos));

    console.log('TOGGLED', task);
    return task.completed;
}
