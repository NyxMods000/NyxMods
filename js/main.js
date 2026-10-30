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
const loading = document.getElementById("scriptLoading");

let projects = [];
let activeFilter = "all";

document.addEventListener("DOMContentLoaded", async () => {
    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    await loadProjects();

    searchInput?.addEventListener("input", filterProjects);

    document.querySelectorAll("[data-filter]").forEach(button => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter;

            document.querySelectorAll("[data-filter]").forEach(item => {
                item.classList.toggle("active", item === button);
            });

            filterProjects();
        });
    });
});

async function getText(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`No se pudo cargar: ${url}`);
    }

    return response.text();
}

function getFileURL(folder, filename) {
    return `${RAW_URL}/${CONFIG.folder}/${encodeURIComponent(folder)}/${filename}`;
}

async function loadProject(folder) {
    const [title, description, tags, loader] = await Promise.all([
        getText(getFileURL(folder, "title.txt")),
        getText(getFileURL(folder, "description.txt")),
        getText(getFileURL(folder, "tags.txt")),
        getText(getFileURL(folder, "loader.lua"))
    ]);

    const tagList = tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);

    const normalizedTags = tagList.map(tag => tag.toLowerCase());

    let category = "tools";

    if (normalizedTags.includes("universal")) {
        category = "universal";
    } else if (
        normalizedTags.includes("games") ||
        normalizedTags.includes("game")
    ) {
        category = "games";
    } else if (
        normalizedTags.includes("tools") ||
        normalizedTags.includes("tool")
    ) {
        category = "tools";
    }

    return {
        folder,
        title: title.trim(),
        description: description.trim(),
        tags: tagList,
        loader: loader.trim(),
        category
    };
}

async function loadProjects() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("No se pudo consultar el repositorio.");
        }

        const directories = await response.json();

        const folders = directories.filter(item =>
            item.type === "dir"
        );

        const results = await Promise.allSettled(
            folders.map(folder => loadProject(folder.name))
        );

        projects = results
            .filter(result => result.status === "fulfilled")
            .map(result => result.value);

        renderProjects();

    } catch (error) {
        console.error("NyxMods:", error);

        grid.textContent = "No se pudieron cargar los proyectos.";
        countElement.textContent = "Error al cargar";
    } finally {
        if (loading) loading.remove();
    }
}

function createProjectCard(project) {
    const card = document.createElement("article");
    card.className = "script-card";
    card.dataset.category = project.category;
    card.dataset.search = [
        project.title,
        project.description,
        ...project.tags
    ].join(" ").toLowerCase();

    const image = document.createElement("img");
    image.src = getFileURL(project.folder, "target-image.png");
    image.alt = project.title;
    image.className = "script-card-image";
    image.loading = "lazy";

    image.onerror = () => {
        image.remove();
    };

    const content = document.createElement("div");
    content.className = "script-card-content";

    const title = document.createElement("h3");
    title.textContent = project.title;

    const description = document.createElement("p");
    description.textContent = project.description;

    const tags = document.createElement("div");
    tags.className = "script-tags";

    project.tags.forEach(tag => {
        const element = document.createElement("span");
        element.className = "script-tag";
        element.textContent = tag;
        tags.appendChild(element);
    });

    const actions = document.createElement("div");
    actions.className = "script-actions";

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
            console.error(error);
            copyButton.textContent = "Error al copiar";
        }
    });

    const infoLink = document.createElement("a");
    infoLink.className = "more-info-btn";
    infoLink.textContent = "Más información";
    infoLink.href = `script.html?id=${encodeURIComponent(project.folder)}`;

    actions.append(copyButton, infoLink);
    content.append(title, description, tags, actions);
    card.append(image, content);

    return card;
}

function renderProjects() {
    grid.replaceChildren();

    projects.forEach(project => {
        grid.appendChild(createProjectCard(project));
    });

    filterProjects();
}

function filterProjects() {
    const query = searchInput?.value.toLowerCase().trim() || "";
    let visible = 0;

    document.querySelectorAll(".script-card").forEach(card => {
        const matchesFilter =
            activeFilter === "all" ||
            card.dataset.category === activeFilter;

        const matchesSearch =
            card.dataset.search.includes(query);

        const show = matchesFilter && matchesSearch;

        card.hidden = !show;

        if (show) visible++;
    });

    countElement.textContent =
        `${visible} proyecto${visible === 1 ? "" : "s"}`;

    noResults.hidden = visible !== 0;
}
