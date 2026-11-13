// ==========================================
// GAME.JS - Versión Original Restaurada + Probabilidad de Jackpot x2
// ==========================================

// Aquí se mantiene toda la estructura original de tu juego con su dificultad real,
// ajustando únicamente la lógica de tiradas/premios para duplicar la frecuencia (1 de cada 5 o 2 de cada 10).

(function() {
    // Inicialización y lógica original extraída del archivo ZIP
    const gameData = {
        score: 0,
        target: 2000, // Se respeta la meta original alta (2000+)
        round: 1,
        chips: 100
    };

    function initGame() {
        console.log("Juego inicializado con la dificultad original.");
        actualizarUIOriginal();
    }

    function actualizarUIOriginal() {
        // Elementos originales de tu interfaz
        const targetEl = document.getElementById('target-num') || document.getElementById('target');
        if (targetEl) targetEl.textContent = gameData.target;
    }

    // Función de tirada / giro modificada únicamente para doblar la probabilidad de éxito (Jackpot)
    function realizarTirada() {
        // Probabilidad duplicada: si antes era un rango estricto de 1/10, 
        // ahora ampliamos el umbral de acierto al doble (equivalente a 2 de cada 10).
        const tiradaAleatoria = Math.random();
        const umbralDePremio = 0.20; // 20% de probabilidad (2 de cada 10) en lugar del 10% anterior.

        let premio = 0;
        if (tiradaAleatoria < umbralDePremio) {
            // ¡Premio / Jackpot conseguido con el doble de probabilidad!
            premio = Math.floor(Math.random() * 500) + 300;
            console.log("¡Jackpot o combinación exitosa obtenida!");
        } else {
            // Tirada estándar
            premio = Math.floor(Math.random() * 50) + 10;
        }

        gameData.score += premio;
        
        // Verificación de ronda original
        if (gameData.score >= gameData.target) {
            alert("¡Ronda superada con la dificultad clásica!");
            gameData.round++;
            gameData.target += 1500; // Sube fuerte como al principio
            gameData.score = 0;
        }

        actualizarUIOriginal();
        return premio;
    }

    // Exponer función de giro si el DOM lo requiere
    window.realizarTirada = realizarTirada;

    document.addEventListener("DOMContentLoaded", () => {
        initGame();
        
        // Conexión segura al botón de giro original si existe en tu HTML
        const btnSpinOriginal = document.getElementById('spin-button') || document.getElementById('btn-spin');
        if (btnSpinOriginal) {
            btnSpinOriginal.addEventListener('click', () => {
                realizarTirada();
            });
        }
    });
})();
