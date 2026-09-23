/* build_engine.js — собирает engine.module.js (three.js r160 + OrbitControls)
   в ОДИН самодостаточный ES-модуль в корне проекта.
   Цель: исключить import map и подпапку vendor/ из рантайма игры,
   чтобы исключить любые 404 на стороне хостинга Яндекс Игр.

   ВАЖНО: three.module.js и OrbitControls.js оба объявляют приватные
   переменные с одинаковыми именами (_ray, _v1 и т.п.) на уровне модуля,
   поэтому тело OrbitControls оборачивается в IIFE — его внутренние
   объявления изолируются, а класс привязывается к namespace THREE
   и дополнительно экспортируется по имени. */
'use strict';
const fs = require('fs');

const threeSrc = fs.readFileSync('vendor/three.module.js', 'utf8');
const orbitSrc = fs.readFileSync('vendor/controls/OrbitControls.js', 'utf8');

// 1. Убрать ведущий import {...} from 'three' у OrbitControls.
let orbitBody = orbitSrc.replace(/^import\s*\{[\s\S]*?\}\s*from\s*'three';\s*/, '');
if (!orbitBody.includes('class OrbitControls')) {
  throw new Error('Не удалось вырезать import из OrbitControls.js');
}

// 2. Убрать хвостовой export { OrbitControls }; (внутри IIFE он недопустим).
orbitBody = orbitBody.replace(/\nexport\s*\{\s*OrbitControls\s*\}\s*;?\s*$/, '');

// 3. Достать имена экспортов three.module.js из финального export {...};
const m = threeSrc.match(/\nexport\s*\{\s*([\s\S]*?)\s*\}\s*;?\s*$/);
if (!m) throw new Error('Не найден финальный export в three.module.js');
const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
if (names.length < 100) throw new Error('Подозрительно мало экспортов: ' + names.length);

// 4. Построить объект-пространство имён THREE (игра использует THREE.Scene и т.п.)
const ns = 'const THREE = {\n' + names.map(n => '\t' + n).join(',\n') + '\n};\n';

// 5. Склеить итоговый модуль.
const out =
  threeSrc +
  '\n\n' +
  ns +
  '\n' +
  'const OrbitControls = (function ( threeNS ) {\n' +
  '\n' +
  orbitBody +
  '\n' +
  '\tthreeNS.OrbitControls = OrbitControls;\n' +
  '\treturn OrbitControls;\n' +
  '} )( THREE );\n' +
  '\n' +
  'export { OrbitControls };\n' +
  'export default THREE;\n';

fs.writeFileSync('engine.module.js', out);
console.log('OK: engine.module.js (%d байт, экспортов: %d)', out.length, names.length);