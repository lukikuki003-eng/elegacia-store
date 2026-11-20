require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir imágenes estáticas
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));

// Conexión a MySQL
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  } else {
    console.log('✅ Conectado a MySQL');
  }
});

// ============================================
// RUTAS DE PRODUCTOS
// ============================================

// GET: Obtener todos los productos
app.get('/api/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// POST: Agregar producto
app.post('/api/productos', (req, res) => {
  const { nombre, precio, id_categoria, descripcion, imagen, stock, talla } = req.body;
  db.query(
    'INSERT INTO productos (nombre, precio, id_categoria, descripcion, imagen, stock, talla) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombre, precio, id_categoria, descripcion, imagen, stock, talla],
    (err, result) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: result.insertId, message: 'Producto agregado' });
    }
  );
});

// PUT: Actualizar producto
app.put('/api/productos/:id', (req, res) => {
  const { nombre, precio, id_categoria, descripcion, imagen, stock, talla } = req.body;
  db.query(
    'UPDATE productos SET nombre=?, precio=?, id_categoria=?, descripcion=?, imagen=?, stock=?, talla=? WHERE id=?',
    [nombre, precio, id_categoria, descripcion, imagen, stock, talla, req.params.id],
    (err) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Producto actualizado' });
    }
  );
});

// DELETE: Eliminar producto
app.delete('/api/productos/:id', (req, res) => {
  db.query('DELETE FROM productos WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Producto eliminado' });
  });
});

// ============================================
// RUTA DE CATEGORÍAS
// ============================================

// GET: Obtener todas las categorías
app.get('/api/categorias', (req, res) => {
  db.query('SELECT id, nombre FROM categorias ORDER BY nombre', (err, results) => {
    if (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// ============================================
// RUTA DE LOGIN
// ============================================

app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  db.query(
    'SELECT * FROM administradores WHERE usuario = ? AND password = ?',
    [usuario, password],
    (err, results) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: err.message });
      }
      if (results.length > 0) {
        res.json({ exito: true, admin: results[0] });
      } else {
        res.json({ exito: false, mensaje: 'Credenciales incorrectas' });
      }
    }
  );
});

// ============================================
// RUTA DE CLIENTES
// ============================================

app.post('/api/clientes', (req, res) => {
  const { nombre, apellido, email, telefono, direccion, ciudad } = req.body;
  
  console.log('📦 Registrando cliente:', { nombre, apellido, email, telefono, direccion, ciudad });
  
  db.query(
    'INSERT INTO clientes (nombre, apellido, email, telefono, direccion, ciudad) VALUES (?, ?, ?, ?, ?, ?)',
    [nombre, apellido, email, telefono, direccion, ciudad],
    (err, result) => {
      if (err) {
        console.error('❌ Error registrando cliente:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('✅ Cliente registrado con ID:', result.insertId);
      res.json({ id: result.insertId, message: 'Cliente registrado' });
    }
  );
});

// ============================================
// RUTA DE VENTAS
// ============================================

app.post('/api/ventas', (req, res) => {
  const { cliente_id, total, productos } = req.body;
  
  console.log('📦 Recibiendo venta:', { cliente_id, total, productos });
  
  db.beginTransaction((err) => {
    if (err) {
      console.error('❌ Error beginTransaction:', err);
      return res.status(500).json({ error: err.message });
    }
    
    let ventasInsertadas = 0;
    const totalProductos = productos.length;
    let hayError = false;
    
    productos.forEach(producto => {
      if (hayError) return;
      
      const totalProducto = producto.precio * producto.cantidad;
      
      // Insertar en tabla ventas
      db.query(
        'INSERT INTO ventas (id_cliente, id_producto, cantidad, total, fecha_venta) VALUES (?, ?, ?, ?, NOW())',
        [cliente_id, producto.id, producto.cantidad, totalProducto],
        (err) => {
          if (err) {
            hayError = true;
            console.error('❌ Error insertando venta:', err);
            db.rollback(() => {});
            return res.status(500).json({ error: err.message });
          }
          
          console.log('✅ Venta insertada: producto ' + producto.id + ', cantidad ' + producto.cantidad);
          
          // Actualizar stock
          db.query(
            'UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?',
            [producto.cantidad, producto.id, producto.cantidad],
            (err, result) => {
              if (err) {
                hayError = true;
                console.error('❌ Error actualizando stock:', err);
                db.rollback(() => {});
                return res.status(500).json({ error: err.message });
              }
              
              if (result.affectedRows === 0) {
                hayError = true;
                console.error('❌ Stock insuficiente para producto', producto.id);
                db.rollback(() => {});
                return res.status(400).json({ error: 'Stock insuficiente' });
              }
              
              console.log('✅ Stock actualizado: producto ' + producto.id);
              
              ventasInsertadas++;
              
              if (ventasInsertadas === totalProductos && !hayError) {
                db.commit((err) => {
                  if (err) {
                    console.error('❌ Error commit:', err);
                    db.rollback(() => {});
                    return res.status(500).json({ error: err.message });
                  }
                  console.log('✅ Venta completada exitosamente');
                  res.json({ message: 'Venta registrada y stock actualizado' });
                });
              }
            }
          );
        }
      );
    });
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 36026;

app.listen(PORT, () => {
  console.log('🚀 Servidor corriendo en puerto ' + PORT);
});