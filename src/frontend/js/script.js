import {
    getActiveArray,
    clearActiveArray,
    getDoneArray,
    clearDoneArray,
    aLoadTodos,
    aCreateTodo,
    aUpdateTodo,
    aDeleteTodo,
    aToggleTodo,
    setIsOnline,
    getIsOnline,
    toggleIsOnline,
    setUser,
    getUser,
} from "./data.js";

// consts
const userKey = 'userNew';
const onlineKey = 'online';
const themeKey = 'theme';

// variables
let darkTheme = true;
let refresh = true;
let interval;

// get html elements
const appDiv = document.getElementsByClassName('main')[0];
const appTitle = document.getElementById('app-title');
const quickInput = document.getElementById('input');
const listActive = document.getElementById('active');
const listDone = document.getElementById('done');
const btnTheme = document.getElementById('btn-theme');
const btnOnline = document.getElementById('btn-online');
const btnAdd = document.getElementById('btn-add');
const tasksDiv = document.getElementsByClassName('tasks')[0];


// on page load event start loading data
window.addEventListener('load', loadPage);

async function loadPage() {
    const _isOnline = localStorage.getItem(onlineKey);
    if (_isOnline != null) {
        setIsOnline(Boolean(_isOnline));
    }

    const _darkTheme = localStorage.getItem(themeKey);
    if (_darkTheme != null) {
        darkTheme = Boolean(_darkTheme);
    }

    const _userLocal = localStorage.getItem(userKey);
    if (_userLocal) {
        setUser(_userLocal);
    }
    else {
        const _userPrompt = prompt("Please enter your name", getUser());
        if (_userPrompt != null && _userPrompt.trim() !== '') {
            setUser(_userPrompt.toLocaleLowerCase());
            localStorage.setItem(userKey, _userPrompt.toLocaleLowerCase());
        }
    }
    await updateUI();
    if (refresh) interval = setInterval(updateTimer, 1000);
}

// update UI on initial load or after online change
async function updateUI() {
    quickInput.value = '';
    listActive.innerHTML = '';
    listDone.innerHTML = '';
    btnOnline.innerHTML = getIsOnline() ? '<i class="online material-icons">wifi</i>' : '<i class="offline material-icons">wifi_off</i>';
    btnTheme.innerHTML = darkTheme ? '<i class="theme material-icons">nightlight_round</i>' : '<i class="theme material-icons">wb_sunny</i>';
    appTitle.innerText = `${getUser()[0].toUpperCase() + getUser().slice(1)}'s ${getIsOnline() ? 'Online' : 'Offline'} List`;
    await aLoadTodos();
    getDoneArray().length ? tasksDiv.classList.remove('no-completed') : tasksDiv.classList.add('no-completed');
    mapTasks();
}

function updateTimer() {
    const timedTasks = document.getElementsByClassName('task timed');
    if (timedTasks.length > 0)
        for (let i = 0; i < timedTasks.length; i++) {
            let taskDiv = timedTasks[i];
            let taskObj = getActiveArray().find(t => t.id === taskDiv.id);
            const progressBar = taskDiv.getElementsByClassName('task-progress-bar')[0];
            const progressLabel = taskDiv.getElementsByClassName('task-progress-time')[0];

            if (taskObj.due - Date.now() - 7200000 > 0) {
                const percentage = Math.floor(100 - ((Date.now() - taskObj.start) / (taskObj.due - 7200000 - taskObj.start) * 100));
                progressBar.style.width = `${percentage}%`;
                progressBar.style.background = getProgressBarColor(percentage);

                const time = (taskObj.due - Date.now() - 7200000) / 1000;
                progressLabel.innerText = `due in ${parseSecondsToString(time)}`;
                progressLabel.style.color = getProgressLabelColor(100 - percentage);
            }
            else {
                progressLabel.innerText = `OVERDUE`;
                progressLabel.style.color = 'black';
                progressBar.style.width = `100%`;
                progressBar.style.background = `red`;
            }

        }
}

