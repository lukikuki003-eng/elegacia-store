require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection(process.env.MYSQL_URL);

db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando:', err);
    return;
  }
  console.log('✅ Conectado a MySQL');

  const productos = [
    {
      nombre: 'Anillo de Plata Elegante',
      precio: 350,
      categoria: 'Anillos',
      descripcion: 'Anillo de plata con diseño minimalista',
      imagen: '/img/anillo1.jpg',
      stock: 15
    },
    {
      nombre: 'Anillo Dorado con Piedra',
      precio: 480,
      categoria: 'Anillos',
      descripcion: 'Anillo dorado con piedra central',
      imagen: '/img/anillo2.jpg',
      stock: 12
    },
    {
      nombre: 'Aretes de Perla',
      precio: 280,
      categoria: 'Aretes',
      descripcion: 'Aretes clásicos de perla natural',
      imagen: '/img/aretes1.jpg',
      stock: 20
    },
    {
      nombre: 'Aretes Colgantes Dorados',
      precio: 320,
      categoria: 'Aretes',
      descripcion: 'Aretes colgantes con acabado dorado',
      imagen: '/img/aretes2.jpg',
      stock: 18
    },
    {
      nombre: 'Blusa Blanca Casual',
      precio: 450,
      categoria: 'Blusas',
      descripcion: 'Blusa de algodón blanca, perfecta para el día a día',
      imagen: '/img/blusa1.jpg',
      stock: 15
    },
    {
      nombre: 'Blusa Estampada Floral',
      precio: 520,
      categoria: 'Blusas',
      descripcion: 'Blusa con estampado floral, estilo fresco',
      imagen: '/img/blusa2.jpg',
      stock: 10
    },
    {
      nombre: 'Bolsa de Mano Negra',
      precio: 680,
      categoria: 'Bolsas',
      descripcion: 'Bolsa de mano elegante para ocasiones especiales',
      imagen: '/img/bolsa1.jpg',
      stock: 8
    },
    {
      nombre: 'Bolsa Casual Beige',
      precio: 550,
      categoria: 'Bolsas',
      descripcion: 'Bolsa casual de tela beige, muy versátil',
      imagen: '/img/bolsa2.jpg',
      stock: 12
    }
  ];

  let insertados = 0;
  productos.forEach((p) => {
    db.query(
      'INSERT INTO productos (nombre, precio, categoria, descripcion, imagen, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [p.nombre, p.precio, p.categoria, p.descripcion, p.imagen, p.stock],
      (err, result) => {
        if (err) {
          console.error('❌ Error con', p.nombre, ':', err.message);
        } else {
          console.log(`✅ Agregado: ${p.nombre} (ID: ${result.insertId})`);
          insertados++;
          if (insertados === productos.length) {
            console.log('\n🎉 ¡Todos los productos agregados!');
            console.log('Abre http://localhost:3001/api/productos para verlos');
            db.end();
          }
        }
      }
    );
  });
});