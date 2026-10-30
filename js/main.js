
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


    /* IMAGE BANNER */

    const banner = document.createElement("div");
    banner.className = "script-card-banner";

    const image = document.createElement("img");

    image.src = getFileURL(
        project.folder,
        "target-image.png"
    );

    image.alt = project.title;
    image.className = "script-card-image";
    image.loading = "lazy";

    image.onerror = () => {
        image.remove();
        banner.classList.add("no-image");
    };


    /* IMAGE OVERLAY */

    const overlay = document.createElement("div");
    overlay.className = "script-card-overlay";


    /* CATEGORY */

    const category = document.createElement("span");

    category.className = "script-category-badge";
    category.textContent = project.categoryName;


    /* STATUS */

    const status = document.createElement("span");

    status.className = "script-status-badge";

    const statusDot = document.createElement("span");

    status.append(statusDot, document.createTextNode(" DISPONIBLE"));


    banner.append(
        image,
        overlay,
        category,
        status
    );


    /* CONTENT */

    const content = document.createElement("div");

    content.className = "script-card-content";


    /* HEADING */

    const heading = document.createElement("div");

    heading.className = "script-card-heading";

    const title = document.createElement("h3");

    title.textContent = project.title;

    heading.appendChild(title);


    /* DESCRIPTION */

    const description = document.createElement("p");

    description.textContent = project.description;


    content.append(
        heading,
        description
    );


    /* TAGS */

    if (project.tags.length > 0) {
        const tags = document.createElement("div");

        tags.className = "script-tags";

        project.tags.forEach(tag => {
            const element = document.createElement("span");

            element.className = "script-tag";
            element.textContent = tag;

            tags.appendChild(element);
        });

        content.appendChild(tags);
    }


    /* DIVIDER */

    const divider = document.createElement("div");

    divider.className = "script-card-divider";


    /* ACTIONS */

    const actions = document.createElement("div");

    actions.className = "script-actions";


    /* COPY BUTTON */

    const copyButton = document.createElement("button");

    copyButton.className = "copy-script-btn";
    copyButton.type = "button";
    copyButton.textContent = "Copiar script";

    copyButton.addEventListener("click", async () => {
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error("Clipboard API no disponible.");
            }

            await navigator.clipboard.writeText(project.loader);

            copyButton.textContent = "¡Copiado!";
            copyButton.classList.add("copied");

            setTimeout(() => {
                copyButton.textContent = "Copiar script";
                copyButton.classList.remove("copied");
            }, 1800);

        } catch (error) {
            console.error("Error copiando loader:", error);

            copyButton.textContent = "Error al copiar";

            setTimeout(() => {
                copyButton.textContent = "Copiar script";
            }, 1800);
        }
    });


    /* MORE INFORMATION */

    const infoLink = document.createElement("a");

    infoLink.className = "more-info-btn";
    infoLink.textContent = "Más información";

    infoLink.href =
        `script.html?id=${encodeURIComponent(project.folder)}`;

    const arrow = document.createElement("span");

    arrow.textContent = "↗";

    infoLink.appendChild(arrow);


    /* BUILD ACTIONS */

    actions.append(
        copyButton,
        infoLink
    );

    content.append(
        divider,
        actions
    );

    card.append(
        banner,
        content
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