function parseSecondsToString(s) {
    if (s < 60) return `${Math.floor(s)}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 604800) return `${Math.floor(s / 86400)}d`;
    return `a lot`;
}

function getProgressBarColor(percent) {
    // 100 to 50 bump red to 255
    // 50 to 0 set green to 0
    return `rgb(${Math.min(255, Math.max(0, (100 - percent) * 5))}, ${percent > 50 ? 255 : Math.min(255, Math.max(0, percent * 5))}, 0)`;
}

function getProgressLabelColor(percent) {
    const brightness = Math.min(255, Math.max(0, (percent - 30) * 5));
    return `rgb(${brightness},${brightness},${brightness})`;
}

// refresh UI on array update
function refreshUI() {
    listActive.innerHTML = '';
    listDone.innerHTML = '';
    getDoneArray().length ? tasksDiv.classList.remove('no-completed') : tasksDiv.classList.add('no-completed');
    mapTasks();
}

function showOverlay(todo, newTodo = false) {
    const overlayDiv = document.createElement('div');
    overlayDiv.classList.add('overlay-main');

    const mainDiv = document.createElement('div');
    mainDiv.classList.add('overlay-container');

    // title
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('overlay-element', 'title');
    const titleInput = document.createElement('input');
    titleInput.classList.add('primary');
    titleInput.defaultValue = todo.title ?? '';
    titleDiv.appendChild(titleInput);
    mainDiv.appendChild(titleDiv);

    // date picker
    const dateDiv = document.createElement('div');
    dateDiv.classList.add('overlay-element');
    const dateIcon = document.createElement('span');
    dateIcon.classList.add('material-icons', 'secondary');
    dateIcon.innerText = 'calendar_month';
    dateDiv.appendChild(dateIcon);
    const dateiInput = document.createElement('input');
    dateiInput.classList.add('date-picker', 'secondary');
    dateiInput.type = 'datetime-local';
    dateiInput.defaultValue = todo.due ? new Date(todo.due).toISOString().slice(0, 16) : '';
    dateDiv.appendChild(dateiInput);

    const dateBtnMinutes = document.createElement('button');
    dateBtnMinutes.classList.add('primary');
    dateBtnMinutes.innerText = '30 min';
    dateBtnMinutes.addEventListener('click', () => {
        const mins = new Date(Date.now() + 7200000);
        dateiInput.value = dateStringFromMillis(mins.setMinutes(mins.getMinutes() + 30));
    });
    dateDiv.appendChild(dateBtnMinutes);

    const dateBtnHour = document.createElement('button');
    dateBtnHour.classList.add('primary');
    dateBtnHour.innerText = '1 hour';
    dateBtnHour.addEventListener('click', () => {
        const hour = new Date(Date.now() + 7200000);
        dateiInput.value = dateStringFromMillis(hour.setHours(hour.getHours() + 1));
    });
    dateDiv.appendChild(dateBtnHour);

    const dateBtnDay = document.createElement('button');
    dateBtnDay.classList.add('primary');
    dateBtnDay.innerText = '1 day';
    dateBtnDay.addEventListener('click', () => {
        const day = new Date(Date.now() + 7200000);
        dateiInput.value = dateStringFromMillis(day.setDate(day.getDate() + 1));
    });
    dateDiv.appendChild(dateBtnDay);

    mainDiv.appendChild(dateDiv);

    // priority picker
    const priorityDiv = document.createElement('div');
    priorityDiv.classList.add('overlay-element');
    const priorityIcon = document.createElement('span');
    priorityIcon.classList.add('material-icons', 'secondary');
    priorityIcon.innerText = 'priority_high';
    priorityDiv.appendChild(priorityIcon);
    const priorityDivInner = document.createElement('div');
    priorityDivInner.classList.add('priority-picker');
    const priorityPicker = document.createElement('input');
    priorityPicker.type = 'checkbox';
    priorityPicker.defaultChecked = todo.priority ?? false;
    priorityDivInner.appendChild(priorityPicker);
    const priorityP = document.createElement('p');
    priorityP.classList.add('secondary');
    priorityP.innerText = 'High priority';
    priorityDivInner.appendChild(priorityP);
    priorityDiv.appendChild(priorityDivInner);
    mainDiv.appendChild(priorityDiv);

    // details textarea
    const detailsDiv = document.createElement('div');
    detailsDiv.classList.add('overlay-element', 'overlay-details');
    const detailsIcon = document.createElement('span');
    detailsIcon.classList.add('material-icons', 'secondary');
    detailsIcon.innerText = 'info';
    detailsDiv.appendChild(detailsIcon);
    const detailsInput = document.createElement('textarea');
    detailsInput.classList.add('primary');
    detailsInput.defaultValue = todo.details ?? '';
    detailsDiv.appendChild(detailsInput);
    mainDiv.appendChild(detailsDiv);

    // buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('overlay-element');
    const buttonsDivInner = document.createElement('div');
    buttonsDivInner.classList.add('overlay-buttons');
    const buttonCancel = document.createElement('button');
    buttonCancel.classList.add('primary');
    buttonCancel.innerHTML = 'CANCEL';
    buttonCancel.addEventListener('click', () => {
        hideOverlay();
    });
    buttonsDivInner.appendChild(buttonCancel);
    const buttonSave = document.createElement('button');
    buttonSave.classList.add('primary');
    buttonSave.innerHTML = 'SAVE';
    buttonSave.addEventListener('click', async () => {

        console.log(dateiInput.valueAsNumber);
        if (newTodo) {
            if (!await aValidateAndAddTodo({
                title: titleInput.value,
                priority: priorityPicker.checked,
                details: detailsInput.value,
                due: dateiInput.valueAsNumber
            }))
                return;
        }
        else
            if (!await aUpdateTodo({
                id: todo.id,
                title: titleInput.value,
                priority: priorityPicker.checked,
                details: detailsInput.value,
                due: dateiInput.valueAsNumber
            })) {
                alert('Something went wrong');
                return;
            }
        refreshUI();
        hideOverlay();
    });
    buttonsDivInner.appendChild(buttonSave);
    buttonsDiv.appendChild(buttonsDivInner);
    mainDiv.appendChild(buttonsDiv);

    overlayDiv.appendChild(mainDiv);
    appDiv.append(overlayDiv);
}

function hideOverlay() {
    const mainOverlay = document.getElementsByClassName('overlay-main')[0];
    mainOverlay.remove();
}
// get date picker string input from millis
function dateStringFromMillis(millis) {
    const date = new Date(millis - 7200000);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toLocaleString('en-US', { minimumIntegerDigits: 2 })}-${date.getDate().toLocaleString('en-US', { minimumIntegerDigits: 2 })} ${date.getHours().toLocaleString('en-US', { minimumIntegerDigits: 2 })}:${date.getMinutes().toLocaleString('en-US', { minimumIntegerDigits: 2 })}`;
}

