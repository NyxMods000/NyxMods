
document.addEventListener("DOMContentLoaded", () => {

    // Año automático del footer
    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    console.log("NyxMods initialized 💜💚");

});
