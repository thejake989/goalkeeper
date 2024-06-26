document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const goalContainer = document.getElementById('goal-container');
    const authContainer = document.getElementById('auth-container');

    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const showRegisterButton = document.getElementById('show-register');
    const showLoginButton = document.getElementById('show-login');

    const goalInput = document.getElementById('new-goal');
    const addGoalButton = document.getElementById('add-goal');
    const goalList = document.getElementById('goal-list');
    const completedGoalList = document.getElementById('completed-goal-list');

    showRegisterButton.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    showLoginButton.addEventListener('click', () => {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    loginButton.addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            loadGoals();
            authContainer.classList.add('hidden');
            goalContainer.classList.remove('hidden');
        } else {
            alert(data.message);
        }
    });

    registerButton.addEventListener('click', async () => {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.message === 'User registered') {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        } else {
            alert(data.message);
        }
    });

    addGoalButton.addEventListener('click', async () => {
        const goalText = goalInput.value.trim();
        if (goalText === '') {
            alert('Goal text cannot be empty');
            return;
        }
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text: goalText })
        });
        const goals = await response.json();
        renderGoals(goals);
        goalInput.value = '';
    });

    async function loadGoals() {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/goals', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const goals = await response.json();
        renderGoals(goals);
    }

    function renderGoals(goals) {
        goalList.innerHTML = '';
        completedGoalList.innerHTML = '';
        goals.forEach(goal => {
            if (goal.completed) {
                const completedLi = document.createElement('li');
                completedLi.className = 'flex items-center justify-between bg-gray-300 p-2 mb-2 rounded';
                const goalText = document.createElement('span');
                goalText.className = 'flex-grow';
                goalText.textContent = `${goal.text} - Completed on: ${new Date(goal.dateCompleted).toLocaleString()}`;
                completedLi.appendChild(goalText);
                completedGoalList.appendChild(completedLi);
            } else {
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between bg-gray-200 p-2 mb-2 rounded';
                const goalText = document.createElement('span');
                goalText.className = 'flex-grow';
                goalText.textContent = goal.text;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'mr-2';
                checkbox.checked = goal.completed;
                checkbox.addEventListener('change', async () => {
                    completeGoal(goal._id, goal.text);
                });

                const noteButton = document.createElement('button');
                noteButton.textContent = 'Add Note';
                noteButton.className = 'bg-green-500 text-white px-2 py-1 rounded hover:bg-green-700 ml-2';
                noteButton.addEventListener('click', async () => {
                    const note = prompt('Enter your note:');
                    if (note) {
                        await addNoteToGoal(goal._id, note);
                    }
                });

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Complete';
                deleteButton.className = 'bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700 ml-2';
                deleteButton.addEventListener('click', async () => {
                    completeGoal(goal._id, goal.text);
                });

                li.appendChild(checkbox);
                li.appendChild(goalText);
                li.appendChild(noteButton);
                li.appendChild(deleteButton);
                goalList.appendChild(li);
            }
        });
    }

    async function completeGoal(goalId, text) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/goals/${goalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completed: true, dateCompleted: new Date().toISOString() })
        });
        const goals = await response.json();
        renderGoals(goals);
    }

    async function addNoteToGoal(goalId, note) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/goals/${goalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ note })
        });
        const goals = await response.json();
        renderGoals(goals);
    }

    if (localStorage.getItem('token')) {
        loadGoals();
        authContainer.classList.add('hidden');
        goalContainer.classList.remove('hidden');
    }
});
