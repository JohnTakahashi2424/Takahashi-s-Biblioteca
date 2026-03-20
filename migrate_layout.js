const fs = require('fs');
const pathHtml = 'c:\\xampp\\htdocs\\Takahashi-s-Biblioteca\\index.html';
const pathJs = 'c:\\xampp\\htdocs\\Takahashi-s-Biblioteca\\main.js';

let html = fs.readFileSync(pathHtml, 'utf8');
let js = fs.readFileSync(pathJs, 'utf8');

// --- 1. EXTRAER NAVBAR Y SIDEBAR DE INDEX.HTML ---
const searchStart = '<nav v-if="estaAutenticado" class="navbar';
const searchEnd = '<!-- Vista para usuarios NO autenticados (Login) -->';

const startIndex = html.indexOf(searchStart);
const endIndex = html.indexOf(searchEnd);

if (startIndex !== -1 && endIndex !== -1) {
    // Todo lo que está entre startIndex y endIndex es el Layout
    let layoutHtml = html.substring(startIndex, endIndex);
    
    // Le quitamos el v-if="estaAutenticado" al nav y al div d-flex principal
    layoutHtml = layoutHtml.replace('<nav v-if="estaAutenticado"', '<nav');
    layoutHtml = layoutHtml.replace('<div v-if="estaAutenticado"', '<div');

    // Construimos el nuevo template
    const newTemplate = `
    <template id="tmpl-dashboard-layout">
        <div class="d-flex flex-column min-vh-100 w-100">
            ${layoutHtml}
        </div>
    </template>
    `;

    // En el div#app dejamos solo el router-view maestro
    const appContent = `
<div id="app" v-cloak class="shadow-sm min-vh-100 d-flex flex-column bg-body-tertiary">
    <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
            <component :is="Component" />
        </transition>
    </router-view>
</div>
`;
    // Reemplazamos en el HTML original
    const fullAppStart = html.indexOf('<div id="app"');
    const fullAppEnd = html.indexOf('</div>\n\n\n\n    <!-- TEMPLATES DE VUE ROUTER -->');
    
    // Fallback if not exactly that string
    const fallbackEnd = html.indexOf('<!-- TEMPLATES DE VUE ROUTER -->');
    // Buscamos el cierre correcto de app
    
    const beforeApp = html.substring(0, fullAppStart);
    const afterApp = html.substring(fallbackEnd);
    
    html = beforeApp + appContent + "\n\n" + newTemplate + "\n\n" + afterApp;
}

fs.writeFileSync(pathHtml, html, 'utf8');

// --- 2. MODIFICAR MAIN.JS --
// Movemos variables y metodos del App setup() al DashboardLayout setup()
// Para hacerlo fácil, vamos a inyectar el componente DashboardLayout justo antes de App

const dashboardLayoutCode = `
// VISTA LAYOUT DEL DASHBOARD (Navbar + Sidebar)
const DashboardLayout = {
    template: '#tmpl-dashboard-layout',
    setup() {
        const nombreUsuario = ref('');
        const rolActual = ref('');
        const darkMode = ref(localStorage.getItem('theme') === 'dark');
        const router = useRouter();
        const route = useRoute();
        const sidebarVisible = ref(false);
        const windowWidth = ref(window.innerWidth);
        const currentTab = computed(() => {
            // Check if there is a child route param, or default
            if(route.name === 'admin' && !route.params.tab) return 'dashboard';
            if(route.name === 'inicio' && !route.params.tab) return 'catalogo';
            return route.params.tab || '';
        });

        const checkAuth = () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
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
                router.push(\`/admin/\${tab}\`);
            } else {
                router.push(\`/inicio/\${tab}\`);
            }
        };

        return { 
            nombreUsuario, rolActual, darkMode, toggleDarkMode, 
            cerrarSesion, sidebarVisible, windowWidth, currentTab, irA 
        };
    }
};
`;

// Limpiamos 'App' setup para que sea nulo ya que ahora App solo renderiza el root router-view
js = js.replace(/const App = \{[\s\S]*?return \{.*?\};\n    \}\n\};/, `const App = { setup() { return {}; } };\n\n${dashboardLayoutCode}`);

// Actualizamos las Rutas
const newRoutes = `
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView, name: 'login' },
    { 
        path: '/admin', 
        component: DashboardLayout, 
        meta: { requiresAuth: true, role: 'admin' },
        children: [
            { path: '', redirect: '/admin/dashboard' },
            { path: ':tab', component: MainView, name: 'admin' }
        ]
    },
    { 
        path: '/inicio', 
        component: DashboardLayout, 
        meta: { requiresAuth: true, role: 'lector' },
        children: [
            { path: '', redirect: '/inicio/catalogo' },
            { path: ':tab', component: MainView, name: 'inicio' }
        ]
    }
];
`;

js = js.replace(/const routes = \[[\s\S]*?\];/, newRoutes.trim());

fs.writeFileSync(pathJs, js, 'utf8');
console.log('Migración Completada.');
