const fs = require('fs');
const pathJs = 'c:\\xampp\\htdocs\\Takahashi-s-Biblioteca\\main.js';

let js = fs.readFileSync(pathJs, 'utf8');

// Extraer DashboardLayout
const regexDashboard = /\/\/ VISTA LAYOUT DEL DASHBOARD \(Navbar \+ Sidebar\)[\s\S]*?const DashboardLayout = \{[\s\S]*?return \{[\s\S]*?\};\n    \}\n\};\n/;
const match = js.match(regexDashboard);

if (match) {
    const dashboardLayoutCode = match[0];
    
    // Removerlo de su posición actual
    js = js.replace(dashboardLayoutCode, '');
    
    // Insertarlo antes de `const routes = [`
    js = js.replace('const routes = [', dashboardLayoutCode + '\nconst routes = [');
    
    fs.writeFileSync(pathJs, js, 'utf8');
    console.log('Reordenamiento completado.');
} else {
    console.log('No se encontró DashboardLayout.');
}
