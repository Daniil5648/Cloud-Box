const div_features = document.querySelector('.features-grid');

function showFeaturesOverview() {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        window.scrollTo({
           top: div_features.offsetTop - 350,
           behavior: 'smooth' 
        });
    }

    else {
        window.scrollTo({
            top: div_features.offsetTop - 295,
            behavior: 'smooth'
        });
    }
}