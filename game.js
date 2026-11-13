// --- LÓGICA DE NAVEGACIÓN Y MENÚS ---
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const skillsScreen = document.getElementById('skills-screen');
const statsScreen = document.getElementById('stats-screen');

document.getElementById('btn-start').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    iniciarPartida();
});

document.getElementById('btn-skills').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    skillsScreen.classList.remove('hidden');
});

document.getElementById('btn-stats').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    statsScreen.classList.remove('hidden');
});

document.getElementById('btn-close-skills').addEventListener('click', () => {
    skillsScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

document.getElementById('btn-close-stats').addEventListener('click', () => {
    statsScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

document.getElementById('btn-back-menu').addEventListener('click', () => {
    gameScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

// --- VARIABLES DEL JUEGO ---
let ronda = 1;
let fichas = 100;
let puntuacionActual = 0;
let objetivoPuntuacion = 300;

function iniciarPartida() {
    ronda = 1;
    puntuacionActual = 0;
    actualizarInterfaz();
    generarManoJugador();
}

function actualizarInterfaz() {
    document.getElementById('round-num').textContent = ronda;
    document.getElementById('chips-num').textContent = fichas;
    document.getElementById('score-num').textContent = puntuacionActual;
    document.getElementById('target-num').textContent = objetivoPuntuacion;
}

// --- GENERAR CARTAS DE EJEMPLO EN LA MANO ---
function generarManoJugador() {
    const contenedorMano = document.getElementById('player-hand');
    contenedorMano.innerHTML = '';
    
    const palos = ['♠', '♥', '♦', '♣'];
    const valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    for (let i = 0; i < 8; i++) {
        const paloAleatorio = palos[Math.floor(Math.random() * palos.length)];
        const valorAleatorio = valores[Math.floor(Math.random() * valores.length)];
        
        const cartaDiv = document.createElement('div');
        cartaDiv.classList.add('pixel-card');
        if (paloAleatorio === '♥' || paloAleatorio === '♦') {
            cartaDiv.style.color = '#c0392b'; // Rojos
        }
        
        cartaDiv.innerHTML = `
            <span>${valorAleatorio}</span>
            <span style="font-size: 14px; text-align:center;">${paloAleatorio}</span>
            <span style="text-align: right;">${valorAleatorio}</span>
        `;

        // Interacción al hacer clic en la carta (seleccionar)
        cartaDiv.addEventListener('click', () => {
            cartaDiv.classList.toggle('selected');
        });

        contenedorMano.appendChild(cartaDiv);
    }
}

// --- ANIMACIÓN Y ACCIÓN DE LA MÁQUINA TRAGAMONEDAS ---
document.getElementById('btn-spin').addEventListener('click', () => {
    const simbolosCasino = ['🍒', '7️⃣', '⭐', '🍋', '🔔', '💎', '🃏'];
    const r1 = document.getElementById('reel-1');
    const r2 = document.getElementById('reel-2');
    const r3 = document.getElementById('reel-3');

    let contador = 0;
    const animacionGiro = setInterval(() => {
        r1.textContent = simbolosCasino[Math.floor(Math.random() * simbolosCasino.length)];
        r2.textContent = simbolosCasino[Math.floor(Math.random() * simbolosCasino.length)];
        r3.textContent = simbolosCasino[Math.floor(Math.random() * simbolosCasino.length)];
        contador++;

        if (contador > 12) {
            clearInterval(animacionGiro);
            
            // Sumar puntos simulados tras el giro / jugada
            let puntosGanados = Math.floor(Math.random() * 150) + 50;
            puntuacionActual += puntosGanados;
            
            if (puntuacionActual >= objetivoPuntuacion) {
                alert('¡RONDA SUPERADA! Pasando a la siguiente ciega...');
                ronda++;
                puntuacionActual = 0;
                objetivoPuntuacion += 200;
                fichas += 50;
            }

            actualizarInterfaz();
            generarManoJugador();
        }
    }, 60);
});
