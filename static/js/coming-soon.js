const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');

let progress = 0;

const interval = setInterval(() => {
    progress += Math.random() * 10;

    if (progress >= 100) {
        progress = 100;

        clearInterval(interval);
        progressText.textContent = 'Почти готово!';
    } 
    
    else {
        progressFill.style.width = progress + '%';
        progressText.textContent = `Загрузка... ${Math.round(progress)}%`;
    }
}, 300);