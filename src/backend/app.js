const express = require('express');
const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors({
    origin: '*'
}));

const users = [{
    "user": "tony",
    "data": [{
        "id": "a1",
        "start": 1668284401914,
        "timed": false,
        "due": null,
        "completed": true,
        "end": 1668760717698,
        "title": "complete new version",
        "detailed": false,
        "details": "much to fix for next version yet",
        "priority": true
    }, {
        "id": "50270showhide",
        "start": 1668760710751,
        "timed": null,
        "due": null,
        "completed": true,
        "end": 1668760720841,
        "title": "show/hide completed if none exist",
        "detailed": false,
        "details": null,
        "priority": false
    }, {
        "id": "21370addsortin",
        "start": 1668760791542,
        "timed": 1668801600000,
        "due": 1668801600000,
        "completed": false,
        "end": null,
        "title": "add sorting and filtering",
        "detailed": true,
        "details": "sort by: \n- date added\n- date due\n\nfilter by:\n- timed\n- high priority",
        "priority": true
    }]
}];

const logs = [{
    user: 'SYSTEM',
    task: 'SERVER STARTED',
    time: new Date().toLocaleString()
}];

// READ
app.get('/', (req, res) => {
    res.send('TO DO App Rest API - v0.3.6');
});

// test endpoints
app.get('/api2/todos', (req, res) => {
    logs.push({
        user: 'ADMIN',
        task: 'GET /api2/todos',
        time: new Date().toLocaleString()
    });
    res.send(users);
});
app.get('/api2/logs', (req, res) => {
    res.send(logs);
});

app.get('/api2/todos/:user', (req, res) => {
    const user = users.find(c => c.user === req.params.user);

    if (!user) {
        const newUser = {
            user: req.params.user, data: [{
                id: 'fakeUUID',
                start: Date.now(),
                timed: false,
                due: null,
                completed: true,
                end: Date.now(),
                title: 'Connect to web API',
                detailed: true,
                details: 'You were able to connect to the web API',
                priority: false,
            }]
        };
        users.push(newUser);
        logs.push({
            user: `${req.params.user}`,
            task: `CREATED USER`,
            time: new Date().toLocaleString()
        });
        logs.push({
            user: `${req.params.user}`,
            task: 'GET TASKS',
            time: new Date().toLocaleString()
        });
        res.send(newUser.data);
    } else {
        logs.push({
            user: `${req.params.user}`,
            task: 'GET TASKS',
            time: new Date().toLocaleString()
        });
        res.send(user.data);
    }
});

// CREATE
app.post('/api2/todos/:user', (req, res) => {
    const _task = req.body;
    if (_task === undefined || !validToDo(_task.title)) {
        res.status(400).send('Missing title');
        return;
    }

    const fakeUUID = (Math.random() * 100000).toFixed(0) + _task.title.trim().slice(0, 10).replace(/[^a-zA-Z]/gm, "");

    let todo = {
        id: fakeUUID,
        start: Date.now(),
        timed: _task.due,
        // no ?? on server
        // due: _task.due ?? null,
        due: Number(_task.due) ? _task.due : null,
        completed: false,
        end: null,
        title: _task.title.trim(),
        detailed: false,
        details: null,
        priority: _task.priority ? _task.priority : false,
    };

    if (_task.details) {
        todo.detailed = true;
        todo.details = _task.details.trim();
    }

    const user = users.find(c => c.user === req.params.user);

    if (!user) {
        const newUser = { user: req.params.user, data: [] };
        newUser.data.push(todo);
        users.push(newUser);
        logs.push({
            user: `${req.params.user}`,
            task: `CREATED USER`,
            time: new Date().toLocaleString()
        });
    } else {
        user.data.push(todo);
    }
    logs.push({
        user: `${req.params.user}`,
        task: `POST ${todo.title}`,
        time: new Date().toLocaleString()
    });
    res.send(todo);
});

// UPDATE
app.put('/api2/todos/:user/:id', (req, res) => {
    if (req.params.id === -1) res.status(404).send('Task not found on server!');

    const _user = users.find(c => c.user === req.params.user);
    if (!_user) res.status(404).send('User not found!');

    let _local = _user.data.find(c => c.id === req.params.id);
    if (!_local) res.status(404).send('Task not found!');

    const _update = req.body;
    if (_update === undefined || !validToDo(_update.title)) {
        res.status(400).send('Missing title');
        return;
    }

    logs.push({
        user: `${req.params.user}`,
        task: `UPDATE ${_local.title} -  ${_update.title.trim()}`,
        time: new Date().toLocaleString()
    });

    _local.timed = _update.due !== undefined ? _update.due : _local.timed;
    _local.due = _update.due !== undefined ? _update.due : _local.due;
    _local.title = _update.title.trim();
    _local.priority = typeof _update.priority === 'boolean' ? _update.priority : _local.priority;

    if (_update.details) {
        _local.detailed = true;
        _local.details = _update.details.trim();
    }



    res.send(_local);
});

