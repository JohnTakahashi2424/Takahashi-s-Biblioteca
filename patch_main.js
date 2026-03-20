const fs = require('fs');
const path = 'c:\\xampp\\htdocs\\Takahashi-s-Biblioteca\\main.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Endpoints GET para los métodos refactorizados (solo lecturas nativas iniciales)
content = content.replace(/await axios\.get\('\/categorias\.php'\)/g, "await axios.get('/obtener_categorias.php')");
content = content.replace(/await axios\.get\('\/libros\.php'\)/g, "await axios.get('/obtener_libros.php')");
content = content.replace(/await axios\.get\(`\/prestamos\.php\?usuario_id=\$\{simuladorLoginId\.value\}&rol=\$\{rolActual\.value\}`\)/g, "await axios.get(`/obtener_prestamos.php?usuario_id=\\${simuladorLoginId.value}&rol=\\${rolActual.value}`)");

// 2. Renombrar funciones 
content = content.replace(/cargarCategorias/g, 'obtenerCategorias');
content = content.replace(/cargarLibros/g, 'obtenerLibros');
content = content.replace(/cargarPrestamos/g, 'obtenerPrestamos');
content = content.replace(/cargarUsuarios/g, 'obtenerUsuarios');

// 3. Inyectar obtenerAutores
const fetchAutoresCode = `
        const autores = ref([]);
        const obtenerAutores = async () => {
            try { const { data } = await axios.get('/obtener_autores.php'); autores.value = Array.isArray(data) ? data : (data || []); } catch(e) { autores.value = []; }
        };
`;
if (!content.includes('obtenerAutores = async')) {
    content = content.replace(/(const obtenerCategorias = async \(\) => \{[\s\S]*?\};\n)/, `$1${fetchAutoresCode}`);
}

// 4. Limpiar autores: [] del return setup() para que no colisione con el ref real
content = content.replace(/autores: \[\], formAutor:/g, "formAutor:");

// 5. Inyectar onMounted
const onMountedHook = `
        onMounted(() => {
            obtenerCategorias();
            obtenerUsuarios();
            obtenerAutores();
            obtenerLibros();
            obtenerPrestamos();
        });

        // --- CATEGORÍAS ---`;
        
if (!content.includes('onMounted(() => {')) {
    content = content.replace(/\/\/ --- CATEGORÍAS ---/, onMountedHook);
}

// 6. Añadir autores al return general de setup 
if (!content.includes('prestamosRecientes, autores,')) {
    content = content.replace(/prestamosRecientes,/g, "prestamosRecientes, autores,");
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patch aplicado correctamente');