function showMiniOverlay(x, y, y2, id, title) {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');


    const titleOverlay = document.createElement('div');
    titleOverlay.style = `top: ${x}px; left: ${y}px`;

    const titleInput = document.createElement('textarea');
    titleInput.style = `width: ${y2 - y}px;`;
    titleInput.defaultValue = '';
    titleInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
            hideMiniOverlay();
            await aUpdateTodo({ id: id, title: titleInput.value });
        }
        if (event.key === "Escape") {
            if (title === titleInput.value)
                hideMiniOverlay();
            else {
                if (confirm('You will lose your changes!')) {
                    hideMiniOverlay();
                }
            }
        }
    });

    const closeInput = document.createElement('span');
    closeInput.classList.add('secondary', 'material-icons');
    closeInput.innerText = 'cancel';
    closeInput.addEventListener('click', () => {
        if (title === titleInput.value)
            hideMiniOverlay();
        else {
            if (confirm('You will lose your changes!')) {
                hideMiniOverlay();
            }
        }
    });

    titleOverlay.appendChild(titleInput);
    titleOverlay.appendChild(closeInput);

    overlay.appendChild(titleOverlay);
    appDiv.appendChild(overlay);

    titleInput.focus();

    // go to end of text quickfix - set value after focus
    titleInput.defaultValue = title;
}

function hideMiniOverlay() {
    const overlay = document.getElementsByClassName('overlay')[0];
    if (overlay)
        overlay.remove();
    appDiv.classList.remove('edit');
}

function mapTasks() {
    const tasks = getActiveArray().concat(getDoneArray());
    for (const todo of tasks)
        _mapTask(todo);
}

