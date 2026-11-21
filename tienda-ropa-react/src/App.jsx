import { useEffect, useState } from 'react'


function App() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [carrito, setCarrito] = useState([])
  const [mostrarCarrito, setMostrarCarrito] = useState(false)
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [adminLogueado, setAdminLogueado] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarFormProducto, setMostrarFormProducto] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', precio: '', id_categoria: '', descripcion: '', imagen: '', stock: '', talla: ''
  })
  const [seccionActual, setSeccionActual] = useState('inicio')
  const [mostrarExito, setMostrarExito] = useState(false)
  const [totalCompra, setTotalCompra] = useState(0)
  const [contadorCarrito, setContadorCarrito] = useState(0)
  const [mostrarCheckout, setMostrarCheckout] = useState(false)
  const [datosCliente, setDatosCliente] = useState({
    nombre: '', apellido: '', email: '', telefono: '', direccion: '', ciudad: ''
  })

  const cargarProductos = async () => {
    try {
      const respuesta = await fetch('https://elegacia-store-production.up.railway.app/api/productos', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        cache: 'no-store'
      })
      if (!respuesta.ok) throw new Error('Error en la respuesta')
      const datos = await respuesta.json()
      const productosConPreciosNumericos = datos.map(p => ({
        ...p,
        precio: parseFloat(p.precio)
      }))
      setProductos(productosConPreciosNumericos)
      setError(null)
    } catch (error) {
      console.error('Error cargando productos:', error)
      setError('Error al cargar productos. Verifica que el servidor esté corriendo.')
    } finally {
      setCargando(false)
    }
  }

  const cargarCategorias = async () => {
    try {
      const respuesta = await fetch('https://elegacia-store-production.up.railway.app/api/categorias')
      if (!respuesta.ok) throw new Error('Error al cargar categorías')
      const datos = await respuesta.json()
      setCategorias(datos)
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }

  useEffect(() => {
    cargarProductos()
    cargarCategorias()
  }, [])

  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = categoriaFiltro === 'todas' || String(producto.id_categoria) === String(categoriaFiltro)
    return coincideBusqueda && coincideCategoria
  })

  const obtenerNombreCategoria = (idCategoria) => {
    const categoria = categorias.find(c => c.id === idCategoria)
    return categoria ? categoria.nombre : 'Categoría ' + idCategoria
  }

  const agregarAlCarrito = (producto) => {
    if (producto.stock < 1) {
      alert('Producto agotado')
      return
    }
    const existe = carrito.find(item => item.id === producto.id)
    if (existe) {
      if (existe.cantidad >= producto.stock) {
        alert('No hay más stock disponible')
        return
      }
      const nuevoCarrito = carrito.map(item =>
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      )
      setCarrito(nuevoCarrito)
      setContadorCarrito(nuevoCarrito.reduce((sum, item) => sum + item.cantidad, 0))
    } else {
      const nuevoCarrito = [...carrito, { ...producto, cantidad: 1 }]
      setCarrito(nuevoCarrito)
      setContadorCarrito(nuevoCarrito.reduce((sum, item) => sum + item.cantidad, 0))
    }
  }

  const eliminarDelCarrito = (id) => {
    const nuevoCarrito = carrito.filter(item => item.id !== id)
    setCarrito(nuevoCarrito)
    setContadorCarrito(nuevoCarrito.reduce((sum, item) => sum + item.cantidad, 0))
  }

  const cambiarCantidad = (id, nuevaCantidad) => {
    const producto = carrito.find(item => item.id === id)
    if (nuevaCantidad < 1) return
    if (nuevaCantidad > producto.stock) {
      alert('No hay más stock disponible')
      return
    }
    const nuevoCarrito = carrito.map(item =>
      item.id === id ? { ...item, cantidad: nuevaCantidad } : item
    )
    setCarrito(nuevoCarrito)
    setContadorCarrito(nuevoCarrito.reduce((sum, item) => sum + item.cantidad, 0))
  }

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)

  const finalizarCompra = async () => {
    if (carrito.length === 0) return alert('Tu carrito está vacío')
    if (!datosCliente.nombre || !datosCliente.apellido || !datosCliente.email ||
        !datosCliente.telefono || !datosCliente.direccion || !datosCliente.ciudad) {
      return alert('Por favor completa todos los campos')
    }

    try {
      const respCliente = await fetch('https://elegacia-store-production.up.railway.app/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosCliente)
      })
      const datosClienteResp = await respCliente.json()

      if (!respCliente.ok) {
        throw new Error(datosClienteResp.error || 'Error al registrar cliente')
      }

      const clienteId = datosClienteResp.id

      const respuesta = await fetch('https://elegacia-store-production.up.railway.app/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteId,
          total: total,
          productos: carrito.map(item => ({
            id: item.id, nombre: item.nombre, cantidad: item.cantidad, precio: item.precio
          }))
        })
      })

      const datos = await respuesta.json()

      if (respuesta.ok) {
        setTotalCompra(total)
        setCarrito([])
        setContadorCarrito(0)
        setMostrarCarrito(false)
        setMostrarCheckout(false)
        setMostrarExito(true)
        setDatosCliente({ nombre: '', apellido: '', email: '', telefono: '', direccion: '', ciudad: '' })
      } else {
        alert('Error: ' + (datos.error || 'No se pudo procesar la compra'))
      }
    } catch (error) {
      alert('Error al procesar la compra: ' + error.message)
    }
  }

  const volverAlInicio = async () => {
    setMostrarExito(false)
    await cargarProductos()
    setSeccionActual('inicio')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const respuesta = await fetch('https://elegacia-store-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      })
      const datos = await respuesta.json()
      if (datos.exito) {
        setAdminLogueado(true)
        setMostrarLogin(false)
        alert('Bienvenido administrador')
      } else {
        alert('Usuario o contraseña incorrectos')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const guardarProducto = async (e) => {
    e.preventDefault()
    const url = productoEditando
      ? 'https://elegacia-store-production.up.railway.app/api/productos/' + productoEditando.id
      : 'https://elegacia-store-production.up.railway.app/api/productos'
    const metodo = productoEditando ? 'PUT' : 'POST'
    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProducto)
      })
      if (respuesta.ok) {
        alert('Producto guardado')
        setMostrarFormProducto(false)
        setProductoEditando(null)
        setNuevoProducto({ nombre: '', precio: '', id_categoria: '', descripcion: '', imagen: '', stock: '', talla: '' })
        await cargarProductos()
      }
    } catch (error) {
      alert('Error al guardar')
    }
  }

  const eliminarProducto = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return
    try {
      const respuesta = await fetch('https://elegacia-store-production.up.railway.app/api/productos/' + id, { method: 'DELETE' })
      if (respuesta.ok) {
        alert('Producto eliminado')
        await cargarProductos()
      }
    } catch (error) {
      alert('Error al eliminar')
    }
  }

  const editarProducto = (producto) => {
    setProductoEditando(producto)
    setNuevoProducto({
      nombre: producto.nombre, precio: producto.precio, id_categoria: producto.id_categoria,
      descripcion: producto.descripcion, imagen: producto.imagen, stock: producto.stock, talla: producto.talla
    })
    setMostrarFormProducto(true)
  }

  const irASeccion = (seccion) => {
    setSeccionActual(seccion)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <img src="/img/logo.jpg" alt="Elegance" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold text-yellow-500 tracking-widest">ELEGANCIA</h1>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={() => irASeccion('inicio')} className={`px-6 py-2 rounded-lg font-semibold ${seccionActual === 'inicio' ? 'bg-yellow-700 text-yellow-400' : 'text-white hover:text-yellow-500'}`}>INICIO</button>
            <button onClick={() => irASeccion('productos')} className={`px-6 py-2 rounded-lg font-semibold ${seccionActual === 'productos' ? 'bg-yellow-700 text-yellow-400' : 'text-white hover:text-yellow-500'}`}>CATÁLOGO</button>
            <button onClick={() => setMostrarCarrito(true)} className="bg-yellow-600 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-500 flex items-center gap-2">
              CARRITO ({contadorCarrito})
            </button>
            {adminLogueado ? (
              <button onClick={() => setAdminLogueado(false)} className="text-white hover:text-yellow-500 font-semibold">SALIR</button>
            ) : (
              <button onClick={() => setMostrarLogin(true)} className="text-white hover:text-yellow-500 font-semibold">ADMINISTRACIÓN</button>
            )}
          </div>
        </div>
      </nav>

      {/* PANTALLA DE ÉXITO */}
      {mostrarExito && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-10 text-center shadow-2xl">
            <div className="w-24 h-24 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-green-600 mb-4">¡Compra Exitosa!</h2>
            <p className="text-gray-600 text-lg mb-2">
              Tu pedido por <span className="font-bold text-gray-900">${totalCompra.toFixed(2)}</span> ha sido registrado correctamente.
            </p>
            <p className="text-gray-500 mb-8">El inventario ha sido actualizado.</p>
            <button onClick={volverAlInicio} className="bg-gray-900 text-yellow-500 px-10 py-4 rounded-full text-lg font-bold hover:bg-gray-800">
              Volver al Inicio
            </button>
          </div>
        </div>
      )}

      {/* INICIO */}
      {seccionActual === 'inicio' && (
        <>
          <div 
            className="relative h-screen flex items-center justify-center text-center overflow-hidden"
            style={{ backgroundColor: '#1a1a2e' }}
          >
            <img 
              src="/img/fondo.jpg" 
              alt="Fondo moda" 
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}></div>
            <div className="relative z-10 max-w-4xl mx-auto px-4">
              <h2 className="text-6xl font-bold text-white mb-6">DEFINE TU ESTILO</h2>
              <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
                Descubre las últimas tendencias en moda con nuestra colección exclusiva de prendas elegantes y accesorios de alta calidad.
              </p>
              <button onClick={() => irASeccion('productos')} className="bg-yellow-600 text-black px-10 py-4 rounded-full text-lg font-bold hover:bg-yellow-500">
                VER CATÁLOGO COMPLETO
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-4xl font-bold text-center mb-2">Productos Destacados</h2>
            <p className="text-center text-gray-600 mb-8">Lo más nuevo de nuestra colección</p>
            {cargando ? (
              <p className="text-center text-gray-500 text-xl py-12">Cargando productos...</p>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-bold">Error</p><p>{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {productos.slice(0, 8).map(producto => (
                  <div key={producto.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                    <img src={'/img/' + producto.imagen} alt={producto.nombre} className="w-full h-64 object-cover" />
                    <div className="p-4">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">{obtenerNombreCategoria(producto.id_categoria)}</span>
                      <h3 className="font-bold text-lg mt-2">{producto.nombre}</h3>
                      <p className="text-sm text-gray-600 mt-1">{producto.descripcion}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <span className="text-2xl font-bold text-yellow-600">${producto.precio.toFixed(2)}</span>
                        <span className={producto.stock > 0 ? 'text-green-600' : 'text-red-600'}>Stock: {producto.stock}</span>
                      </div>
                      <button onClick={() => agregarAlCarrito(producto)} disabled={producto.stock === 0}
                        className={`w-full mt-3 py-2 rounded-full font-semibold ${producto.stock > 0 ? 'bg-gray-900 text-white hover:bg-yellow-600' : 'bg-gray-300 text-gray-500'}`}>
                        {producto.stock > 0 ? 'Agregar al carrito' : 'Agotado'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* CATÁLOGO */}
      {seccionActual === 'productos' && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-4xl font-bold text-center mb-2">Nuestro Catálogo</h2>
          <p className="text-center text-gray-600 mb-8">Prendas y accesorios seleccionados para ti</p>
          <div className="flex gap-4 mb-8 max-w-3xl mx-auto">
            <input type="text" placeholder="Buscar productos..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-full" />
            <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className="px-4 py-3 border-2 border-gray-300 rounded-full">
              <option value="todas">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            {adminLogueado && (<button onClick={() => setMostrarFormProducto(true)} className="bg-yellow-600 text-black px-6 py-3 rounded-full font-semibold">+ Agregar</button>)}
          </div>
          {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"><p className="font-bold">Error</p><p>{error}</p></div>)}
          {cargando ? (
            <p className="text-center text-gray-500 text-xl py-12">Cargando productos...</p>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-500 text-xl">No se encontraron productos</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productosFiltrados.map(producto => (
                <div key={producto.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                  <img src={'/img/' + producto.imagen} alt={producto.nombre} className="w-full h-64 object-cover" />
                  <div className="p-4">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">{obtenerNombreCategoria(producto.id_categoria)}</span>
                    <h3 className="font-bold text-lg mt-2">{producto.nombre}</h3>
                    <p className="text-sm text-gray-600 mt-1">{producto.descripcion}</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <span className="text-2xl font-bold text-yellow-600">${producto.precio.toFixed(2)}</span>
                      <span className={producto.stock > 0 ? 'text-green-600' : 'text-red-600'}>Stock: {producto.stock}</span>
                    </div>
                    <button onClick={() => agregarAlCarrito(producto)} disabled={producto.stock === 0}
                      className={`w-full mt-3 py-2 rounded-full font-semibold ${producto.stock > 0 ? 'bg-gray-900 text-white hover:bg-yellow-600' : 'bg-gray-300 text-gray-500'}`}>
                      {producto.stock > 0 ? 'Agregar al carrito' : 'Agotado'}
                    </button>
                    {adminLogueado && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => editarProducto(producto)} className="flex-1 bg-blue-600 text-white py-1 rounded-full text-sm">Editar</button>
                        <button onClick={() => eliminarProducto(producto.id)} className="flex-1 bg-red-600 text-white py-1 rounded-full text-sm">Eliminar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL CARRITO */}
      {mostrarCarrito && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
            <div className="bg-gray-900 text-white rounded-t-2xl p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Tu Carrito</h2>
              <button onClick={() => { setMostrarCarrito(false); setMostrarCheckout(false); }} className="text-3xl hover:text-yellow-500">✕</button>
            </div>

            <div className="p-6">
              {carrito.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-xl">Tu carrito está vacío</p>
              ) : !mostrarCheckout ? (
                <>
                  <div className="space-y-4 mb-6">
                    {carrito.map(item => (
                      <div key={item.id} className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 border">
                        <img src={'/img/' + item.imagen} alt={item.nombre} className="w-20 h-20 object-cover rounded-lg" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.nombre}</h3>
                          <p className="text-yellow-600 font-bold">${item.precio.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => cambiarCantidad(item.id, item.cantidad - 1)} className="w-10 h-10 border-2 rounded-lg hover:bg-gray-200 font-bold">-</button>
                          <span className="font-bold w-8 text-center text-lg">{item.cantidad}</span>
                          <button onClick={() => cambiarCantidad(item.id, item.cantidad + 1)} className="w-10 h-10 border-2 rounded-lg hover:bg-gray-200 font-bold">+</button>
                        </div>
                        <span className="font-bold text-lg w-24 text-right">${(item.precio * item.cantidad).toFixed(2)}</span>
                        <button onClick={() => eliminarDelCarrito(item.id)} className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-lg text-xl">🗑</button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Subtotal ({contadorCarrito} productos)</span>
                      <span className="font-semibold">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Envío</span>
                      <span className="font-bold text-green-600">GRATIS</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b-2 border-yellow-600">
                      <span className="text-2xl font-bold">TOTAL</span>
                      <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                    </div>
                    <button onClick={() => setMostrarCheckout(true)} className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-yellow-500 font-bold py-4 rounded-xl text-lg">
                      Datos para finalizar la compra
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-xl p-6 mb-6 border">
                    <h3 className="text-xl font-bold mb-4">Datos para finalizar la compra</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold mb-2">Nombre:</label>
                          <input type="text" placeholder="Juan" value={datosCliente.nombre}
                            onChange={(e) => setDatosCliente({...datosCliente, nombre: e.target.value})}
                            className="w-full px-4 py-3 border-2 rounded-lg focus:border-yellow-600 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block font-semibold mb-2">Apellido:</label>
                          <input type="text" placeholder="Pérez" value={datosCliente.apellido}
                            onChange={(e) => setDatosCliente({...datosCliente, apellido: e.target.value})}
                            className="w-full px-4 py-3 border-2 rounded-lg focus:border-yellow-600 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">Email:</label>
                        <input type="email" placeholder="tu@email.com" value={datosCliente.email}
                          onChange={(e) => setDatosCliente({...datosCliente, email: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:border-yellow-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">Teléfono:</label>
                        <input type="tel" placeholder="555 123 4567" value={datosCliente.telefono}
                          onChange={(e) => setDatosCliente({...datosCliente, telefono: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:border-yellow-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">Dirección de envío:</label>
                        <input type="text" placeholder="Calle, número, colonia" value={datosCliente.direccion}
                          onChange={(e) => setDatosCliente({...datosCliente, direccion: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:border-yellow-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">Ciudad:</label>
                        <input type="text" placeholder="Tu ciudad" value={datosCliente.ciudad}
                          onChange={(e) => setDatosCliente({...datosCliente, ciudad: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:border-yellow-600 focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Subtotal ({contadorCarrito} productos)</span>
                      <span className="font-semibold">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Envío</span>
                      <span className="font-bold text-green-600">GRATIS</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b-2 border-yellow-600">
                      <span className="text-2xl font-bold">TOTAL</span>
                      <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setMostrarCheckout(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 font-bold py-4 rounded-xl text-lg">
                        Regresar
                      </button>
                      <button onClick={finalizarCompra} className="flex-[2] bg-gray-900 hover:bg-gray-800 text-yellow-500 font-bold py-4 rounded-xl text-lg">
                        FINALIZAR COMPRA - ${total.toFixed(2)}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN */}
      {mostrarLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Login Administrador</h2>
              <button onClick={() => setMostrarLogin(false)} className="text-3xl">✕</button>
            </div>
            <form onSubmit={handleLogin}>
              <input type="text" placeholder="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg mb-3" required />
              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg mb-4" required />
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg">Ingresar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM PRODUCTO */}
      {mostrarFormProducto && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{productoEditando ? 'Editar' : 'Nuevo Producto'}</h2>
              <button onClick={() => { setMostrarFormProducto(false); setProductoEditando(null); }} className="text-3xl">✕</button>
            </div>
            <form onSubmit={guardarProducto} className="space-y-3">
              <input type="text" placeholder="Nombre" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} className="w-full px-4 py-3 border-2 rounded-lg" required />
              <input type="number" step="0.01" placeholder="Precio" value={nuevoProducto.precio} onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})} className="w-full px-4 py-3 border-2 rounded-lg" required />
              <select value={nuevoProducto.id_categoria} onChange={(e) => setNuevoProducto({...nuevoProducto, id_categoria: e.target.value})} className="w-full px-4 py-3 border-2 rounded-lg" required>
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
              <textarea placeholder="Descripción" value={nuevoProducto.descripcion} onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})} className="w-full px-4 py-3 border-2 rounded-lg" required />
              <input type="text" placeholder="Imagen (ej: anillo1.jpg)" value={nuevoProducto.imagen} onChange={(e) => setNuevoProducto({...nuevoProducto, imagen: e.target.value})} className="w-full px-4 py-3 border-2 rounded-lg" required />
              <input type="number" placeholder="Stock" value={nuevoProducto.stock} onChange={(e) => setNuevoProducto({...nuevoProducto, stock: e.target.value})} className="w-full px-4 py-3 border-2 rounded-lg" required />
              <input type="text" placeholder="Talla (opcional)" value={nuevoProducto.talla} onChange={(e) => setNuevoProducto({...nuevoProducto, talla: e.target.value})} className="w-full px-4 py-3 border-2 rounded-lg" />
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg">
                {productoEditando ? 'Actualizar' : 'Crear Producto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-yellow-500 tracking-widest mb-4">ELEGANCE STORE</h3>
              <p className="text-gray-300">Tu destino de moda favorito.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-yellow-500 tracking-widest mb-4">CONTACTO</h3>
              <div className="space-y-3">
                <p className="text-gray-300 flex items-center gap-2">
                  <span className="text-yellow-500">📧</span> lukikuki@gmail.com
                </p>
                <p className="text-gray-300 flex items-center gap-2">
                  <span className="text-yellow-500">📱</span> +52 5650860329
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-gray-400 mb-2">© 2026 Litzi Aislinn Pérez. Todos los derechos reservados.</p>
            <p className="text-gray-500 text-sm">Desarrollado con React, Node.js, Express, Tailwind CSS y MySQL</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App