const showUser_name = document.getElementById('getUser_name');
const verifityDiv = document.getElementById('verifityDiv');
const mainContent = document.getElementById('mainContent');
const verfityEmailBtn = document.getElementById('verfityEmail');
const checkCodeBtn = document.getElementById('checkCode');
const codeInput = document.getElementById('codeInput');
const getMyEmailBtn = document.getElementById('getMyEmail');
const getMyAPIBtn = document.getElementById('getMyAPI');
const btnUpload = document.getElementById('btnUpload');
const btnLogout = document.getElementById('btnLogout');
const filesContainer = document.getElementById('filesList');
const filesCount = document.getElementById('filesCount');
const spanSubscription = document.getElementById('span-subscription');
const usageDisk = document.getElementById('usage-disk');

function loadUserFiles() {
    fetch('/userFiles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {    
        if (!data.success) {
            console.error('Ошибка загрузки файлов:', data.error);
            renderFiles([]);

            return;
        }

        let files = [];
        
        if (Array.isArray(data.files)) {
            files = data.files.map(fileName => ({ 
                name: fileName,
            }));
        }
        
        else if (typeof data.files === 'object' && data.files !== null) {
            files = Object.keys(data.files).map(key => ({
                name: key,
            }));
        }
        
        else if (data.files) {
            files = [{
                name: data.files,
            }];
        }
    
        renderFiles(files);
    })
    .catch(error => {
        console.error('Ошибка загрузки файлов:', error);
        renderFiles([]);
    });
}

function updateSizeCloud() {
    fetch('/storageInfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            usageDisk.textContent = `${data.storage_info.total_size}`;
        } 
        
        else {
            Swal.fire({
                title: "FATAL ERROR!",
                text: data.message,
                icon: "info",
                confirmButtonText: "OK"
            })
        }
    })
    .catch(error => {
        console.error('Ошибка получения информации о пользователе:', error);
    });
}

function renderFiles(files) { 
    filesContainer.innerHTML = '';
    
    if (!files || files.length === 0) {
        filesContainer.innerHTML = `
            <div class="empty-state">
                <div class="icon">📁</div>
                <h3>Файлов пока нет</h3>
                <p>Загрузите первый файл в ваше облако</p>
            </div>
        `;

        if (filesCount) filesCount.textContent = '0';

        return;
    }
    
    if (filesCount) filesCount.textContent = files.length;
    
    files.forEach((file) => {
        const fileElement = createFileElement(file);
        filesContainer.appendChild(fileElement);
    });
}

function createFileElement(file) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-item';
    
    const fileIcon = getFileIcon(file);
    const fileName = typeof file === 'string' ? file : file.name;
    
    const safeFileName = fileName.replace(/'/g, "\\'");
    
    fileDiv.innerHTML = `
        <div class="file-icon">${fileIcon}</div>
        <div class="file-info">
            <div class="file-name">${fileName}</div>
        </div>
        <div class="file-actions">
            <button class="action-btn download" onclick="downloadFile('${safeFileName}')" title="Скачать">💾</button>
            <button class="action-btn delete" onclick="deleteFile('${safeFileName}')" title="Удалить">🗑️</button>
        </div>
    `;
    
    return fileDiv;
}

function getFileIcon(file) {
    const fileName = typeof file === 'string' ? file : file.name;
    const name = fileName.toLowerCase();
    
    if (name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) return '🖼️';
    if (name.match(/\.(pdf)$/)) return '📄';
    if (name.match(/\.(doc|docx)$/)) return '📝';
    if (name.match(/\.(xls|xlsx|csv)$/)) return '📊';
    if (name.match(/\.(zip|rar|7z|tar|gz)$/)) return '📦';
    if (name.match(/\.(mp4|avi|mov|mkv|wmv|flv)$/)) return '🎥';
    if (name.match(/\.(mp3|wav|ogg|flac)$/)) return '🎵';
    if (name.match(/\.(txt|rtf)$/)) return '📃';
    if (name.match(/\.(ppt|pptx)$/)) return '📽️';
    
    return '📁';
}

