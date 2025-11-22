const userName = document.getElementById("userName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const termsCheckbox = document.getElementById("terms");
const btnRegister = document.getElementById("btnRegister");

const blockedCharacters = ['@', '!', '?', "'", "=", "+", "-", "*", "^", "$", "%", "#", "(", ")", "&"];
let passwordIsConfirm = false;

Swal.fire({
    title: "Внимание!",
    text: "Пароль должен содержать минимум 8 символов! Придумайте надежный пароль!",
    icon: "info",
    confirmButtonText: "Хорошо"
})

function updateRegisterButton() {
    const isFormValid = 
        userName.value.trim() !== "" &&
        email.value.trim() !== "" &&
        password.value.trim() !== "" &&
        confirmPassword.value.trim() !== "" &&
        passwordIsConfirm &&
        termsCheckbox.checked &&
        password.value.length >= 8;

    btnRegister.disabled = !isFormValid;
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

confirmPassword.addEventListener('input', function() {
    const passwordValue = password.value;
    const confirmPasswordValue = this.value;
    
    if (passwordValue !== confirmPasswordValue && confirmPasswordValue !== '') {
        this.style.boxShadow = '0 0 0 2px #d4183d';

        passwordIsConfirm = false;
    } 
    
    else {
        this.style.boxShadow = '';

        passwordIsConfirm = true;
    }

    updateRegisterButton();
});

userName.addEventListener('input', updateRegisterButton);
email.addEventListener('input', updateRegisterButton);
password.addEventListener('input', updateRegisterButton);
confirmPassword.addEventListener('input', updateRegisterButton);
termsCheckbox.addEventListener('change', updateRegisterButton);

btnRegister.addEventListener('click', function(event) {
    event.preventDefault();
    
    let flagBlockCharacters = false;

    for (let i of userName.value) {
        if (blockedCharacters.includes(i)) {
            flagBlockCharacters = true;

            break;
        }
    }

    if (flagBlockCharacters) {
        Swal.fire({
            title: "Постой!",
            text: "В имени пользователя не должно быть спец символов кроме '_'",
            icon: "error",
            confirmButtonText: "Хорошо"
        });

        return;
    }

    if (password.value.length < 8) {
        Swal.fire({
            title: "Постой!",
            text: "Пароль должен быть более чем 8 символов",
            icon: "error",
            confirmButtonText: "Хорошо"
        });

        return;
    }

    if (!passwordIsConfirm) {
        Swal.fire({
            title: "Постой!",
            text: "Пароли не совпадают",
            icon: "error",
            confirmButtonText: "Хорошо"
        });

        return;
    }

    if (!termsCheckbox.checked) {
        Swal.fire({
            title: "Постой!",
            text: "Необходимо согласиться с условиями использования",
            icon: "error",
            confirmButtonText: "Хорошо"
        });

        return;
    }

    fetch('/registrationUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_name: userName.value,
            email: email.value,
            password: password.value,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: "Успех!",
                text: data.message,
                icon: "success",
                confirmButtonText: "Отлично"
            })
            .then((result) => {
                window.location.href = data.redirect_url;
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
            text: "Произошла ошибка при регистрации",
            icon: "error",
            confirmButtonText: "Хорошо"
        });
    });
});

updateRegisterButton();