import { alertaRef } from '../components/notificaciones/alert_inApp'; // Ajustá la ruta según dónde lo guardaste

export const notificaciones = {
  
  exito: (titulo: string, mensaje: string) => {
    // Llama a la función mostrar del modal y le pasa 'exito' para pintar el botón verde
    (alertaRef.current as any)?.mostrar(titulo, mensaje, 'exito');
  },

  error: (titulo: string, mensaje: string) => {
    // Llama a la función mostrar y le pasa 'error' para pintar el botón rojo
    (alertaRef.current as any)?.mostrar(titulo, mensaje, 'error');
  }

};