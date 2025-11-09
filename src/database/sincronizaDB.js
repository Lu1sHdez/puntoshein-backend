// src/database/sincronizaDB.js
import { sequelize } from "./database.js";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS || "",
    });
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log("Base de datos verificada o creada.");
  } catch (err) {
    console.error("Error al crear/verificar la base de datos:", err.message);
  }
})();

 /*  // === Importar TODOS los modelos ===
  import "../models/app/cliente.model.js";
  import "../models/app/detallePedido.model.js";
  import "../models/app/estado.model.js";
  import "../models/app/pedido.model.js";

  // 🧩 Modelos generales (directos en /models/)
  import "../models/carrito.model.js";
  import "../models/categoria.model.js";
  import "../models/detalleOrden.model.js";
  import "../models/detalleVenta.model.js";
  import "../models/documentoLegal.model.js";
  import "../models/empresa.model.js";
  import "../models/invitacionEmpleado.model.js";
  import "../models/opinion.model.js";
  import "../models/pin.model.js";
  import "../models/prediccion.model.js";
  import "../models/preguntaFrecuente.model.js";
  import "../models/producto.model.js";
  import "../models/productoRecomendado.model.js";
  import "../models/productoTalla.model.js";
  import "../models/reglaAsociacion.model.js";
  import "../models/subcategoria.model.js";
  import "../models/tallas.model.js";
  import "../models/tokenDispositivo.model.js";
  import "../models/usuario.model.js";
  import "../models/valores.model.js";
  import "../models/ventaProducto.model.js";
  import "../models/ventas.model.js"; 
  import "../models/usuario.model.js"; 
// Sincronizar todas las tablas

import "../models/usuario.model.js"; */

import "../models/documentoLegal.model.js";


sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Base de datos sincronizada correctamente con MySQL.");
  })
  .catch((error) => {
    console.error("Error al sincronizar la base de datos:", error);
});
