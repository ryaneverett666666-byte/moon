// Конфигурация Puppeteer для встроенного браузерного инструмента расширения VS Code.
// Расширение использует puppeteer-core и требует явный путь к браузеру.
// Google Chrome не установлен, поэтому указываем Microsoft Edge (движок Chromium).
module.exports = {
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
};