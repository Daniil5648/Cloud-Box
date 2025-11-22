const elements = document.querySelectorAll('.floating-element');

elements.forEach(element => {
    element.style.animationDelay = Math.random() * 2 + 's';
});