// PWA (Progressive Web App) utilities
// Handles service worker registration, updates, and PWA features

import { logInfo, logWarn, logError } from './logger';

class PWA {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.isOnline = navigator.onLine;
    this.listeners = new Map();
  }

  /**
   * Initialize PWA features
   */
  async init() {
    try {
      // Register service worker
      await this.registerServiceWorker();

      // Set up online/offline listeners
      this.setupNetworkListeners();

      // Set up update listeners
      this.setupUpdateListeners();

      // Request notification permission
      await this.requestNotificationPermission();

      logInfo('PWA initialized successfully');
    } catch (error) {
      logError('Failed to initialize PWA', error);
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      logWarn('Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      logInfo('Service Worker registered', {
        scope: this.registration.scope,
        state: this.registration.active?.state,
      });

      return this.registration;
    } catch (error) {
      logError('Service Worker registration failed', error);
      throw error;
    }
  }

  /**
   * Set up network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online', { isOnline: true });
      logInfo('Application is online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline', { isOnline: false });
      logWarn('Application is offline');
    });
  }

  /**
   * Set up service worker update listeners
   */
  setupUpdateListeners() {
    if (!this.registration) return;

    // Listen for service worker updates
    this.registration.addEventListener('updatefound', () => {
      logInfo('Service Worker update found');

      const newWorker = this.registration.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.updateAvailable = true;
          this.notifyListeners('updateAvailable', { updateAvailable: true });
          logInfo('Service Worker update available');
        }
      });
    });

    // Listen for controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      logInfo('Service Worker controller changed');
      this.notifyListeners('controllerChange', {});
    });
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      logWarn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      logWarn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';

      logInfo('Notification permission requested', { granted });
      return granted;
    } catch (error) {
      logError('Failed to request notification permission', error);
      return false;
    }
  }

  /**
   * Show notification
   */
  async showNotification(title, options = {}) {
    if (!this.registration) {
      logWarn('Service Worker not registered');
      return false;
    }

    if (Notification.permission !== 'granted') {
      logWarn('Notification permission not granted');
      return false;
    }

    try {
      await this.registration.showNotification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        ...options,
      });

      logInfo('Notification shown', { title });
      return true;
    } catch (error) {
      logError('Failed to show notification', error);
      return false;
    }
  }

  /**
   * Check for app updates
   */
  async checkForUpdates() {
    if (!this.registration) return;

    try {
      await this.registration.update();
      logInfo('Update check completed');
    } catch (error) {
      logError('Update check failed', error);
    }
  }

  /**
   * Apply available update
   */
  async applyUpdate() {
    if (!this.updateAvailable || !this.registration) {
      return false;
    }

    try {
      // Send message to service worker to skip waiting
      if (this.registration.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Reload the page to apply the update
      window.location.reload();

      logInfo('Update applied');
      return true;
    } catch (error) {
      logError('Failed to apply update', error);
      return false;
    }
  }

  /**
   * Get PWA status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      updateAvailable: this.updateAvailable,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      notificationsSupported: 'Notification' in window,
      notificationPermission: Notification.permission,
      registration: !!this.registration,
    };
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Notify listeners of an event
   */
  notifyListeners(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        logError('PWA event listener error', error);
      }
    });
  }

  /**
   * Store offline action for background sync
   */
  async storeOfflineAction(action) {
    if (!this.isOnline) {
      try {
        // Store action in IndexedDB for background sync
        const db = await this.openOfflineDB();
        const transaction = db.transaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        await store.add({
          id: Date.now().toString(),
          type: action.type,
          data: action.data,
          timestamp: new Date().toISOString(),
        });

        logInfo('Offline action stored', { type: action.type });

        // Register background sync
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          await this.registration.sync.register('background-sync');
        }
      } catch (error) {
        logError('Failed to store offline action', error);
      }
    }
  }

  /**
   * Open IndexedDB for offline storage
   */
  async openOfflineDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AdventureMateOffline', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create offline actions store
        if (!db.objectStoreNames.contains('offlineActions')) {
          const store = db.createObjectStore('offlineActions', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Install PWA prompt
   */
  async showInstallPrompt() {
    if (!this.registration) return false;

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      logInfo('App is already installed');
      return false;
    }

    // Check if install prompt is available
    if (!('BeforeInstallPromptEvent' in window)) {
      logWarn('Install prompt not supported');
      return false;
    }

    // Wait for install prompt event
    return new Promise((resolve) => {
      const handleBeforeInstallPrompt = (event) => {
        event.preventDefault();

        // Show install prompt
        event.prompt();

        event.userChoice.then((choiceResult) => {
          const installed = choiceResult.outcome === 'accepted';
          logInfo('Install prompt result', { installed });
          resolve(installed);
        });

        // Remove event listener
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    });
  }
}

// Create singleton instance
const pwa = new PWA();

export default pwa;
