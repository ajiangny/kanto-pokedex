// Capitalize first letter helper
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Update the Pokémon Details Panel
function updatePokemonDetails(li) {
    const data = JSON.parse(li.dataset.pokemonData);

    const image = document.querySelector('.pokemon-img img');

    // Reset animation
    image.style.transition = 'none';
    image.style.filter = 'none';

    image.style.transition = 'filter 0.2s ease, opacity 0.2s ease';
    image.style.filter = 'url(#pixelate)';

    setTimeout(() => {
        image.src = data.sprite;

        image.onload = () => {
            image.style.transition = 'filter 0.5s ease, opacity 0.5s ease';
            image.style.filter = 'url(#pixelate)';
            setTimeout(() => {
                image.style.filter = 'none';
            }, 300);
        };
    }, 150);

    // Update Name and ID
    document.querySelector('.pokemon-name h2').textContent = capitalize(data.name);
    document.querySelector('.pokemon-id h2').textContent = `#${data.id.toString().padStart(3, '0')}`;

    // Species / Category
    document.querySelector('.pokemon-info h3').textContent = data.speciesName || "Pokémon";

    // Types
    const typeWrapper = document.querySelector('.type');
    typeWrapper.innerHTML = '';
    data.types.forEach(type => {
        const typeLi = document.createElement('li');
        typeLi.textContent = type;
        typeLi.classList.add(type.toLowerCase());
        typeWrapper.appendChild(typeLi);
    });

    // Info
    document.querySelector('.pokemon-info p').textContent = data.description || "No description available.";

    // ==== Details Section ====
    const detailList = document.querySelector('.details');
    detailList.innerHTML = '';

    // Height, Weight, Category, Abilities
    detailList.innerHTML += `
        <li>Height: ${(data.height / 10).toFixed(1)}m</li>
        <li>Weight: ${(data.weight / 10).toFixed(1)}kg</li>
        <li>Category: ${data.speciesName || "Unknown"}</li>
        <li>Abilities: ${data.abilities.join(', ')}</li>
    `;

    // Gender
    const genderLi = document.createElement('li');
    genderLi.textContent = 'Gender: ';

    const genderWrapper = document.createElement('span');
    genderWrapper.classList.add('gender-buttons');

    if (data.genderRate === -1) {
        genderLi.innerHTML += 'Genderless';
    } else {
        if (data.genderRate !== 8) {
            // Allow Male
            const maleIcon = document.createElement('span');
            maleIcon.classList.add('gender-icon');
            maleIcon.dataset.gender = 'male';
            maleIcon.textContent = '♂';
            genderWrapper.appendChild(maleIcon);
        }
        if (data.genderRate !== 0) {
            // Allow Female
            const femaleIcon = document.createElement('span');
            femaleIcon.classList.add('gender-icon');
            femaleIcon.dataset.gender = 'female';
            femaleIcon.textContent = '♀';
            genderWrapper.appendChild(femaleIcon);
        }
        genderLi.appendChild(genderWrapper);
    }
    detailList.appendChild(genderLi);

    // ==== Stats Section ====
    const statsList = document.querySelector('.stats');
    statsList.innerHTML = '';
    const statLabels = ["HP", "ATK", "DEF", "SATK", "SDEF", "SPD"];

    data.stats.forEach((statValue, index) => {
        const li = document.createElement('li');

        const wrapper = document.createElement('div');
        wrapper.classList.add('stat-bar-wrapper');

        const number = document.createElement('span');
        number.classList.add('stat-number');
        number.textContent = statValue;

        const progress = document.createElement('progress');
        progress.value = statValue;
        progress.max = 255;

        wrapper.appendChild(number);
        wrapper.appendChild(progress);

        const label = document.createElement('span');
        label.classList.add('stat-label');
        label.textContent = statLabels[index];

        li.appendChild(wrapper);
        li.appendChild(label);

        statsList.appendChild(li);
    });

    // Attach the gender click functionality
    attachGenderButtons(data);
}

// Move Hover Selector
function moveHoverSelector(li, smooth = false) {
    const ul = li.closest('ul');
    const container = document.querySelector('.pokemon-list');

    const liHeight = li.offsetHeight;
    const liTop = li.offsetTop;
    const ulHeight = ul.clientHeight;

    const scrollTarget = liTop - (ulHeight / 2) + (liHeight / 2);

    // Always immediately update selected item
    pokemonItems.forEach(item => item.classList.remove('selected'));
    li.classList.add('selected');

    // Move hover selector immediately
    updateHoverSelectorPosition(li, ul, container);

    if (smooth) {
        ul.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
        });

        setTimeout(() => {
            // After scroll finishes, adjust hover selector again (in case scroll moved)
            updateHoverSelectorPosition(li, ul, container);
        }, 300); 
    } else {
        ul.scrollTop = scrollTarget;
        updateHoverSelectorPosition(li, ul, container);
    }
}

// update Hover Selector position
function updateHoverSelectorPosition(li, ul, container) {
    const liRect = li.getBoundingClientRect();
    const ulRect = ul.getBoundingClientRect();

    const offset = liRect.top - ulRect.top;

    const maxOffset = container.clientHeight - hoverSelector.clientHeight;
    const clampedOffset = Math.max(0, Math.min(offset, maxOffset));

    hoverSelector.style.top = clampedOffset + "px";
}