function downloadFile(filename) {
    Swal.fire({
        title: 'Подготовка скачивания',
        text: `Подготавливаем файл "${filename}"...`,
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    fetch('/downloadFile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ filename: filename })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message);
            });
        }
        return response.blob();
    })
    .then(blob => {
        Swal.close();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        Swal.fire({
            title: 'Успех!',
            text: `Файл "${filename}" успешно скачан`,
            icon: 'success',
            confirmButtonText: 'OK'
        });
    })
    .catch(error => {
        Swal.fire({
            title: 'Ошибка!',
            text: `Не удалось скачать файл: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    });
}

function deleteFile(filename) {
    Swal.fire({
        title: 'Удаление файла',
        html: `Вы уверены, что хотите удалить файл <strong>"${filename}"</strong>?<br><br>Это действие нельзя отменить.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Да, удалить!',
        cancelButtonText: 'Отмена',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            return fetch('/deleteFile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ filename: filename })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    throw new Error(data.message);
                }
                
                return data;
            })
            .catch(error => {
                Swal.showValidationMessage(`Ошибка: ${error.message}`);
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    })
    .then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Удалено!',
                text: `Файл "${filename}" успешно удален`,
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                loadUserFiles();
                updateSizeCloud();
            });
        }
    });
}

window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        location.reload();
    }
});

fetch('/thisUserVerifity', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    credentials: 'include'
})
.then(response => response.json())
.then(data => {
    if (data.success && data.needCode === false) {
        if (mainContent) mainContent.style.display = 'block';
        if (verifityDiv) verifityDiv.style.display = 'none';

        loadUserFiles();
    } 
    
    else if (data.success && data.needCode) {
        if (mainContent) mainContent.style.display = 'none';
        if (verifityDiv) verifityDiv.style.display = 'flex';
    } 
    
    else {
        Swal.fire({
            title: "Ошибка!",
            text: data.message || "Произошла ошибка",
            icon: "error",
            confirmButtonText: "Хорошо"
        });
    }
})
.catch(error => {
    console.error('Ошибка проверки верификации:', error);
    Swal.fire({
        title: "Ошибка!",
        text: "Не удалось проверить статус верификации",
        icon: "error",
        confirmButtonText: "Хорошо"
    });
});

updateSizeCloud();

fetch('/whoIsThis', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    credentials: 'include'
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        showUser_name.textContent = data.user_name;
    } 
    
    else {
        Swal.fire({
            title: "Постой!",
            text: data.message,
            icon: "info",
            confirmButtonText: "Авторизоваться"
        })
        .then((result) => {
            window.location.href = data.redirect_url;
        });
    }
})
.catch(error => {
    console.error('Ошибка получения информации о пользователе:', error);
});

fetch('/subscriptionInfo', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    credentials: 'include'
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        spanSubscription.textContent = `${data.subscription_info.plan}`;
    } 
    
    else {
        Swal.fire({
            title: "FATAL ERROR!",
            text: data.message,
            icon: "info",
            confirmButtonText: "OK"
        })
    }
})
.catch(error => {
    console.error('Ошибка получения информации о пользователе:', error);
});

verfityEmailBtn.addEventListener('click', function(){
    fetch('/verifityAccount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: "Внимание!",
                text: data.message,
                icon: "info",
                confirmButtonText: "Хорошо"
            })
        }

        else {
            Swal.fire({
                title: "Ошибка!",
                text: data.message,
                icon: "error",
                confirmButtonText: "Хорошо"
            })
        }
    })
    .catch(error => {
        console.error('Ошибка отправки кода:', error);
        Swal.fire({
            title: "Ошибка!",
            text: "Не удалось отправить код",
            icon: "error",
            confirmButtonText: "Хорошо"
        });
    });
});

