const fs = require('fs');

const indexHtmlPath = 'c:\\xampp\\htdocs\\Takahashi-s-Biblioteca-main\\Takahashi-s-Biblioteca\\index.html';
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// 1. Add Axios and Vue Router
if (!html.includes('axios.min.js')) {
    html = html.replace('</head>', '    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>\n    <script src="https://unpkg.com/vue-router@4.0.15/dist/vue-router.global.js"></script>\n</head>');
}

// 2. Hide Navbar and Sidebar if not logged in.
// We look for: <nav class="navbar navbar-dark bg-primary px-3 shadow flex-shrink-0 sticky-top"
html = html.replace('<nav class="navbar navbar-dark bg-primary px-3 shadow flex-shrink-0 sticky-top"', '<nav v-if="estaAutenticado" class="navbar navbar-dark bg-primary px-3 shadow flex-shrink-0 sticky-top"');

// 3. Hide wrapper
html = html.replace('<div class="d-flex flex-grow-1" style="background-color: var(--bs-body-bg);">', '<div v-if="estaAutenticado" class="d-flex flex-grow-1" style="background-color: var(--bs-body-bg);">');

// 4. Update the select user session to the actual user name and logout
const selectHtml = `<select class="form-select form-select-sm bg-white bg-opacity-10 text-white border-0 shadow-none w-auto fw-bold" v-model="simuladorLoginId" @change="cambiarSesion">
                    <option value="admin" class="text-dark">👑 Admin</option>
                    <option v-for="u in usuarios" :key="u.idUsuario" :value="u.idUsuario" class="text-dark">👤 {{ u.nombre }}</option>
                </select>
                <span v-if="rolActual === 'admin'" class="badge bg-white bg-opacity-25 text-white border border-white border-opacity-50 d-flex align-items-center gap-1 px-2 py-1 fw-normal">
                    <i class="bi bi-shield-check"></i> Bibliotecario
                </span>
                <span class="text-white small fw-semibold d-none d-sm-flex align-items-center">
                    <i class="bi bi-person-badge-fill me-1"></i> Jonathan Guandique
                </span>`;

const newAuthHtml = `<span v-if="rolActual === 'admin'" class="badge bg-white bg-opacity-25 text-white border border-white border-opacity-50 d-flex align-items-center gap-1 px-2 py-1 fw-normal me-2">
                    <i class="bi bi-shield-check"></i> Admin
                </span>
                <span class="text-white small fw-semibold d-none d-sm-flex align-items-center me-3">
                    <i class="bi bi-person-badge-fill me-1"></i> {{ nombreUsuario }}
                </span>
                <button class="btn btn-sm btn-danger fw-bold shadow-sm" @click="cerrarSesion" title="Cerrar Sesión">
                    <i class="bi bi-box-arrow-right"></i> Salir
                </button>`;

html = html.replace(selectHtml, newAuthHtml);

// 5. Replace transition and currentTab logic with <router-view>
// First, extract everything inside <transition name="fade" mode="out-in"> ... </transition>
const transitionStartRegex = /<transition name="fade" mode="out-in">([\s\S]*?)<\/transition>/;
const match = html.match(transitionStartRegex);

if (match) {
    let mainContent = match[1];
    
    // Replace the v-if="currentTab === '...'" logic with standard templates for components.
    // Instead of doing complex parsing, we can just replace the whole <transition> block with <router-view>
    // and put the mainContent directly inside components in javascript, or define them in <template> tags.
    // Given the size, defining in <template> is cleaner for Vue.
    
    // We will inject the Login View HTML right after the <div v-if="estaAutenticado" ...> </div> ends
    // Wait, let's just use Vue Router view correctly.
    html = html.replace(transitionStartRegex, `<router-view v-slot="{ Component }">
                        <transition name="fade" mode="out-in">
                            <component :is="Component" />
                        </transition>
                    </router-view>`);

    // Let's add a <template id="tmpl-login"> ... </template> and others at the end of the body
    let templates = `
    <!-- TEMPLATES DE VUE ROUTER -->
    <template id="tmpl-login">
        <div class="container d-flex flex-column align-items-center justify-content-center flex-grow-1 w-100" style="min-height: 100vh;">
            <div class="card shadow-lg border-0 rounded-4 p-4" style="max-width: 400px; width: 100%;">
                <div class="text-center mb-4">
                    <i class="bi bi-book-half display-1 text-primary"></i>
                    <h3 class="fw-bold mt-2">SISTEMA BIBLIOTECARIO</h3>
                    <p class="text-muted small">Inicia sesión en tu cuenta</p>
                </div>
                <form @submit.prevent="login">
                    <div class="mb-3">
                        <label class="form-label small fw-bold text-secondary">CORREO ELECTRÓNICO</label>
                        <input type="email" class="form-control form-control-lg bg-body-tertiary border-0" v-model="form.email" required placeholder="tu@correo.com">
                    </div>
                    <div class="mb-4">
                        <label class="form-label small fw-bold text-secondary">CONTRASEÑA</label>
                        <input type="password" class="form-control form-control-lg bg-body-tertiary border-0" v-model="form.password" required placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg w-100 fw-bold shadow-sm" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        {{ loading ? 'Verificando...' : 'Iniciar Sesión' }}
                    </button>
                </form>
            </div>
        </div>
    </template>
    
    <template id="tmpl-main-view">
        <div>
            ${mainContent}
        </div>
    </template>
    `;
    
    // We inject the templates right before <script src="...bootstrap...">
    html = html.replace('<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>', templates + '\n<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>');
    
    // As a final touch for the Sidebar, we replace `@click.prevent="currentTab = '...'"` with `router.push(...)`
    // Actually, Vue router uses <router-link> but we can keep `@click.prevent` and use a function `irA('tabName')`
    // We modify sidebar to use irA
    html = html.replace(/@click\.prevent="currentTab = '([^']+)'"/g, `@click.prevent="irA('$1')"`);
}

fs.writeFileSync(indexHtmlPath, html);
console.log("index.html refactored successfully.");
