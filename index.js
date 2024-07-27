document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-name');
    const taskPriority = document.getElementById('task-priority');
    const addTaskBtn = document.getElementById('add-task-btn');

    // Função para salvar as tarefas diárias no localStorage
    function saveTasks() {
        const tasks = Array.from(document.querySelectorAll('#tasks li')).map(taskItem => {
            return {
                name: taskItem.querySelector('span').textContent,
                priority: taskItem.classList[0],
                completed: taskItem.classList.contains('completed')
            };
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Função para salvar as tarefas semanais no localStorage
    function saveWeeklyTasks() {
        const weeklyTasks = {};
        document.querySelectorAll('.weekly-tasks .day').forEach(day => {
            const dayName = day.dataset.day.toLowerCase();
            weeklyTasks[dayName] = Array.from(day.querySelectorAll('li')).map(taskItem => {
                return {
                    name: taskItem.querySelector('span').textContent,
                    completed: taskItem.classList.contains('completed')
                };
            });
        });
        localStorage.setItem('weeklyTasks', JSON.stringify(weeklyTasks));
    }

    // Função para carregar as tarefas diárias do localStorage
    function loadTasks() {
        const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        savedTasks.forEach(task => {
            addTask(task.name, task.priority, task.completed);
        });
    }

    // Função para carregar as tarefas semanais do localStorage
    function loadWeeklyTasks() {
        const savedWeeklyTasks = JSON.parse(localStorage.getItem('weeklyTasks')) || {};
        for (const [day, tasks] of Object.entries(savedWeeklyTasks)) {
            tasks.forEach(task => {
                addWeeklyTask(day.charAt(0).toUpperCase() + day.slice(1), task.name, task.completed);
            });
        }
    }

    // Função para criar um elemento de tarefa
    function createTaskElement(name, priority, completed = false, isWeekly = false) {
        const taskItem = document.createElement('li');
        if (priority) taskItem.classList.add(priority);
        if (completed) taskItem.classList.add('completed');
        taskItem.draggable = true;

        const taskContent = document.createElement('span');
        taskContent.textContent = name;

        const taskActions = document.createElement('div');
        taskActions.classList.add('task-actions');

        // Adiciona o botão "Complete" apenas se for uma tarefa semanal
        if (isWeekly) {
            const completeBtn = document.createElement('button');
            completeBtn.textContent = 'Complete';
            completeBtn.classList.add('complete');
            completeBtn.addEventListener('click', () => {
                taskItem.classList.toggle('completed');
                saveTasks();
                saveWeeklyTasks();
            });
            taskActions.appendChild(completeBtn);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete');
        deleteBtn.addEventListener('click', () => {
            taskItem.remove();
            saveTasks();
            saveWeeklyTasks();
        });

        taskActions.appendChild(deleteBtn);
        taskItem.appendChild(taskContent);
        taskItem.appendChild(taskActions);

        return taskItem;
    }

    // Função para adicionar uma tarefa diária
    function addTask(name, priority, completed = false) {
        const taskItem = createTaskElement(name, priority, completed, false);
        document.getElementById('tasks').appendChild(taskItem);

        // Eventos de arrastar e soltar
        taskItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', name);
            e.dataTransfer.effectAllowed = 'move';
            taskItem.classList.add('dragging');
        });

        taskItem.addEventListener('dragend', () => {
            taskItem.classList.remove('dragging');
        });
    }

    // Função para adicionar uma tarefa semanal
    function addWeeklyTask(day, taskName, completed = false) {
        const tasksList = document.getElementById(`tasks-${day.toLowerCase()}`);
        const taskItem = createTaskElement(taskName, '', completed, true);
        tasksList.appendChild(taskItem);

        // Eventos de arrastar e soltar
        taskItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', taskName);
            e.dataTransfer.effectAllowed = 'move';
            taskItem.classList.add('dragging');
        });

        taskItem.addEventListener('dragend', () => {
            taskItem.classList.remove('dragging');
        });
    }

    // Evento de clique para adicionar uma nova tarefa diária
    addTaskBtn.addEventListener('click', () => {
        const taskName = taskInput.value.trim();
        const priority = taskPriority.value;

        if (taskName) {
            addTask(taskName, priority);
            taskInput.value = '';
            saveTasks();
        }
    });

    // Evento de tecla para adicionar uma nova tarefa diária ao pressionar Enter
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const taskName = taskInput.value.trim();
            const priority = taskPriority.value;

            if (taskName) {
                addTask(taskName, priority);
                taskInput.value = '';
                saveTasks();
            }
        }
    });

    // Eventos de tecla para adicionar uma nova tarefa semanal ao pressionar Enter
    document.querySelectorAll('.weekly-tasks .day input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const taskName = e.target.value.trim();
                if (taskName) {
                    const dayContainer = e.target.closest('.day');
                    addWeeklyTask(dayContainer.dataset.day, taskName);
                    e.target.value = '';
                    saveWeeklyTasks();
                }
            }
        });
    });

    // Eventos de clique para adicionar uma nova tarefa semanal
    document.querySelectorAll('.weekly-tasks .day button').forEach(button => {
        button.addEventListener('click', event => {
            const dayContainer = event.target.closest('.day');
            const input = dayContainer.querySelector('input');
            const taskName = input.value.trim();
            if (taskName) {
                addWeeklyTask(dayContainer.dataset.day, taskName);
                input.value = '';
                saveWeeklyTasks();
            }
        });
    });

    // Eventos de arrastar e soltar para a área de tarefas semanais
    document.querySelectorAll('.weekly-tasks .day').forEach(day => {
        day.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            if (draggingItem) {
                day.classList.add('drag-over');
            }
        });

        day.addEventListener('dragleave', () => {
            day.classList.remove('drag-over');
        });

        day.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            if (draggingItem) {
                day.querySelector('ul').appendChild(draggingItem);
                day.classList.remove('drag-over');
                saveWeeklyTasks();
            }
        });
    });

    // Carregar tarefas ao iniciar a página
    loadTasks();
    loadWeeklyTasks();
});
