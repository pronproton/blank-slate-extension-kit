
export const sendToOllama = async (message: string): Promise<string> => {
  try {
    // Check if we're in extension environment
    if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.runtime) {
      // Use background script for extension
      return new Promise((resolve) => {
        (window as any).chrome.runtime.sendMessage(
          { 
            action: 'sendToTitan', 
            message: message 
          },
          (response: any) => {
            if (response.success) {
              resolve(response.content);
            } else {
              resolve(response.error || 'Ошибка при обращении к AI');
            }
          }
        );
      });
    } else {
      // Fallback for non-extension environment
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'titan-assistant',
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message?.content || 'AI не ответил';
    }
  } catch (error) {
    console.error('Ошибка при обращении к Titan:', error);
    if (error instanceof Error && error.name === 'TypeError') {
      return 'Ошибка: не удается подключиться к AI серверу (проверь что Ollama запущен)';
    }
    return `Ошибка AI: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
  }
};
