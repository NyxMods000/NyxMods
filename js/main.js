
/* =========================================
   NYXMODS - PROJECT CATALOG
   GitHub Dynamic Loader
========================================= */

const CONFIG = {
    owner: "nyxmods000",
    repo: "NyxMods",
    branch: "main",
    folder: "Scripts"
};

const API_URL =
    `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.folder}?ref=${CONFIG.branch}`;

const RAW_URL =
    `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}`;

const grid = document.getElementById("scriptGrid");
const searchInput = document.getElementById("scriptSearch");
const countElement = document.getElementById("scriptCount");
const noResults = document.getElementById("noResults");

let projects = [];
let activeFilter = "all";
let isLoading = false;


/* =========================================
   CATEGORIES
========================================= */

const CATEGORIES = {
    universal: {
        filter: "universal",
        label: "Universal"
    },

    juegos: {
        filter: "games",
        label: "Juegos"
    },

    herramientas: {
        filter: "tools",
        label: "Herramientas"
    }
};


/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", async () => {
    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    setupFilters();
    await loadProjects();
});


/* =========================================
   GITHUB FILE URL
========================================= */

function getFileURL(folder, filename) {
    return `${RAW_URL}/${CONFIG.folder}/${encodeURIComponent(folder)}/${filename}`;
}


/* =========================================
   FETCH TEXT
========================================= */

