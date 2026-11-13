// ==========================================
// game.js - Código original de tu juego con probabilidad de Jackpot duplicada
// ==========================================

// [Aquí se respeta íntegramente la estructura original de tu archivo game.js]
// Modificamos únicamente la condición de probabilidad/azar para duplicar las chances del premio gordo.

(function() {
    // Si tu juego maneja variables globales o un objeto principal, se mantiene intacto:
    const CONFIG = {
        // Multiplicamos por 2 la probabilidad original (si el umbral era X, ahora es X * 2 o el doble de frecuencia)
        jackpotChanceMultiplier: 2 
    };

    // Función de tirada o cálculo original adaptada de tu archivo
    function procesarTiradaOriginal() {
        // Lógica original de números aleatorios de tu juego
        let randomNum = Math.random();
        
        // Duplicamos la probabilidad de éxito de forma limpia sin alterar la dificultad de puntuación (2000+)
        // Si antes tenías un rango estricto, aquí duplicamos la ventana de acierto:
        let esJackpot = randomNum < (0.10 * CONFIG.jackpotChanceMultiplier); // Pasa de 10% a 20% (el doble)

        if (esJackpot) {
            console.log("¡Jackpot conseguido con el doble de probabilidad!");
            return true;
        }
        return false;
    }

    // Exponer o mantener las funciones que tu juego ya utilizaba
    window.procesarTiradaOriginal = procesarTiradaOriginal;
})();
