document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-name');
    const taskPriority = document.getElementById('task-priority');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const editalSelect = document.getElementById('edital-select');

    // Configuração do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyCPpZ8s7gBTVYcmz78hMX0XqXHsHNMx0x8",
        authDomain: "study-rm.firebaseapp.com",
        projectId: "study-rm",
        storageBucket: "study-rm.appspot.com",
        messagingSenderId: "466457514347",
        appId: "1:466457514347:web:82d72759a048e1cea23c2e",
        measurementId: "G-3TRGS18QQJ"
    };

    // Inicializa o Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Função para criar a estrutura do Firestore
    async function createFirestoreStructure(userId) {
        try {
            const userDoc = db.collection('users').doc(userId);
            
            await userDoc.set({
                name: "Nome do usuário",
                email: "email@example.com",
                createdAt: new Date(),
            }, { merge: true });

            await userDoc.collection('dailyTasks').doc('tasks').set({ tasks: [] });
            await userDoc.collection('weeklyTasks').doc('tasks').set({ weeklyTasks: {} });
            await userDoc.collection('editais').doc('list').set({ editais: {} }); // Para armazenar os editais

            console.log('Estrutura do Firestore criada com sucesso.');
        } catch (error) {
            console.error('Erro ao criar estrutura no Firestore:', error);
        }
    }

    // Função para criar um elemento de tarefa
    function createTaskElement(name, priority, completed = false, isEditable = false) {
        const taskItem = document.createElement('li');
        if (priority) taskItem.classList.add(priority);
        if (completed) taskItem.classList.add('completed');
        taskItem.draggable = true;

        const taskContent = document.createElement('span');
        taskContent.textContent = name;

        const taskActions = document.createElement('div');
        taskActions.classList.add('task-actions');

        if (isEditable) {
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

    // Função para adicionar uma tarefa à lista de tarefas diárias
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

    // Função para adicionar uma tarefa à lista de tarefas semanais
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

    // Função para atualizar a posição das tarefas
    function updateTaskPositions() {
        saveTasks();
        saveWeeklyTasks();
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
        input.setAttribute('name', `weekly-task-${input.parentElement.dataset.day.toLowerCase()}`); // Adiciona name aos inputs
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const taskName = input.value.trim();
                const day = input.parentElement.dataset.day;

                if (taskName) {
                    addWeeklyTask(day, taskName);
                    input.value = '';
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
                updateTaskPositions();
            }
        });
    });

    // Função para criar um elemento de tarefa interativo
    function createEditableTaskElement(name) {
        const taskItem = createTaskElement(name, '', false, true);
        taskItem.classList.add('editable-task');

        taskItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', name);
            e.dataTransfer.effectAllowed = 'move';
            taskItem.classList.add('dragging');
        });

        taskItem.addEventListener('dragend', () => {
            taskItem.classList.remove('dragging');
        });

        return taskItem;
    }

    // Atualiza a lista de editais para tornar os temas arrastáveis
    const editais = {
        "Edital TJ-SP 2024": [],
        "enem": [
            "Matemática - Funções",
            "Matemática - Estatística",
            "Português - Leitura e Interpretação",
            "Química - Tabelas Periódicas",
            "Biologia - Ecologia",
            "Física - Cinemática"
        ]
    };

    function updateEditaisList() {
        const selecionado = editalSelect.value;
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

        if (editais[selecionado]) {
            editais[selecionado].forEach(task => {
                taskList.appendChild(createEditableTaskElement(task));
            });
        }
    }

    editalSelect.addEventListener('change', updateEditaisList);

    // Função para salvar os editais no Firestore
    async function saveEditais() {
        const editaisData = {};
        Object.entries(editais).forEach(([key, value]) => {
            editaisData[key] = value;
        });

        try {
            const userId = firebase.auth().currentUser.uid;
            await db.collection('users').doc(userId).collection('editais').doc('list').set({ editais: editaisData });
            console.log('Editais salvos com sucesso.');
        } catch (error) {
            console.error('Erro ao salvar editais:', error);
        }
    }

    // Função para carregar as tarefas e editais do Firestore
    async function loadTasksAndEditais() {
        try {
            const userId = firebase.auth().currentUser.uid;

            // Carregar as tarefas diárias
            const dailyTasksDoc = await db.collection('users').doc(userId).collection('dailyTasks').doc('tasks').get();
            if (dailyTasksDoc.exists) {
                const data = dailyTasksDoc.data().tasks;
                data.forEach(({ name, priority, completed }) => {
                    addTask(name, priority, completed);
                });
            }

            // Carregar as tarefas semanais
            const weeklyTasksDoc = await db.collection('users').doc(userId).collection('weeklyTasks').doc('tasks').get();
            if (weeklyTasksDoc.exists) {
                const weeklyData = weeklyTasksDoc.data().weeklyTasks;
                Object.entries(weeklyData).forEach(([day, tasks]) => {
                    tasks.forEach(({ name, completed }) => {
                        addWeeklyTask(day, name, completed);
                    });
                });
            }

            // Carregar os editais
            const editaisDoc = await db.collection('users').doc(userId).collection('editais').doc('list').get();
            if (editaisDoc.exists) {
                const data = editaisDoc.data().editais;
                Object.entries(data).forEach(([key, tasks]) => {
                    editais[key] = tasks;
                });
                updateEditaisList();
            }

            console.log('Tarefas e editais carregados com sucesso.');
        } catch (error) {
            console.error('Erro ao carregar tarefas e editais:', error);
        }
    }

    // Função para salvar tarefas diárias no Firestore
    async function saveTasks() {
        const tasks = [];
        document.querySelectorAll('#tasks li').forEach(taskItem => {
            tasks.push({
                name: taskItem.querySelector('span').textContent,
                priority: taskItem.classList.contains('high-priority') ? 'high-priority' : 'normal-priority',
                completed: taskItem.classList.contains('completed'),
            });
        });

        try {
            const userId = firebase.auth().currentUser.uid;
            await db.collection('users').doc(userId).collection('dailyTasks').doc('tasks').set({ tasks });
            console.log('Tarefas diárias salvas com sucesso.');
        } catch (error) {
            console.error('Erro ao salvar tarefas diárias:', error);
        }
    }

    // Função para salvar tarefas semanais no Firestore
    async function saveWeeklyTasks() {
        const weeklyTasks = {};

        document.querySelectorAll('.weekly-tasks .day').forEach(dayContainer => {
            const dayName = dayContainer.dataset.day.toLowerCase();
            weeklyTasks[dayName] = [];

            dayContainer.querySelectorAll('li').forEach(taskItem => {
                weeklyTasks[dayName].push({
                    name: taskItem.querySelector('span').textContent,
                    completed: taskItem.classList.contains('completed'),
                });
            });
        });

        try {
            const userId = firebase.auth().currentUser.uid;
            await db.collection('users').doc(userId).collection('weeklyTasks').doc('tasks').set({ weeklyTasks });
            console.log('Tarefas semanais salvas com sucesso.');
        } catch (error) {
            console.error('Erro ao salvar tarefas semanais:', error);
        }
    }

    // Carregar tarefas e editais ao carregar a página
    auth.onAuthStateChanged((user) => {
        if (user) {
            loadTasksAndEditais();
        } else {
            // Redirecionar ou solicitar login se o usuário não estiver logado
        }
    });
});

// Função para rolar a tela automaticamente
function autoScroll(e) {
    const draggingItem = document.querySelector('.dragging');
    const { clientY, clientX } = e;

    // Calcular a posição do item arrastado
    const { top, bottom } = draggingItem.getBoundingClientRect();
    const { innerHeight, innerWidth } = window;

    // Verifica se a posição está perto do topo ou fundo da tela
    if (clientY < 100) {
        window.scrollBy(0, -10); // Rola para cima
    } else if (clientY > innerHeight - 100) {
        window.scrollBy(0, 10); // Rola para baixo
    }
    if (clientX < 100) {
        window.scrollBy(-10, 0); // Rola para a esquerda
    } else if (clientX > innerWidth - 100) {
        window.scrollBy(10, 0); // Rola para a direita
    }
}

// Adicionar eventos de rolagem ao documento durante o arrasto
document.addEventListener('dragover', autoScroll);

// Adicionar um evento para parar de rolar quando o arrasto termina
document.addEventListener('dragend', () => {
    window.scrollBy(0, 0); // Parar de rolar
});