// Fetch Pokémon basic + species info
async function fetchPokemon(id) {
    const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${id}`;

    const [pokemonResponse, speciesResponse] = await Promise.all([
        fetch(url),
        fetch(speciesUrl)
    ]);

    const pokemon = await pokemonResponse.json();
    const species = await speciesResponse.json();

    const descriptionEntry = species.flavor_text_entries.find(
        entry => entry.language.name === 'en'
    );

    return {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.versions["generation-v"]["black-white"].animated.front_default 
        || pokemon.sprites.front_default,
        spriteFemale: pokemon.sprites.versions["generation-v"]["black-white"].animated.front_female || pokemon.sprites.front_female || null,
        types: pokemon.types.map(t => capitalize(t.type.name)),
        height: pokemon.height,
        weight: pokemon.weight,
        abilities: pokemon.abilities.map(a => capitalize(a.ability.name)),
        base_experience: pokemon.base_experience,
        stats: pokemon.stats.map(s => s.base_stat),
        speciesName: species.genera.find(g => g.language.name === 'en')?.genus || 'Pokémon',
        description: descriptionEntry ? descriptionEntry.flavor_text.replace(/\n|\f/g, ' ') : '',
        genderRate: species.gender_rate 
    };
}

function getGenderDisplay(genderRate) {
    if (genderRate === -1) {
        return 'Genderless';
    } else if (genderRate === 0) {
        return '♂';
    } else if (genderRate === 8) {
        return '♀';
    } else {
        return '♂ ♀'; // mixed genders
    }
}

// Add Pokémon to List
function addPokemonToList(pokemon) {
    const li = document.createElement("li");

    const pokeballSlot = document.createElement("span");
    pokeballSlot.classList.add("pokeball-slot");

    const pokeball = document.createElement("span");
    pokeball.classList.add("pokeball");

    pokeballSlot.appendChild(pokeball);

    li.appendChild(pokeballSlot);
    li.appendChild(document.createTextNode(` ${pokemon.id.toString().padStart(3, "0")} ${capitalize(pokemon.name)}`));

    // Store Pokémon data in the li
    li.dataset.pokemonData = JSON.stringify(pokemon);

    pokemonList.appendChild(li);

    // Click to select
    li.addEventListener('click', () => {
        // FIXED: Always get fresh pokemonItems
        const items = document.querySelectorAll('.pokemon-list ul li');
        selectedPokemon = li;
        selectedIndex = Array.from(items).indexOf(li);
        moveHoverSelector(li, true);
        updatePokemonDetails(li);
    });
}

// Load all 151 Pokémon
async function loadPokemon() {
    for (let id = 1; id <= 151; id++) {
        const pokemonData = await fetchPokemon(id);
        addPokemonToList(pokemonData);
    }

    // After loading, setup initial selection
    pokemonItems = document.querySelectorAll('.pokemon-list ul li');
    if (pokemonItems.length > 0) {
        selectedPokemon = pokemonItems[0];
        selectedIndex = 0;
        moveHoverSelector(selectedPokemon, false);
        updatePokemonDetails(selectedPokemon);
    }
    
    
}

// Variables
const pokemonList = document.querySelector(".pokemon-list ul");
const hoverSelector = document.querySelector('.hover-selector');
let selectedPokemon = null;
let selectedIndex = 0;
let pokemonItems = [];

// Handle Mouse Wheel Scroll Selection
document.querySelector('.pokemon-list').addEventListener('wheel', (event) => {
    event.preventDefault();

    if (event.deltaY > 0) {
        if (selectedIndex < pokemonItems.length - 1) {
            selectedIndex++;
        }
    } else {
        if (selectedIndex > 0) {
            selectedIndex--;
        }
    }

    selectedPokemon = pokemonItems[selectedIndex];
    moveHoverSelector(selectedPokemon, false);
    updatePokemonDetails(selectedPokemon);
});

function attachGenderButtons(pokemonData) {
    const genderIcons = document.querySelectorAll('.gender-icon');
    const img = document.querySelector('.pokemon-img img');

    // Check if female sprite actually exists
    const hasFemaleForm = !!pokemonData.spriteFemale;

    genderIcons.forEach(icon => {
        const gender = icon.dataset.gender;

        // Clean any old states
        icon.classList.remove('gender-available', 'disabled', 'active');
        icon.style.pointerEvents = 'auto';

        if (!hasFemaleForm) {
            // No special female form → Disable female button
            if (gender === 'female') {
                icon.classList.add('disabled');
                icon.style.pointerEvents = 'none'; // Prevent clicking
            }
            if (gender === 'male') {
                icon.classList.add('disabled');
                icon.style.pointerEvents = 'none'; // Also stop clicking male (optional but clean)
            }
            return; // Done early
        }

        // If there IS a special female form
        if (gender === 'female') {
            icon.classList.add('gender-available'); // pulse effect
        }

        icon.addEventListener('click', () => {
            // Ignore click if disabled
            if (icon.classList.contains('disabled')) return;

            // Clicking male
            if (gender === 'male') {
                img.src = pokemonData.sprite;

                // Clean up
                genderIcons.forEach(g => {
                    g.classList.remove('active');
                    g.classList.remove('gender-available');
                });
            }
            // Clicking female
            else if (gender === 'female') {
                img.src = pokemonData.spriteFemale || pokemonData.sprite;

                genderIcons.forEach(g => {
                    g.classList.remove('active');
                    g.classList.remove('gender-available');
                });
                icon.classList.add('active');
            }
        });
    });
    
}

// Start everything
loadPokemon();


