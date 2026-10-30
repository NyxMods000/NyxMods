
document.addEventListener("DOMContentLoaded", () => {

    // Año automático
    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // CATÁLOGO
    const searchInput = document.getElementById("scriptSearch");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const cards = document.querySelectorAll(".script-card");

    const count = document.getElementById("scriptCount");
    const noResults = document.getElementById("noResults");

    let activeFilter = "all";
    let searchQuery = "";

    function updateCatalog() {

        let visibleScripts = 0;
        let visibleCards = 0;

        cards.forEach(card => {

            const category = card.dataset.category;
            const searchData = (
                card.dataset.search + " " +
                card.textContent
            ).toLowerCase();

            const matchesCategory =
                activeFilter === "all" ||
                category === activeFilter;

            const matchesSearch =
                searchData.includes(searchQuery);

            const visible = matchesCategory && matchesSearch;

            card.hidden = !visible;

            if (visible) {
                visibleCards++;

                if (!card.classList.contains("coming-card")) {
                    visibleScripts++;
                }
            }

        });

        count.textContent =
            `${String(visibleScripts).padStart(2, "0")} SCRIPTS`;

        noResults.hidden = visibleCards !== 0;
    }

    // BUSCADOR
    if (searchInput) {

        searchInput.addEventListener("input", event => {

            searchQuery = event.target.value
                .trim()
                .toLowerCase();

            updateCatalog();

        });

    }

    // FILTROS
    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            filterButtons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            activeFilter = button.dataset.filter;

            updateCatalog();

        });

    });

    updateCatalog();

    console.log("NyxMods Catalog loaded 💜💚");

});
