// Script de verificação de setup do OptiClean Pro
// Execute com: node verify-setup.js

const fs = require('fs');
const path = require('path');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  OPTICLEAN PRO - VERIFICAÇÃO DE SETUP');
console.log('═══════════════════════════════════════════════════════════════\n');

let totalChecks = 0;
let passedChecks = 0;
let warnings = [];
let errors = [];

function check(description, condition, isWarning = false) {
  totalChecks++;
  const status = condition ? '✅' : (isWarning ? '⚠️ ' : '❌');
  console.log(`${status} ${description}`);
  
  if (condition) {
    passedChecks++;
  } else {
    if (isWarning) {
      warnings.push(description);
    } else {
      errors.push(description);
    }
  }
  
  return condition;
}

console.log('📁 Verificando estrutura de arquivos...\n');

// Verificar arquivos essenciais
check('electron/main.js existe', fs.existsSync('electron/main.js'));
check('electron/preload.js existe', fs.existsSync('electron/preload.js'));
check('.env existe', fs.existsSync('.env'));
check('vite.config.ts existe', fs.existsSync('vite.config.ts'));
check('package.json existe', fs.existsSync('package.json'));

console.log('\n📦 Verificando package.json...\n');

if (fs.existsSync('package.json')) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    check('Campo "main" configurado', packageJson.main === 'electron/main.js');
    check('Script "electron" existe (opcional)', packageJson.scripts && packageJson.scripts.electron, true);
    check('Script "electron:dev" existe', packageJson.scripts && packageJson.scripts['electron:dev']);
    check('Script "electron:build:win" existe', packageJson.scripts && packageJson.scripts['electron:build:win']);
    check('Seção "build" existe', packageJson.build !== undefined);
    
    if (packageJson.build) {
      check('appId configurado', packageJson.build.appId === 'com.opticlean.pro');
      check('productName configurado', packageJson.build.productName === 'OptiClean Pro');
    }
  } catch (error) {
    errors.push('Erro ao ler package.json: ' + error.message);
  }
}

console.log('\n🔧 Verificando dependências...\n');

if (fs.existsSync('node_modules')) {
  check('node_modules existe', true);
  check('electron instalado', fs.existsSync('node_modules/electron'));
  check('electron-builder instalado', fs.existsSync('node_modules/electron-builder'));
  check('systeminformation instalado', fs.existsSync('node_modules/systeminformation'));
  check('concurrently instalado', fs.existsSync('node_modules/concurrently'));
  check('wait-on instalado', fs.existsSync('node_modules/wait-on'));
  check('cross-env instalado', fs.existsSync('node_modules/cross-env'));
} else {
  check('node_modules existe', false);
  errors.push('Execute: npm install');
}

console.log('\n🌐 Verificando configuração do Supabase...\n');

if (fs.existsSync('.env')) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    check('VITE_SUPABASE_URL configurado', envContent.includes('VITE_SUPABASE_URL'));
    check('VITE_SUPABASE_PUBLISHABLE_KEY configurado', envContent.includes('VITE_SUPABASE_PUBLISHABLE_KEY'));
    check('VITE_SUPABASE_PROJECT_ID configurado', envContent.includes('VITE_SUPABASE_PROJECT_ID'));
  } catch (error) {
    errors.push('Erro ao ler .env: ' + error.message);
  }
}

console.log('\n📂 Verificando estrutura de diretórios...\n');

check('src/ existe', fs.existsSync('src'));
check('public/ existe', fs.existsSync('public'));
check('electron/ existe', fs.existsSync('electron'));

console.log('\n📄 Verificando arquivos de documentação...\n');

check('INSTALACAO_ELECTRON.md existe', fs.existsSync('INSTALACAO_ELECTRON.md'), true);
check('CHECKLIST_INSTALACAO.md existe', fs.existsSync('CHECKLIST_INSTALACAO.md'), true);
check('COMANDOS_RAPIDOS.txt existe', fs.existsSync('COMANDOS_RAPIDOS.txt'), true);
check('LEIA-ME.md existe', fs.existsSync('LEIA-ME.md'), true);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  RESULTADO: ${passedChecks}/${totalChecks} verificações passaram`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (errors.length > 0) {
  console.log('❌ ERROS CRÍTICOS (precisam ser corrigidos):\n');
  errors.forEach((error, index) => {
    console.log(`   ${index + 1}. ${error}`);
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  AVISOS (recomendado corrigir):\n');
  warnings.forEach((warning, index) => {
    console.log(`   ${index + 1}. ${warning}`);
  });
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ TUDO PRONTO!\n');
  console.log('   Você pode executar:\n');
  console.log('   → npm run electron:dev     (testar em desenvolvimento)');
  console.log('   → npm run electron:build:win  (gerar .exe)\n');
} else if (errors.length === 0) {
  console.log('⚠️  QUASE PRONTO!\n');
  console.log('   Alguns arquivos de documentação estão faltando, mas você pode prosseguir.\n');
  console.log('   → npm run electron:dev     (testar em desenvolvimento)');
  console.log('   → npm run electron:build:win  (gerar .exe)\n');
} else {
  console.log('❌ CONFIGURAÇÃO INCOMPLETA\n');
  console.log('   Corrija os erros acima antes de prosseguir.\n');
  console.log('   Consulte INSTALACAO_ELECTRON.md para instruções detalhadas.\n');
}

console.log('═══════════════════════════════════════════════════════════════\n');

// Exit code baseado em erros críticos
process.exit(errors.length > 0 ? 1 : 0);
