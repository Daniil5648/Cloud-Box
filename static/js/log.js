const btnLogin = document.getElementById('btnLogin');
const checkBoxRM = document.getElementById('checkBoxRM');
const userName = document.getElementById('userName');
const password = document.getElementById('password');
const loginForm = document.querySelector('.login-form');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
}

function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleButton = passwordInput.parentNode.querySelector('.password-toggle');
    const eyeIcon = toggleButton.querySelector('.eye-icon');
    const eyeOffIcon = toggleButton.querySelector('.eye-off-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
    } 
    
    else {
        passwordInput.type = 'password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('/isUserLogin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(data.message);
            
            if (data.redirect_url) {
                window.location.href = data.redirect_url;
            }
        } 
        
        else {
            console.log('Пользователь не авторизован:', data.message);
        }
    })
    .catch((error) => {
        console.error('Ошибка проверки авторизации:', error);
    });
});

if (btnLogin) {
    btnLogin.addEventListener('click', function(e) {
        e.preventDefault();
        handleLogin();
    });
}

function handleLogin() {
    if (!userName.value.trim() || !password.value.trim()) {
        Swal.fire({
            title: "Постой!",
            text: "Заполните все поля",
            icon: "error",
            confirmButtonText: "Хорошо"
        });
        return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Вход...';

    fetch('/loginUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            user_name: userName.value.trim(),
            password: password.value,
            checkBoxRM: checkBoxRM.checked,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: "Поздравляем!",
                text: data.message,
                icon: "success",
                confirmButtonText: "Отлично!"
            })
            .then((result) => {
                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                }
            });
        } 
        
        else {
            Swal.fire({
                title: "Постой!",
                text: data.message,
                icon: "error",
                confirmButtonText: "Хорошо"
            });
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при входе",
            icon: "error",
            confirmButtonText: "Хорошо"
        });
    })
    .finally(() => {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Войти';
    });
}

if (userName && password) {
    userName.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    password.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
}