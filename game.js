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

// --- VARIABLES DEL JUEGO ( MODO FACILÍSIMO ) ---
let ronda = 1;
let fichas = 500;
let puntuacionActual = 0;
let objetivoPuntuacion = 100; // ¡Bajado drásticamente para que pases el nivel 1 de un soplo!

function iniciarPartida() {
    ronda = 1;
    puntuacionActual = 0;
    objetivoPuntuacion = 100;
    actualizarInterfaz();
    generarManoJugador();
}

function actualizarInterfaz() {
    document.getElementById('round-num').textContent = ronda;
    document.getElementById('chips-num').textContent = fichas;
    document.getElementById('score-num').textContent = puntuacionActual;
    document.getElementById('target-num').textContent = objetivoPuntuacion;
}

// --- GENERAR CARTAS ---
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
            cartaDiv.style.color = '#c0392b';
        }
        
        cartaDiv.innerHTML = `
            <span>${valorAleatorio}</span>
            <span style="font-size: 14px; text-align:center;">${paloAleatorio}</span>
            <span style="text-align: right;">${valorAleatorio}</span>
        `;

        cartaDiv.addEventListener('click', () => {
            cartaDiv.classList.toggle('selected');
        });

        contenedorMano.appendChild(cartaDiv);
    }
}

// --- ACCIÓN DE LA MÁQUINA (PREMIOS ALTÍSIMOS) ---
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

        if (contador > 10) {
            clearInterval(animacionGiro);
            
            // ¡Puntos regalados para que pases el nivel uno sin sufrir!
            let puntosGanados = Math.floor(Math.random() * 200) + 150;
            puntuacionActual += puntosGanados;
            
            if (puntuacionActual >= objetivoPuntuacion) {
                alert('🎉 ¡NIVEL 1 SUPERADO! ¡Viste que sí se podía!');
                ronda++;
                puntuacionActual = 0;
                objetivoPuntuacion += 150; // Sube suavemente
                fichas += 100;
            }

            actualizarInterfaz();
            generarManoJugador();
        }
    }, 50);
});
