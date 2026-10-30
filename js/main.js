
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

// Categorías permitidas
const CATEGORIES = {
    "universal": {
        filter: "universal",
        label: "Universal"
    },

    "juegos": {
        filter: "games",
        label: "Juegos"
    },

    "herramientas": {
        filter: "tools",
        label: "Herramientas"
    }
};

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    setupFilters();
    await loadProjects();
});

// Construir URL de archivos
function getFileURL(folder, filename) {
    return `${RAW_URL}/${CONFIG.folder}/${encodeURIComponent(folder)}/${filename}`;
}

// Obtener contenido de un archivo
async function getText(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${url}`);
    }

    return response.text();
}

// Cargar información de un proyecto
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

    const categoryName = category.trim();
    const normalizedCategory = categoryName.toLowerCase();

    const categoryData = CATEGORIES[normalizedCategory];

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

// Obtener todos los proyectos de GitHub
async function loadProjects() {
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
    }
}

// Crear tarjeta de proyecto
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

    // Imagen
    const image = document.createElement("img");

    image.src = getFileURL(project.folder, "target-image.png");
    image.alt = project.title;
    image.className = "script-card-image";
    image.loading = "lazy";

    image.onerror = () => {
        image.remove();
    };

    // Contenido
    const content = document.createElement("div");
    content.className = "script-card-content";

    // Categoría
    const category = document.createElement("span");

    category.className = "script-category-badge";
    category.textContent = project.categoryName;

    // Título
    const title = document.createElement("h3");

    title.textContent = project.title;

    // Descripción
    const description = document.createElement("p");

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

    // Botones
    const actions = document.createElement("div");

    actions.className = "script-actions";

    // Copiar loader
    const copyButton = document.createElement("button");

    copyButton.className = "copy-script-btn";
    copyButton.textContent = "Copiar script";

    copyButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(project.loader);

            copyButton.textContent = "¡Copiado!";

            setTimeout(() => {
                copyButton.textContent = "Copiar script";
            }, 1800);

        } catch (error) {
            console.error("Error copiando loader:", error);

            copyButton.textContent = "Error al copiar";

            setTimeout(() => {
                copyButton.textContent = "Copiar script";
            }, 1800);
        }
    });

    // Más información
    const infoLink = document.createElement("a");

    infoLink.className = "more-info-btn";
    infoLink.textContent = "Más información";

    infoLink.href =
        `script.html?id=${encodeURIComponent(project.folder)}`;

    // Construcción
    actions.append(copyButton, infoLink);

    content.append(
        category,
        title,
        description,
        tags,
        actions
    );

    card.append(image, content);

    return card;
}

// Mostrar proyectos
function renderProjects() {
    if (!grid) return;

    grid.replaceChildren();

    projects.forEach(project => {
        const card = createProjectCard(project);

        grid.appendChild(card);
    });

    filterProjects();
}

// Configurar filtros
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

    searchInput?.addEventListener("input", filterProjects);
}

// Buscar y filtrar proyectos
function filterProjects() {
    const query =
        searchInput?.value.toLowerCase().trim() || "";

    let visible = 0;

    document.querySelectorAll(".script-card").forEach(card => {
        const matchesFilter =
            activeFilter === "all" ||
            card.dataset.category === activeFilter;

        const matchesSearch =
            card.dataset.search.includes(query);

        const show = matchesFilter && matchesSearch;

        card.hidden = !show;

        if (show) {
            visible++;
        }
    });

    if (countElement) {
        countElement.textContent =
            `${visible} proyecto${visible === 1 ? "" : "s"}`;
    }

    if (noResults) {
        noResults.hidden = visible !== 0;
    }
}
