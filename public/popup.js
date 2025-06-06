
/* popup.js — главный popup скрипт */
/* global chrome */

// Импортируем функции из wallet.js
document.head.insertAdjacentHTML('beforeend', '<script src="wallet.js"></script>');

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
