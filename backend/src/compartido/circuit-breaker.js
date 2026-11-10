class CircuitBreaker {
    constructor({ nombre = 'circuito', limiteFallas = 3, esperaMs = 3000, ahora = Date.now } = {}) {
        this.nombre = nombre;
        this.limiteFallas = limiteFallas;
        this.esperaMs = esperaMs;
        this.ahora = ahora;
        this.estado = 'cerrado';
        this.fallasSeguidas = 0;
        this.abiertoDesde = 0;
    }

    async ejecutar(accion, alternativa) {
        if (this.estado === 'abierto') {
            if (this.ahora() - this.abiertoDesde < this.esperaMs) {
                return alternativa();
            }
            this.cambiarEstado('semiabierto');
        }

        try {
            const resultado = await accion();
            this.registrarExito();
            return resultado;
        } catch(error) {
            this.registrarFalla();
            return alternativa(error);
        }
    }

    registrarExito() {
        this.fallasSeguidas += 1;
        if (this.estado === 'semiabierto' || this.fallasSeguidas >= this.limiteFallas) {
            this.abiertoDesde = this.ahora();
            this.cambiarEstado('abierto');
        }
    }

    cambiarEstado(nuevo) {
        console.log(JSON.stringify({ circuito: this.nombre, de: this.estado, a: nuevo}));
        this.estado = nuevo;
    }
}

module.exports = { CircuitBreaker };