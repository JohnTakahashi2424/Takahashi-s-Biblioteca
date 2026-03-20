
const { createApp, ref, computed, onMounted, watch } = Vue;
const { createRouter, createWebHashHistory, useRouter, useRoute } = VueRouter;

// Configuración de Axios
axios.defaults.baseURL = 'api';

axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

axios.interceptors.response.use(res => res, error => {
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.hash = '#/login';
    }
    return Promise.reject(error);
});

// VISTA LOGIN
const LoginView = {
    template: '#tmpl-login',
    setup() {
        const form = ref({ email: '', password: '' });
        const loading = ref(false);
        const router = useRouter();

        const login = async () => {
            loading.value = true;
            try {
                const { data } = await axios.post('/login.php', form.value);
                
                // REGLA 4: Logs de depuración de la respuesta del backend
                console.log("Respuesta Exitosa de PHP:", data);

                // REGLA 1: Manejo de la Respuesta
                if (data && data.success) {
                    
                    // Asegurar que el objeto usuario existe para evitar rompimientos (undefined)
                    const userObj = data.usuario || {};
                    const rolAsignado = userObj.rol || 'lector';

                    // REGLA 2: Almacenamiento de Sesión en el Navegador
                    localStorage.setItem('token', data.token || '');
                    localStorage.setItem('user', JSON.stringify(userObj));
                    localStorage.setItem('rol', rolAsignado);
                    
                    window.dispatchEvent(new Event('auth-changed'));
                    
                    if (window.alertify) {
                        alertify.success('Conexión establecida. Bienvenido(a).');
                    }

                    // REGLA 3: Redirección Estricta con Vue Router
                    if (rolAsignado === 'admin') {
                        router.push('/admin/dashboard');
                    } else {
                        router.push('/inicio/catalogo');
                    }
                } else {
                    console.warn("Autenticación denegada silenciosamente:", data);
                }
            } catch (error) {
                // REGLA 4: Atrapando y mostrando errores fatales de JS en consola
                console.error("Error Crítico en Vue (Login):", error);
                
                if (window.alertify) {
                    alertify.error(error.response?.data?.error || 'Error JS/Red en el frontend.');
                }
            } finally {
                loading.value = false;
            }
        };

        return { form, loading, login };
    }
};

