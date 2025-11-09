import admin from "../config/firebase.js";

export const enviarNotificacionStock = async (token, titulo, cuerpo) => {
  const mensaje = {
    notification: {
      title: titulo,
      body: cuerpo,
    },
    token,
  };

  try {
    const response = await admin.messaging().send(mensaje);
    console.log("Notificación enviada:", response);
  } catch (error) {
    console.error("Error al enviar notificación:", error);
  }
};
