
const CONFIG = {
    owner: "nyxmods000",
    repo: "NyxMods",
    branch: "main",
    folder: "Scripts"
};

const RAW_URL =
    `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}`;

const params = new URLSearchParams(window.location.search);
const folder = params.get("id");

const loading = document.getElementById("detailsLoading");
const details = document.getElementById("projectDetails");
const errorElement = document.getElementById("detailsError");

const titleElement = document.getElementById("projectTitle");
const descriptionElement = document.getElementById("projectDescription");
const imageElement = document.getElementById("projectImage");
const tagsElement = document.getElementById("projectTags");
const loaderElement = document.getElementById("loaderCode");

const copyButton = document.getElementById("copyLoader");
const copyText = document.getElementById("copyLoaderText");

let loaderCode = "";

function getFileURL(filename) {
    return `${RAW_URL}/${CONFIG.folder}/${encodeURIComponent(folder)}/${filename}`;
}

async function getText(filename) {
    const response = await fetch(getFileURL(filename));

    if (!response.ok) {
        throw new Error(`No se pudo cargar ${filename}: HTTP ${response.status}`);
    }

    return response.text();
}

async function loadDetails() {
    try {
        if (!folder || folder.includes("/") || folder.includes("\\")) {
            throw new Error("Identificador de proyecto inválido.");
        }

        const [title, description, tags, loader] = await Promise.all([
            getText("title.txt"),
            getText("description.txt"),
            getText("tags.txt"),
            getText("loader.lua")
        ]);

        const projectTitle = title.trim();

        loaderCode = loader.trim();

        // Información
        document.title = `${projectTitle} | NyxMods`;
        titleElement.textContent = projectTitle;
        descriptionElement.textContent = description.trim();
        loaderElement.textContent = loaderCode;

        // Imagen
        imageElement.src = getFileURL("image.png");
        imageElement.alt = projectTitle;

        imageElement.onerror = () => {
            imageElement.closest(".project-image-wrapper").hidden = true;
        };

        // Etiquetas
        tagsElement.replaceChildren();

        tags.split(",")
            .map(tag => tag.trim())
            .filter(Boolean)
            .forEach(tag => {
                const element = document.createElement("span");

                element.className = "script-tag";
                element.textContent = tag;

                tagsElement.appendChild(element);
            });

        // Mostrar proyecto
        loading.hidden = true;
        details.hidden = false;

    } catch (error) {
        console.error("NyxMods:", error);

        loading.hidden = true;
        errorElement.hidden = false;
    }
}

// Copiar loader
copyButton.addEventListener("click", async () => {
    try {
        if (!loaderCode) {
            throw new Error("El loader está vacío.");
        }

        if (!navigator.clipboard?.writeText) {
            throw new Error("Clipboard API no disponible.");
        }

        await navigator.clipboard.writeText(loaderCode);

        copyText.textContent = "¡Copiado correctamente!";
        copyButton.classList.add("copied");

        setTimeout(() => {
            copyText.textContent = "Copiar loader";
            copyButton.classList.remove("copied");
        }, 1800);

    } catch (error) {
        console.error("NyxMods - Error copiando:", error);

        copyText.textContent = "No se pudo copiar";

        setTimeout(() => {
            copyText.textContent = "Copiar loader";
        }, 1800);
    }
});

// Año
document.getElementById("year").textContent =
    new Date().getFullYear();

// Iniciar
loadDetails();
