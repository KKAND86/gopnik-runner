/**
 * TelegramManager — обёртка над Telegram WebApp API
 * Предоставляет единый интерфейс для всех сцен
 */
class TelegramManager {
  constructor() {
    this.tg = null;
    this.initialized = false;
    this.user = null;
  }

  /**
   * Проверить, запущены ли мы в Telegram WebApp
   */
  isTelegram() {
    return !!(window.Telegram?.WebApp);
  }

  /**
   * Инициализация WebApp
   * Вызывать один раз при старте
   */
  init() {
    if (!this.isTelegram()) {
      console.log('[Telegram] Не в WebApp, режим standalone');
      return false;
    }

    this.tg = window.Telegram.WebApp;

    // Сообщаем Telegram, что приложение готово
    this.tg.ready();

    // Разворачиваем на весь экран
    this.tg.expand();

    // Пробуем запросить полноэкранный режим (beta, не везде работает)
    if (this.tg.requestFullscreen) {
      this.tg.requestFullscreen();
    }

    // Устанавливаем цвет фона под игру
    this.tg.setBackgroundColor('#1a1a1a');
    this.tg.setHeaderColor('#1a1a1a');

    // Скрываем стандартную кнопку "назад", управляем сами
    if (this.tg.BackButton) {
      this.tg.BackButton.hide();
    }

    // Получаем данные пользователя
    this.user = this.tg.initDataUnsafe?.user || null;
    if (this.user) {
      console.log('[Telegram] Пользователь:', this.user.username || this.user.first_name);
    }

    // Слушаем изменения темы (если пользователь переключил день/ночь в Telegram)
    this.tg.onEvent('themeChanged', () => {
      console.log('[Telegram] Тема изменена:', this.tg.colorScheme);
    });

    this.initialized = true;
    console.log('[Telegram] WebApp инициализирован');
    return true;
  }

  /**
   * Получить имя пользователя для отображения
   */
  getDisplayName() {
    if (!this.user) return 'Гопник';
    return this.user.username
      ? '@' + this.user.username
      : this.user.first_name || 'Гопник';
  }

  /**
   * Получить ID пользователя (для лидерборда)
   */
  getUserId() {
    return this.user?.id || null;
  }

  /**
   * Показать MainButton (зелёная кнопка внизу экрана)
   * @param {string} text — текст кнопки
   * @param {Function} onClick — коллбек
   * @param {string} color — hex цвет (опционально)
   */
  showMainButton(text, onClick, color = '#2ecc71') {
    if (!this.tg?.MainButton) return;

    this.tg.MainButton.setText(text);
    this.tg.MainButton.setParams({
      color: color,
      text_color: '#ffffff',
      is_active: true,
      is_visible: true
    });

    // Убираем старый слушатель, если был
    this.tg.MainButton.offClick?.();
    this.tg.MainButton.onClick(onClick);
    this.tg.MainButton.show();
  }

  /**
   * Скрыть MainButton
   */
  hideMainButton() {
    if (!this.tg?.MainButton) return;
    this.tg.MainButton.hide();
  }

  /**
   * Показать BackButton (стрелка в шапке)
   * @param {Function} onClick — коллбек
   */
  showBackButton(onClick) {
    if (!this.tg?.BackButton) return;
    this.tg.BackButton.offClick?.();
    this.tg.BackButton.onClick(onClick);
    this.tg.BackButton.show();
  }

  /**
   * Скрыть BackButton
   */
  hideBackButton() {
    if (!this.tg?.BackButton) return;
    this.tg.BackButton.hide();
  }

  /**
   * Haptic feedback — лёгкая вибрация
   * @param {string} type — 'light', 'medium', 'heavy', 'success', 'error', 'warning'
   */
  haptic(type = 'light') {
    if (!this.tg?.HapticFeedback) return;
    try {
      this.tg.HapticFeedback.impactOccurred(type);
    } catch (e) {
      // Некоторые типы не поддерживаются на всех устройствах
      this.tg.HapticFeedback.impactOccurred('light');
    }
  }

  /**
   * Показать нативный алерт
   */
  alert(message) {
    if (!this.tg?.showAlert) {
      window.alert(message);
      return;
    }
    this.tg.showAlert(message);
  }

  /**
   * Показать нативный popup с кнопкой
   */
  popup(title, message, buttonText = 'OK') {
    if (!this.tg?.showPopup) {
      window.alert(`${title}\n${message}`);
      return;
    }
    this.tg.showPopup({
      title,
      message,
      buttons: [{ id: 'ok', text: buttonText, type: 'ok' }]
    });
  }

  /**
   * Показать нативный confirm
   */
  confirm(message) {
    if (!this.tg?.showConfirm) {
      return window.confirm(message);
    }
    return new Promise((resolve) => {
      this.tg.showConfirm(message).then((ok) => resolve(ok));
    });
  }

  /**
   * Закрыть WebApp
   */
  close() {
    if (!this.tg?.close) return;
    this.tg.close();
  }

  /**
   * Установить заголовок (если поддерживается)
   */
  setTitle(title) {
    if (!this.tg?.setHeaderColor) return;
    document.title = title;
  }
}

// Singleton — один экземпляр на всё приложение
const telegramManager = new TelegramManager();
export default telegramManager;