// TOGGLE
app.put('/api2/todos/:user/toggle/:id', (req, res) => {
    if (req.params.id === -1) res.status(404).send('Task not found on server!');

    const user = users.find(c => c.user === req.params.user);
    if (!user) res.status(404).send('User not found!');

    const todo = user.data.find(c => c.id === req.params.id);
    if (!todo) res.status(404).send('Task not found!');

    todo.completed = !todo.completed;
    if (todo.completed)
        todo.end = Date.now();

    logs.push({
        user: `${req.params.user}`,
        task: `TOGGLE ${todo.title}`,
        time: new Date().toLocaleString()
    });

    res.send(todo);
});

// DELETE
app.delete('/api2/todos/:user/:id', (req, res) => {
    if (req.params.id === -1) res.status(404).send('Task not found on server!');

    const user = users.find(c => c.user === req.params.user);
    if (!user) res.status(404).send('User not found!');

    const todo = user.data.find(c => c.id === req.params.id);
    if (!todo) res.status(404).send('Task not found!');

    const index = user.data.indexOf(todo);
    user.data.splice(index, 1);

    logs.push({
        user: `${req.params.user}`,
        task: `DELETE ${todo.title}`,
        time: new Date().toLocaleString()
    });

    res.send(todo);
});

// VALIDATE
function validToDo(title) {
    try {
        return title.trim();
    } catch (e) {
        return false;
    }
}

//// OLD VERSION

const usersOld = [
    {
        user: 'tony', data:
            [
                { id: '1a', task: 'write "get" endpoints', done: true },
                { id: '2b', task: 'write "create" endpoints', done: true },
                { id: '3c', task: 'write "update" endpoints', done: true },
                { id: '4d', task: 'write "delete" endpoints', done: true },
                { id: '5e', task: 'add sql db', done: false }
            ]
    }
];

// test endpoint
app.get('/api/todos', (req, res) => {
    res.send(usersOld);
});

app.get('/api/todos/:user', (req, res) => {
    const user = usersOld.find(c => c.user === req.params.user);

    if (!user) {
        const newUser = { user: req.params.user, data: [{ id: 'A1', task: 'connect to cloud', done: true }] };
        usersOld.push(newUser);
        res.send(newUser.data);
    } else
        res.send(user.data);
});

// CREATE
app.post('/api/todos/:user', (req, res) => {

    const _task = req.body.task;
    if (_task === undefined || !validToDo(_task)) {
        res.status(400).send('Missing task');
        return;
    }

    const fakeUUID = (Math.random() * 100000).toFixed(0) + _task.trim().slice(0, 10).replace(/[^a-zA-Z]/gm, "");

    let todo = {
        id: fakeUUID,
        task: _task.trim(),
        done: false
    };

    const user = usersOld.find(c => c.user === req.params.user);

    if (!user) {
        const newUser = { user: req.params.user, data: [] };
        newUser.data.push(todo);
        usersOld.push(newUser);
    } else {
        user.data.push(todo);
    }
    res.send(todo);
});

// UPDATE
app.put('/api/todos/:user/:id', (req, res) => {
    if (req.params.id === -1) res.status(404).send('Task not found on server!');

    const user = usersOld.find(c => c.user === req.params.user);
    if (!user) res.status(404).send('User not found!');

    const todo = user.data.find(c => c.id === req.params.id);
    if (!todo) res.status(404).send('Task not found!');

    todo.done = !todo.done;
    res.send(todo);
});

// DELETE
app.delete('/api/todos/:user/:id', (req, res) => {
    if (req.params.id === -1) res.status(404).send('Task not found on server!');

    const user = usersOld.find(c => c.user === req.params.user);
    if (!user) res.status(404).send('User not found!');

    const todo = user.data.find(c => c.id === req.params.id);
    if (!todo) res.status(404).send('Task not found!');

    const index = user.data.indexOf(todo);
    user.data.splice(index, 1);

    res.send(todo);
});


// ENVIRONMENT VARIABLES
const port = process.env.PORT || 9090;
app.listen(port, () => console.log(`Listening on port ${port}..`));