async function _mapTask(todo) {
    const taskDiv = document.createElement('div');
    taskDiv.classList.add('task', 'noselect');
    taskDiv.id = todo.id;

    if (todo.completed)
        taskDiv.classList.add('completed');
    if (todo.timed && !todo.completed)
        taskDiv.classList.add('timed');
    if (todo.detailed)
        taskDiv.classList.add('detailed');
    if (todo.priority)
        taskDiv.classList.add('priority');


    const completeDiv = document.createElement('div');
    completeDiv.classList.add('task-complete');

    const completeIcon = document.createElement('span');
    completeIcon.classList.add('secondary', 'material-icons');
    completeIcon.innerText = 'check_circle';
    completeIcon.addEventListener('click', async () => {
        if (await aToggleTodo(todo.id) !== null)
            refreshUI();
    });

    completeDiv.appendChild(completeIcon);

    const mainDiv = document.createElement('div');
    mainDiv.classList.add('task-main');

    const controlsDiv = document.createElement('div');
    controlsDiv.classList.add('task-controls');

    const editDiv = document.createElement('div');
    editDiv.classList.add('task-edit', 'task-icon');

    const editIcon = document.createElement('span');
    editIcon.classList.add('secondary', 'material-icons');
    editIcon.innerText = 'edit';
    editIcon.addEventListener('click', () => { showOverlay(todo); });

    editDiv.appendChild(editIcon);

    const deleteDiv = document.createElement('div');
    deleteDiv.classList.add('task-delete', 'task-icon');

    const deleteIcon = document.createElement('span');
    deleteIcon.classList.add('secondary', 'material-icons');
    deleteIcon.innerText = 'delete_outline';
    deleteIcon.addEventListener('click', async () => {
        if (await aDeleteTodo(todo.id))
            refreshUI();
    });

    deleteDiv.appendChild(deleteIcon);

    controlsDiv.appendChild(editDiv);
    controlsDiv.appendChild(deleteDiv);

    mainDiv.appendChild(controlsDiv);

    const titleDiv = document.createElement('div');
    titleDiv.classList.add('task-title', 'primary');

    const titleP = document.createElement('p');
    titleP.classList.add('task-title-text');
    titleP.innerText = todo.title;
    titleP.addEventListener('click', () => {
        if (!appDiv.classList.contains('edit')) {
            appDiv.classList.add('edit');
            const coords = titleP.getBoundingClientRect();
            showMiniOverlay(coords.top, coords.left, coords.right, todo.id, todo.title);
        }
    });

    titleDiv.appendChild(titleP);

    mainDiv.appendChild(titleDiv);

    const progressDiv = document.createElement('div');
    progressDiv.classList.add('task-progress', 'task-timed');

    const progressBarDiv = document.createElement('div');
    progressBarDiv.classList.add('task-progress-bar');

    const progressP = document.createElement('p');
    progressP.classList.add('task-progress-time');
    progressP.innerText = '';
    progressDiv.appendChild(progressBarDiv);
    progressDiv.appendChild(progressP);

    mainDiv.appendChild(progressDiv);

    const footerDiv = document.createElement('div');
    footerDiv.classList.add('task-footer', 'secondary');

    const taskDateDiv = document.createElement('div');
    taskDateDiv.classList.add('task-date');
    taskDateDiv.innerHTML = `<p>${parseDateTime(todo.start)}</p>`;

    const taskDueDateDiv = document.createElement('div');
    if (!todo.completed) {
        taskDueDateDiv.classList.add('task-timed');
        taskDueDateDiv.innerHTML = `<p> - ${parseDateTime(todo.due)}</p>`;
    } else
        taskDueDateDiv.innerHTML = `<p> - ${parseDateTime(todo.end)}</p>`;

    taskDateDiv.appendChild(taskDueDateDiv);

    footerDiv.appendChild(taskDateDiv);

    const badgesDiv = document.createElement('div');
    badgesDiv.classList.add('task-badges', 'secondary');

    const detailsIcon = document.createElement('p');
    detailsIcon.classList.add('task-detailed', 'task-icon', 'material-icons');
    detailsIcon.innerText = 'description';

    const priorityIcon = document.createElement('p');
    priorityIcon.classList.add('task-priority', 'task-icon', 'material-icons');
    priorityIcon.innerText = 'priority_high';

    badgesDiv.appendChild(detailsIcon);
    badgesDiv.appendChild(priorityIcon);

    footerDiv.appendChild(badgesDiv);

    mainDiv.appendChild(footerDiv);

    taskDiv.appendChild(completeDiv);
    taskDiv.appendChild(mainDiv);

    todo.completed ? listDone.appendChild(taskDiv) : listActive.appendChild(taskDiv);
}

// parse millis to local string for tasks' card date
function parseDateTime(millis) {
    const date = new Date(millis - 7200000);
    return date.toLocaleDateString('bg');
}

// on enter add task to list
quickInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
        if (aValidateAndAddTodo({ title: quickInput.value })) {
            quickInput.value = '';
            refreshUI();
        }
    }
});

async function aValidateAndAddTodo(todo) {
    const valid = todo.title?.trim();
    if (valid) {
        let task = await aCreateTodo(todo);
        if (task !== null) {
            getActiveArray().push(task);
            _mapTask(task);
            console.log(task);
            return true;
        }
        else alert('Something went wrong');
    } else alert('Tittle missing');
    return false;
}

// on button click change app theme
btnTheme.addEventListener("click", () => {
    darkTheme = !darkTheme;
    localStorage.setItem(themeKey, darkTheme ? 'dark' : '');
    if (darkTheme) {
        appDiv.classList.add('dark');
        appDiv.classList.remove('light');
    }
    else {
        appDiv.classList.add('light');
        appDiv.classList.remove('dark');
    }
    btnTheme.innerHTML = darkTheme ? '<i class="theme material-icons">nightlight_round</i>' : '<i class="theme material-icons">wb_sunny</i>';
});

// on button click change online status
btnOnline.addEventListener("click", () => {
    toggleIsOnline();
    localStorage.setItem(onlineKey, getIsOnline() ? 'yep' : '');
    clearActiveArray();
    clearDoneArray();
    updateUI();
});

// on button click open overlay to add task
btnAdd.addEventListener("click", () => {
    showOverlay({}, true);
});