async function getText(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${url}`);
    }

    return response.text();
}


/* =========================================
   LOAD PROJECT
========================================= */

async function loadProject(folder) {
    const [
        title,
        description,
        category,
        tags,
        loader
    ] = await Promise.all([
        getText(getFileURL(folder, "title.txt")),
        getText(getFileURL(folder, "description.txt")),
        getText(getFileURL(folder, "categoria.txt")),
        getText(getFileURL(folder, "tags.txt")),
        getText(getFileURL(folder, "loader.lua"))
    ]);

    const categoryName = category.trim().toLowerCase();
    const categoryData = CATEGORIES[categoryName];

    if (!categoryData) {
        throw new Error(
            `Categoría inválida en "${folder}": ${categoryName}`
        );
    }

    const tagList = tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);

    return {
        folder,
        title: title.trim(),
        description: description.trim(),
        category: categoryData.filter,
        categoryName: categoryData.label,
        tags: tagList,
        loader: loader.trim()
    };
}


/* =========================================
   LOAD ALL PROJECTS
========================================= */

async function loadProjects() {
    if (isLoading) return;

    isLoading = true;

    try {
        if (grid) {
            grid.textContent = "Cargando proyectos...";
        }

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                `GitHub API respondió con HTTP ${response.status}`
            );
        }

        const directories = await response.json();

        if (!Array.isArray(directories)) {
            throw new Error("Respuesta inesperada de GitHub.");
        }

        const folders = directories.filter(item =>
            item.type === "dir"
        );

        const results = await Promise.allSettled(
            folders.map(folder => loadProject(folder.name))
        );

        projects = [];

        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                projects.push(result.value);
            } else {
                console.error(
                    `Error cargando ${folders[index].name}:`,
                    result.reason
                );
            }
        });

        renderProjects();

    } catch (error) {
        console.error("NyxMods - Error cargando proyectos:", error);

        if (grid) {
            grid.textContent =
                "No se pudieron cargar los proyectos. Inténtalo más tarde.";
        }

        if (countElement) {
            countElement.textContent = "Error al cargar";
        }

        if (noResults) {
            noResults.hidden = true;
        }

    } finally {
        isLoading = false;
    }
}


/* =========================================
   CREATE PROJECT CARD
========================================= */


function createProjectCard(project) {
    const card = document.createElement("article");

    card.className = "script-card";
    card.dataset.category = project.category;

    card.dataset.search = [
        project.title,
        project.description,
        project.categoryName,
        ...project.tags
    ].join(" ").toLowerCase();

    // Encabezado
    const header = document.createElement("div");
    header.className = "script-card-header";

    // Logo
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "script-card-icon";

    const image = document.createElement("img");
    image.src = getFileURL(project.folder, "target-image.png");
    image.alt = project.title;
    image.loading = "lazy";

    image.onerror = () => {
        image.remove();
        imageWrapper.classList.add("icon-fallback");
        imageWrapper.textContent = "N";
    };

    imageWrapper.appendChild(image);

    // Información
    const information = document.createElement("div");
    information.className = "script-card-info";

    const badges = document.createElement("div");
    badges.className = "script-card-badges";

    const status = document.createElement("span");
    status.className = "script-status-badge";
    status.textContent = "DISPONIBLE";

    const category = document.createElement("span");
    category.className = "script-category-badge";
    category.textContent = project.categoryName;

    badges.append(status, category);

    const title = document.createElement("h3");
    title.textContent = project.title;

    const subtitle = document.createElement("span");
    subtitle.className = "script-card-subtitle";
    subtitle.textContent = "NYXMODS PROJECT";

    information.append(badges, title, subtitle);

    // Icono decorativo
    const indicator = document.createElement("span");
    indicator.className = "script-card-indicator";
    indicator.textContent = "↗";

    header.append(imageWrapper, information, indicator);

    // Separador
    const divider = document.createElement("div");
    divider.className = "script-card-divider";

    // Descripción
    const description = document.createElement("p");
    description.className = "script-card-description";
    description.textContent = project.description;

    // Etiquetas
    const tags = document.createElement("div");
    tags.className = "script-tags";

    project.tags.forEach(tag => {
        const element = document.createElement("span");
        element.className = "script-tag";
        element.textContent = tag;
        tags.appendChild(element);
    });

    // Acciones
    const actions = document.createElement("div");
    actions.className = "script-actions";

    // Copiar
    const copyButton = document.createElement("button");
    copyButton.className = "copy-script-btn";
    copyButton.type = "button";

    const copyIcon = document.createElement("span");
    copyIcon.textContent = "▣";

    const copyText = document.createElement("span");
    copyText.textContent = "Copiar script";

    copyButton.append(copyIcon, copyText);

    copyButton.addEventListener("click", async () => {
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error("Clipboard API no disponible");
            }

            await navigator.clipboard.writeText(project.loader);

            copyText.textContent = "¡Copiado!";
            copyButton.classList.add("copied");

            setTimeout(() => {
                copyText.textContent = "Copiar script";
                copyButton.classList.remove("copied");
            }, 1800);

        } catch (error) {
            console.error("Error copiando loader:", error);

            copyText.textContent = "Error al copiar";

            setTimeout(() => {
                copyText.textContent = "Copiar script";
            }, 1800);
        }
    });

    // Más información
    const infoLink = document.createElement("a");
    infoLink.className = "more-info-btn";

    infoLink.href =
        `script.html?id=${encodeURIComponent(project.folder)}`;

    const infoText = document.createElement("span");
    infoText.textContent = "Más información";

    const infoIcon = document.createElement("span");
    infoIcon.textContent = "↗";

    infoLink.append(infoText, infoIcon);

    actions.append(copyButton, infoLink);

    // Construcción
    card.append(
        header,
        divider,
        description,
        tags,
        actions
    );

    return card;
}



/* =========================================
   RENDER PROJECTS
========================================= */

function renderProjects() {
    if (!grid) return;

    grid.replaceChildren();

    projects.forEach(project => {
        const card = createProjectCard(project);

        grid.appendChild(card);
    });

    filterProjects();
}


/* =========================================
   FILTER SETUP
========================================= */

function setupFilters() {
    document.querySelectorAll("[data-filter]").forEach(button => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter;

            document.querySelectorAll("[data-filter]").forEach(item => {
                item.classList.toggle(
                    "active",
                    item === button
                );
            });

            filterProjects();
        });
    });

    searchInput?.addEventListener(
        "input",
        filterProjects
    );
}


/* =========================================
   SEARCH AND FILTER
========================================= */

function filterProjects() {
    const query =
        searchInput?.value.toLowerCase().trim() || "";

    let visible = 0;

    document.querySelectorAll("#scriptGrid .script-card").forEach(card => {
        const matchesFilter =
            activeFilter === "all" ||
            card.dataset.category === activeFilter;

        const matchesSearch =
            card.dataset.search.includes(query);

        const show =
            matchesFilter && matchesSearch;

        card.hidden = !show;

        if (show) {
            visible++;
        }
    });


    /* COUNTER */

    if (countElement) {
        countElement.textContent =
            `${visible} proyecto${visible === 1 ? "" : "s"}`;
    }


    /* EMPTY STATE */

    if (noResults) {
        noResults.hidden = visible !== 0;
    }
}
