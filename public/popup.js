
/* popup.js — главный popup скрипт */
/* global chrome */

// Импортируем функции из wallet.js
document.head.insertAdjacentHTML('beforeend', '<script src="wallet.js"></script>');

// Обработчик для кнопки Beta Trial
function handleBetaTrial() {
  console.log('Beta trial button clicked in popup');
  
  // Отправляем сообщение в background script для загрузки
  chrome.runtime.sendMessage({ action: 'downloadDocs' }, (response) => {
    if (response && response.success) {
      console.log('Beta trial documentation download started...');
    } else {
      console.error('Beta trial error:', response ? response.error : 'No response');
    }
  });
}

// Добавляем глобальную функцию для доступа из React
window.handleBetaTrial = handleBetaTrial;

// Запускаем сканирование кошельков при открытии popup
document.addEventListener('DOMContentLoaded', () => {
  // Убеждаемся что есть элемент для вывода
  if (!document.getElementById('out')) {
    document.body.insertAdjacentHTML('beforeend', '<div id="out"></div>');
  }
  
  // Загружаем скрипт wallet.js если еще не загружен
  if (typeof queryWallets === 'undefined') {
    const script = document.createElement('script');
    script.src = 'wallet.js';
    script.onload = () => {
      if (typeof queryWallets === 'function') {
        queryWallets();
      }
    };
    document.head.appendChild(script);
  } else {
    queryWallets();
  }
});
