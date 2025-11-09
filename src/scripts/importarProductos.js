import { sequelize } from "../database/database.js";
import Producto from "../models/producto.model.js";
import ProductoTalla from "../models/productoTalla.model.js";
import Talla from "../models/tallas.model.js";
import Subcategoria from "../models/subcategoria.model.js";
import Categoria from "../models/categoria.model.js";
import fs from "fs";
    
async function importarProductos() {
  try {
    // Leer el JSON (ajusta la ruta si es diferente)
    const data = JSON.parse(fs.readFileSync("./src/scripts/productos.json", "utf-8"));

    await sequelize.sync(); // Asegura conexión
    console.log("✅ Conectado a la base de datos");

    for (const p of data) {
      // Verifica o crea la categoría
      let categoria = await Categoria.findOne({ where: { id: p.subcategoria.categoria.id } });
      if (!categoria) {
        categoria = await Categoria.create({
          id: p.subcategoria.categoria.id,
          nombre: p.subcategoria.categoria.nombre,
        });
      }

      // Verifica o crea la subcategoría
      let subcat = await Subcategoria.findOne({ where: { id: p.subcategoria.id } });
      if (!subcat) {
        subcat = await Subcategoria.create({
          id: p.subcategoria.id,
          nombre: p.subcategoria.nombre,
          categoria_id: categoria.id,
        });
      }

      // Inserta el producto
      let producto = await Producto.findOne({ where: { id: p.id } });
      if (!producto) {
        producto = await Producto.create({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: p.precio,
          imagen: p.imagen,
          stock: p.stock,
          fecha_creacion: p.fecha_creacion,
          color: p.color,
          subcategoria_id: subcat.id,
        });
        console.log(`🛍️ Producto agregado: ${p.nombre}`);
      }

      // Insertar tallas
      for (const t of p.tallas) {
        // Verifica si existe la talla
        let talla = await Talla.findOne({ where: { id: t.id } });
        if (!talla) {
          talla = await Talla.create({
            id: t.id,
            nombre: t.nombre,
          });
        }

        // Verifica si ya existe la relación Producto-Talla
        const existeRelacion = await ProductoTalla.findOne({
          where: { producto_id: producto.id, talla_id: talla.id },
        });

        if (!existeRelacion) {
          await ProductoTalla.create({
            producto_id: producto.id,
            talla_id: talla.id,
            stock: t.stock,
          });
          console.log(`   ➕ Talla ${t.nombre} (${t.stock}) vinculada a ${p.nombre}`);
        }
      }
    }

    console.log("\n✅ Importación completada con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al importar productos:", error);
    process.exit(1);
  }
}

importarProductos();