checkCodeBtn.addEventListener('click', function(){
    if (!codeInput.value) {
        Swal.fire({
            title: "Ошибка!",
            text: "Введите код подтверждения",
            icon: "error",
            confirmButtonText: "Хорошо"
        });

        return;
    }

    fetch('/checkCode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            codeInput: codeInput.value,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: "Поздравляем!",
                text: data.message,
                icon: "success",
                confirmButtonText: "Отлично"
            })
            .then((result) => {
                location.reload();
            });
        }

        else {
            Swal.fire({
                title: "Ошибка!",
                text: data.message,
                icon: "error",
                confirmButtonText: "Хорошо"
            })
        }
    })
    .catch(error => {
        console.error('Ошибка проверки кода:', error);
        Swal.fire({
            title: "Ошибка!",
            text: "Не удалось проверить код",
            icon: "error",
            confirmButtonText: "Хорошо"
        });
    });
});

btnUpload.addEventListener('click', function(){
    let fileInput = document.getElementById('fileInput');
    let file = fileInput.files[0];

    if (!file) {
        Swal.fire({
            title: "Ошибка!",
            text: "Выберите файл",
            icon: "error",
            confirmButtonText: "Хорошо"
        })

        return;
    }

    let formData = new FormData();
    formData.append("file", file);

    fetch('/uploadFile', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: "Успех!",
                text: data.message,
                icon: "success",
                confirmButtonText: "Отлично"
            }).then(() => {
                loadUserFiles();
                updateSizeCloud();
                fileInput.value = '';
            });
        }

        else {
            Swal.fire({
                title: "Ошибка!",
                text: "Ошибка при загрузке! Не допустимый формат файла!",
                icon: "error",
                confirmButtonText: "Хорошо"
            });
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки:', error);
        Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при загрузке",
            icon: "error",
            confirmButtonText: "Хорошо"
        });
    });
});

getMyEmailBtn.addEventListener('click', function(){
    fetch('/getMyEmail', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: "Ваша почта",
                text: data.message,
                icon: "info",
                confirmButtonText: "Хорошо"
            })
        }

        else {
            Swal.fire({
                title: "Ошибка!",
                text: data.message,
                icon: "error",
                confirmButtonText: "Хорошо"
            })
        }
    })
    .catch(error => {
        console.error('Ошибка получения email:', error);
        Swal.fire({
            title: "Ошибка!",
            text: "Не удалось получить email",
            icon: "error",
            confirmButtonText: "Хорошо"
        });
    });
});

getMyAPIBtn.addEventListener('click', function(){
    fetch('/getMyAPI', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: "Ваш API ключ",
                text: data.message,
                icon: "info",
                confirmButtonText: "Хорошо"
            })
        }
        
        else {
            Swal.fire({
                title: "Ошибка!",
                text: data.message,
                icon: "error",
                confirmButtonText: "Хорошо"
            })
        }
    })
    .catch(error => {
        console.error('Ошибка получения API:', error);
        Swal.fire({
            title: "Ошибка!",
            text: "Не удалось получить API ключ",
            icon: "error",
            confirmButtonText: "Хорошо"
        });
    });
});

btnLogout.addEventListener('click', function(){
    fetch('/btnLogout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            Swal.fire({
                title: "Вы вышли из профиля",
                text: data.message,
                icon: "info",
                confirmButtonText: "Хорошо"
            }).then(() => {
                window.location.href = "/";
            });
        }

        else {
            Swal.fire({
                title: "Ошибка!",
                text: data.message,
                icon: "error",
                confirmButtonText: "Хорошо"
            })
        }
    })
    .catch(error => {
        console.error('Ошибка выхода:', error);
        Swal.fire({
            title: "Ошибка!",
            text: "Не удалось выйти из профиля",
            icon: "error",
            confirmButtonText: "Хорошо"
        });
    });
});