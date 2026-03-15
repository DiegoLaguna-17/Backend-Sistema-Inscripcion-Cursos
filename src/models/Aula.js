class Aula {
  constructor(data) {
    this.nombre = data.nombre;
  }

  toDatabase() {
    return {
      nombre: this.nombre,
    };
  }
}

module.exports = Aula;
