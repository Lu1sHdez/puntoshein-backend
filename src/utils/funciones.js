export const obtenerFechaHora = () => {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: 'America/Mexico_City',  // Zona horaria de Veracruz
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,  // Formato 24 horas
    }).format(new Date());
  };
  
  export default obtenerFechaHora;
  