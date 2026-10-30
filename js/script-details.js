
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

let loaderCode = "";

function getFileURL(filename) {
    return `${RAW_URL}/${CONFIG.folder}/${encodeURIComponent(folder)}/${filename}`;
}

async function getText(filename) {
    const response = await fetch(getFileURL(filename));

    if (!response.ok) {
        throw new Error(`No se pudo cargar ${filename}`);
    }

    return response.text();
}

async function loadDetails() {
    try {
        if (!folder) {
            throw new Error("No se especificó un proyecto.");
        }

        const [title, description, tags, loader] = await Promise.all([
            getText("title.txt"),
            getText("description.txt"),
            getText("tags.txt"),
            getText("loader.lua")
        ]);

        loaderCode = loader.trim();

        document.title = `${title.trim()} | NyxMods`;

        document.getElementById("projectTitle").textContent = title.trim();
        document.getElementById("projectDescription").textContent =
            description.trim();

        const image = document.getElementById("projectImage");
        image.src = getFileURL("image.png");
        image.alt = title.trim();

        image.onerror = () => {
            image.hidden = true;
        };

        const tagContainer = document.getElementById("projectTags");

        tags.split(",").map(tag => tag.trim()).filter(Boolean).forEach(tag => {
            const element = document.createElement("span");
            element.className = "script-tag";
            element.textContent = tag;
            tagContainer.appendChild(element);
        });

        details.hidden = false;
        loading.hidden = true;

    } catch (error) {
        console.error("NyxMods:", error);

        loading.hidden = true;
        errorElement.hidden = false;
    }
}

document.getElementById("copyLoader").addEventListener("click", async () => {
    const button = document.getElementById("copyLoader");

    try {
        await navigator.clipboard.writeText(loaderCode);

        button.textContent = "¡Copiado!";

        setTimeout(() => {
            button.textContent = "Copiar script";
        }, 1800);

    } catch (error) {
        console.error(error);
        button.textContent = "Error al copiar";
    }
});

document.getElementById("year").textContent = new Date().getFullYear();

loadDetails();