// VISTA PRINCIPAL (Layout + Tabs)
const MainView = {
    template: '#tmpl-main-view',
    setup() {
        const router = useRouter();
        const route = useRoute();
        const currentTab = computed(() => route.params.tab || (route.path.includes('admin') ? 'dashboard' : 'catalogo'));
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const rolActual = ref(user.rol || 'lector');
        const simuladorLoginId = ref(user.id || 0);

        const isSaving = ref(false);
        const isSearching = ref(false);
        const isbnError = ref('');
        const vistaGaleria = ref(false);

        // --- MÉTODOS DE AXIOS --- //
        const categorias = ref([]);
        const obtenerCategorias = async () => {
            try { const { data } = await axios.get('/obtener_categorias.php'); categorias.value = Array.isArray(data) ? data : (data || []); } catch(e) { categorias.value = []; }
        };

        const autores = ref([]);
        const obtenerAutores = async () => {
            try { const { data } = await axios.get('/obtener_autores.php'); autores.value = Array.isArray(data) ? data : (data || []); } catch(e) { autores.value = []; }
        };

        const usuarios = ref([]);
        const obtenerUsuarios = async () => {
            if (rolActual.value !== 'admin') return;
            try { const { data } = await axios.get('/usuarios.php'); usuarios.value = Array.isArray(data) ? data : (data || []); } catch(e) { usuarios.value = []; }
        };

        const libros = ref([]);
        const obtenerLibros = async () => {
            try { const { data } = await axios.get('/obtener_libros.php'); libros.value = Array.isArray(data) ? data : (data || []); } catch(e) { libros.value = []; }
        };

        const ultimosLibros = computed(() => {
            return (Array.isArray(libros.value) ? libros.value : []).slice(-4).reverse();
        });

        const prestamos = ref([]);
        const obtenerPrestamos = async () => {
             // Admin y Lector usan el mismo endpoint, el PHP filtra si es lector
            try { const { data } = await axios.get(`/obtener_prestamos.php?usuario_id=\${simuladorLoginId.value}&rol=\${rolActual.value}`); prestamos.value = Array.isArray(data) ? data : (data || []); } catch(e) { prestamos.value = []; }
        };

        
        onMounted(() => {
            obtenerCategorias();
            obtenerUsuarios();
            obtenerAutores();
            obtenerLibros();
            obtenerPrestamos();
        });

        // --- CATEGORÍAS ---
        const editModeCategoria = ref(false);
        const formCategoria = ref({ id: null, nombre: '', descripcion: '' });
        
        const guardarCategoria = async () => {
            isSaving.value = true;
            try {
                if (editModeCategoria.value) {
                    await axios.put('/categorias.php', formCategoria.value);
                    alertify.success('Categoría actualizada');
                } else {
                    await axios.post('/categorias.php', formCategoria.value);
                    alertify.success('Categoría guardada');
                }
                await obtenerCategorias();
                cancelarEdicionCategoria();
            } catch (e) { alertify.error('Error al guardar categoría'); } 
            finally { isSaving.value = false; }
        };
        const editarCategoria = (c) => { formCategoria.value = { ...c }; editModeCategoria.value = true; };
        const eliminarCategoria = async (id) => {
            alertify.confirm('¿Eliminar esta categoría?', async () => {
                await axios.delete(`/categorias.php?id=${id}`);
                await obtenerCategorias();
                alertify.success('Eliminada');
            }, null);
        };
        const cancelarEdicionCategoria = () => { formCategoria.value = { id: null, nombre: '', descripcion: '' }; editModeCategoria.value = false; };

        // --- USUARIOS ---
        const filtroUsuario = ref('');
        const editModeUsuario = ref(false);
        const formUsuario = ref({ idUsuario: null, documento: '', nombre: '', email: '', telefono: '', rol: 'lector' });
        
        const guardarUsuario = async () => {
            isSaving.value = true;
            try {
                if (editModeUsuario.value) {
                    await axios.put('/usuarios.php', formUsuario.value);
                    alertify.success('Usuario actualizado');
                } else {
                    await axios.post('/usuarios.php', formUsuario.value);
                    alertify.success('Usuario registrado');
                }
                await obtenerUsuarios();
                cancelarEdicionUsuario();
            } catch (e) { alertify.error('Error al guardar el usuario'); }
            finally { isSaving.value = false; }
        };
        const editarUsuario = (u) => { formUsuario.value = { ...u, password: '' }; editModeUsuario.value = true; };
        const eliminarUsuario = async (id) => {
            alertify.confirm('¿Eliminar este lector?', async () => {
                await axios.delete(`/usuarios.php?id=${id}`);
                await obtenerUsuarios();
                alertify.success('Eliminado');
            }, null);
        };
        const cancelarEdicionUsuario = () => { formUsuario.value = { idUsuario: null, documento: '', nombre: '', email: '', telefono: '', rol: 'lector' }; editModeUsuario.value = false; };
        const usuariosFiltrados = computed(() => {
            const arr = Array.isArray(usuarios.value) ? usuarios.value : [];
            const qr = filtroUsuario.value.toLowerCase().trim();
            if (!qr) return arr;
            return arr.filter(u => u.nombre.toLowerCase().includes(qr) || u.email.toLowerCase().includes(qr));
        });

        // --- LIBROS ---
        const filtroLibro = ref('');
        const editModeLibro = ref(false);
        // Note: autor is now text. We map categoria_id
        const formLibro = ref({ id: null, titulo: '', autor: '', categoria_id: '', isbn: '', stock_total: 1, portada_url: '' });

        const guardarLibro = async () => {
            isSaving.value = true;
            try {
                if (editModeLibro.value) {
                    await axios.put('/libros.php', formLibro.value);
                    alertify.success('Libro actualizado');
                } else {
                    await axios.post('/libros.php', formLibro.value);
                    alertify.success('Libro guardado');
                }
                await obtenerLibros();
                cancelarEdicionLibro();
            } catch (e) { alertify.error('Error al guardar el libro'); }
            finally { isSaving.value = false; }
        };
        const editarLibro = (l) => { formLibro.value = { ...l }; editModeLibro.value = true; };
        const eliminarLibro = async (id) => {
            alertify.confirm('¿Eliminar este libro?', async () => {
                await axios.delete(`/libros.php?id=${id}`);
                await obtenerLibros();
                alertify.success('Eliminado');
            }, null);
        };
        const cancelarEdicionLibro = () => { formLibro.value = { id: null, titulo: '', autor: '', categoria_id: '', isbn: '', stock_total: 1, portada_url: '' }; editModeLibro.value = false; isbnError.value = ''; };
        const librosFiltrados = computed(() => {
            const arr = Array.isArray(libros.value) ? libros.value : [];
            const qr = filtroLibro.value.toLowerCase().trim();
            if (!qr) return arr;
            return arr.filter(l => l.titulo.toLowerCase().includes(qr) || l.isbn?.includes(qr) || l.autor.toLowerCase().includes(qr));
        });

        const procesarImagenArchivo = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { alertify.error('Máx 2MB'); return; }
            const reader = new FileReader();
            reader.onload = (e) => { formLibro.value.portada_url = e.target.result; };
            reader.readAsDataURL(file);
        };

        const buscarLibroISBN = async () => {
            if (!formLibro.value.isbn) return;
            isSearching.value = true;
            try {
                const { data } = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${formLibro.value.isbn}`);
                if (data.totalItems > 0) {
                    const info = data.items[0].volumeInfo;
                    formLibro.value.titulo = info.title || '';
                    formLibro.value.autor = info.authors ? info.authors.join(', ') : '';
                    formLibro.value.portada_url = info.imageLinks?.thumbnail || '';
                    alertify.success('Datos recuperados');
                } else {
                    alertify.warning('No encontrado');
                }
            } catch (e) { alertify.error('Error de conexión con API Google Books'); }
            finally { isSearching.value = false; }
        };

        // --- PRESTAMOS ---
        const editModePrestamo = ref(false);
        const formPrestamo = ref({ id: null, libro_id: '', usuario_id: '', fecha_inicio: '', fecha_vencimiento: '', estado: 'activo' });

        const guardarPrestamo = async () => {
            isSaving.value = true;
            try {
                if (editModePrestamo.value) {
                    await axios.put('/prestamos.php', formPrestamo.value);
                    alertify.success('Préstamo actualizado');
                } else {
                    await axios.post('/prestamos.php', formPrestamo.value);
                    alertify.success('Préstamo registrado');
                }
                await obtenerPrestamos();
                cancelarEdicionPrestamo();
            } catch (e) { alertify.error('Error al guardar préstamo. ' + (e.response?.data?.error || '')); }
            finally { isSaving.value = false; }
        };
        const editarPrestamo = (p) => { formPrestamo.value = { ...p }; editModePrestamo.value = true; };
        const eliminarPrestamo = async (id) => {
            alertify.confirm('¿Borrar registro?', async () => {
                await axios.delete(`/prestamos.php?id=${id}`);
                await obtenerPrestamos();
            }, null);
        };
        const devolverLibro = async (id) => {
            await axios.put('/prestamos.php', { id, action: 'devolver' }); // requires backend update, or just full update
            await obtenerPrestamos();
            alertify.success('Libro devuelto');
        };
        const cancelarEdicionPrestamo = () => { editModePrestamo.value = false; formPrestamo.value = { id: null, libro_id: '', usuario_id: '', fecha_inicio: '', fecha_vencimiento: '', estado: 'activo' }; };

        const misPrestamos = computed(() => {
            const arr = Array.isArray(prestamos.value) ? prestamos.value : [];
            return arr.filter(p => p.estado === 'activo');
        });

        const prestamosActivos = computed(() => {
            const arr = Array.isArray(prestamos.value) ? prestamos.value : [];
            return arr.filter(p => p.estado === 'activo' || p.estado === 'Prestado').length;
        });

        const prestamosRecientes = computed(() => {
            if (!prestamos.value || !Array.isArray(prestamos.value)) return [];
            return [...prestamos.value].reverse();
        });

        const autoPrestamo = async (idLibro) => {
            const hoy = new Date();
            const fecha_inicio = hoy.toISOString().split('T')[0];
            const devolucionDate = new Date();
            devolucionDate.setDate(hoy.getDate() + 7);
            const fecha_vencimiento = devolucionDate.toISOString().split('T')[0];
            try {
                await axios.post('/prestamos.php', {
                    libro_id: idLibro,
                    usuario_id: simuladorLoginId.value,
                    fecha_inicio,
                    fecha_vencimiento,
                    estado: 'activo'
                });
                await obtenerPrestamos();
                router.push('/inicio/estante');
                alertify.success('Libro añadido a tu estante.');
            } catch (e) { alertify.error('El libro no tiene stock disponible o ya lo tienes.'); }
        };

        const guardarAnotacion = async (id, nota) => {
            await axios.put('/prestamos.php', { id, anotaciones: nota, action: 'anotar' });
            alertify.success('Nota guardada');
        };

        const generarCitaAPA = (id) => {
            const libro = libros.value.find(l => l.id == id);
            if (!libro) return;
            const anio = libro.edicion || new Date().getFullYear();
            const cita = `${libro.autor || 'S/A'}. (${anio}). <i>${libro.titulo}</i>. ${libro.editorial || 'S/E'}.`;
            alertify.alert('Referencia Bibliográfica (APA)', cita);
        };

        const esAtrasado = (fecha, estado) => estado === 'activo' && fecha < new Date().toISOString().split('T')[0];

        // --- HELPERS BÁSICOS ---
        const obtenerTituloLibro = (id) => { const l = libros.value.find(x => x.id == id); return l ? l.titulo : 'Desconocido'; };
        const obtenerNombreUsuario = (id) => { const u = usuarios.value.find(x => x.id == id); return u ? u.nombre : 'Desconocido'; };
        const obtenerNombreCategoria = (id) => { const c = categorias.value.find(x => x.id == id); return c ? c.nombre : 'Sin categoría'; };
        const obtenerNombreAutor = (id) => { return id; }; // id here is the text name

        // --- CHART JS ---
        let myChart = null;
        const renderChart = () => {
            if (rolActual.value !== 'admin' || currentTab.value !== 'dashboard') return;
            setTimeout(() => {
                const ctx = document.getElementById('popularBooksChart');
                if (!ctx) return;
                if (myChart) myChart.destroy();
                const counts = {};
                const prestamosArr = Array.isArray(prestamos.value) ? prestamos.value : [];
                prestamosArr.forEach(p => { counts[p.libro_id] = (counts[p.libro_id] || 0) + 1; });
                const top = Object.keys(counts).sort((a,b)=>counts[b]-counts[a]).slice(0,5).map(id => ({ t: obtenerTituloLibro(id), c: counts[id] }));
                if (!top.length) return;
                myChart = new window.Chart(ctx, {
                    type: 'bar',
                    data: { labels: top.map(x=>x.t.substring(0,20)+'..'), datasets: [{ label: 'Prestamos', data: top.map(x=>x.c), backgroundColor: 'blue'}] }
                });
            }, 300);
        };

        watch(currentTab, () => renderChart());
        watch(prestamos, () => renderChart(), { deep: true });

        onMounted(async () => {
            await obtenerCategorias();
            await obtenerLibros();
            await obtenerPrestamos();
            if (rolActual.value === 'admin') await obtenerUsuarios();
            renderChart();
        });

        const procesarUsuariosCSV = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('csv', file);
            isSaving.value = true;
            try {
                const res = await axios.post('/usuarios.php?importar=1', formData, { headers: { 'Content-Type': 'multipart/form-data'}});
                alertify.success(res.data.aviso || 'Usuarios importados');
                await obtenerUsuarios();
            } catch (e) {
                alertify.error('Error importando el CSV');
            } finally {
                isSaving.value = false;
                event.target.value = '';
            }
        };

        return {
            currentTab, rolActual, isSaving, isSearching, isbnError, vistaGaleria,
            categorias, editModeCategoria, formCategoria, guardarCategoria, editarCategoria, eliminarCategoria, cancelarEdicionCategoria, obtenerNombreCategoria,
            usuarios, filtroUsuario, editModeUsuario, formUsuario, guardarUsuario, editarUsuario, eliminarUsuario, cancelarEdicionUsuario, usuariosFiltrados, obtenerNombreUsuario, procesarUsuariosCSV,
            libros, filtroLibro, editModeLibro, formLibro, guardarLibro, editarLibro, eliminarLibro, cancelarEdicionLibro, librosFiltrados, obtenerTituloLibro, procesarImagenArchivo, buscarLibroISBN, obtenerNombreAutor, ultimosLibros,
            prestamos, editModePrestamo, formPrestamo, guardarPrestamo, editarPrestamo, eliminarPrestamo, cancelarEdicionPrestamo, devolverLibro, misPrestamos, autoPrestamo, guardarAnotacion, esAtrasado, generarCitaAPA, prestamosActivos, prestamosRecientes, autores,
            // dummy variables to prevent errors in existing HTML since we removed autores
            formAutor: {}, filtroAutor: '', editModeAutor: false, guardarAutor:()=>{}, editarAutor:()=>{}, cancelarEdicionAutor:()=>{}, eliminarAutor:()=>{}, autoresFiltrados: [] 
        };
    }
};

// Router y Guards
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView, name: 'login' },
    { path: '/admin/:tab?', component: MainView, name: 'admin', meta: { requiresAuth: true, role: 'admin' } },
    { path: '/inicio/:tab?', component: MainView, name: 'inicio', meta: { requiresAuth: true, role: 'lector' } }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (to.meta.requiresAuth) {
        if (!token) {
            return next('/login');
        }
        if (to.meta.role && to.meta.role !== user.rol) {
            // Bloquear acceso si rol es incorrecto
            if (user.rol === 'admin') return next('/admin/dashboard');
            else return next('/inicio/catalogo');
        }
    }
    
    // Si va al login estando autenticado, redirigir a su panel
    if (to.path === '/login' && token) {
        if (user.rol === 'admin') return next('/admin/dashboard');
        else return next('/inicio/catalogo');
    }
    
    next();
});

// App Root
const App = {
    setup() {
        const estaAutenticado = ref(false);
        const nombreUsuario = ref('');
        const rolActual = ref('');
        const darkMode = ref(localStorage.getItem('theme') === 'dark');
        const router = useRouter();
        const route = useRoute();
        const sidebarVisible = ref(false);
        const windowWidth = ref(window.innerWidth);
        const currentTab = computed(() => route.params.tab || '');

        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            estaAutenticado.value = !!token;
            if (user.nombre) {
                nombreUsuario.value = user.nombre;
                rolActual.value = user.rol;
            }
        };

        checkAuth();
        window.addEventListener('auth-changed', checkAuth);

        const cerrarSesion = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            checkAuth();
            router.push('/login');
        };

        const applyTheme = () => {
            document.documentElement.setAttribute('data-bs-theme', darkMode.value ? 'dark' : 'light');
            localStorage.setItem('theme', darkMode.value ? 'dark' : 'light');
        };
        applyTheme();

        const toggleDarkMode = () => {
            darkMode.value = !darkMode.value;
            applyTheme();
        };

        const irA = (tab) => {
            if (rolActual.value === 'admin') {
                router.push(`/admin/${tab}`);
            } else {
                router.push(`/inicio/${tab}`);
            }
        };

        return { estaAutenticado, nombreUsuario, rolActual, darkMode, toggleDarkMode, cerrarSesion, sidebarVisible, windowWidth, currentTab, irA };
    }
};

const app = createApp(App);
app.use(router);
app.config.errorHandler = (err, vm, info) => {
    console.error(err);
    alert('Fallo de Vue: ' + err.message + '\nInfo: ' + info);
};
app.mount('#app');
