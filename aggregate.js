const fs = require('fs');
const path = require('path');

const files = [
    'biblioteca_schema.sql',
    'index.html',
    'main.js',
    'api/config.php',
    'api/login.php',
    'api/categorias.php',
    'api/usuarios.php',
    'api/libros.php',
    'api/prestamos.php'
];

let output = '=== RECOPILACIÓN DE CÓDIGO DEL AGENTE IA ===\n\n';

for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        output += `\n======================================================\n`;
        output += `ARCHIVO: ${file}\n`;
        output += `======================================================\n\n`;
        output += fs.readFileSync(fullPath, 'utf8');
        output += `\n\n`;
    }
}

fs.writeFileSync(path.join(__dirname, 'Codigo_Completo_IA.txt'), output, 'utf8');
console.log('Done');
