/**
 * Settings Utility Module
 * Provides functions to read and apply settings from localStorage
 */

const SettingsUtil = {
    SETTINGS_KEY: 'mdpScreenSettings',
    
    DEFAULT_SETTINGS: {
        pageInterval: 7000,
        busDataInterval: 30000,
        bufferWithDirections: 25,
        bufferWithoutDirections: 10,
        clockFormat: '24h',
        dateFormat: 'default',
        enablePageCycling: true,
        enableDebugMode: false
    },

    /**
     * Get settings from localStorage, with fallback to defaults
     */
    getSettings() {
        try {
            const stored = localStorage.getItem(this.SETTINGS_KEY);
            if (stored) {
                const settings = JSON.parse(stored);
                // Convert seconds to milliseconds for intervals if needed
                return {
                    pageInterval: (settings.pageInterval * 1000) || this.DEFAULT_SETTINGS.pageInterval,
                    busDataInterval: (settings.busDataInterval * 1000) || this.DEFAULT_SETTINGS.busDataInterval,
                    bufferWithDirections: settings.bufferWithDirections || this.DEFAULT_SETTINGS.bufferWithDirections,
                    bufferWithoutDirections: settings.bufferWithoutDirections || this.DEFAULT_SETTINGS.bufferWithoutDirections,
                    clockFormat: settings.clockFormat || this.DEFAULT_SETTINGS.clockFormat,
                    dateFormat: settings.dateFormat || this.DEFAULT_SETTINGS.dateFormat,
                    enablePageCycling: settings.enablePageCycling !== undefined ? settings.enablePageCycling : this.DEFAULT_SETTINGS.enablePageCycling,
                    enableDebugMode: settings.enableDebugMode || this.DEFAULT_SETTINGS.enableDebugMode
                };
            }
        } catch (e) {
            console.warn('Failed to parse settings from localStorage', e);
        }
        return { ...this.DEFAULT_SETTINGS };
    },

    formatClockTime(hours, minutes, clockFormat = this.getSettings().clockFormat) {
        const pad = n => n.toString().padStart(2, '0');
        return clockFormat === '12h'
            ? `${hours % 12 || 12}:${pad(minutes)} ${hours < 12 ? 'AM' : 'PM'}`
            : `${pad(hours)}:${pad(minutes)}`;
    },

    formatArrival(value) {
        if (!value || value === 'Arr') return value || '';
        const clockFormat = this.getSettings().clockFormat;
        if (value.length > 5 && value.includes('T')) {
            const arrival = new Date(value);
            if (isNaN(arrival)) return '';
            if (Math.round((arrival - new Date()) / 60000) <= 0) return 'Arr';
            return this.formatClockTime(arrival.getHours(), arrival.getMinutes(), clockFormat);
        }
        const match = /^(\d{1,2}):(\d{2})$/.exec(value);
        if (clockFormat === '12h' && match && Number(match[1]) < 24 && Number(match[2]) < 60) {
            return this.formatClockTime(Number(match[1]), Number(match[2]), clockFormat);
        }
        return value;
    },

    updateClock(now = new Date()) {
        const { clockFormat, dateFormat } = this.getSettings();
        document.body.classList.toggle('clock-format-12h', clockFormat === '12h');
        const time = this.formatClockTime(now.getHours(), now.getMinutes(), clockFormat);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const day = days[now.getDay()];
        const month = months[now.getMonth()];
        let date;
        if (dateFormat === 'full') {
            date = `${day}, ${month} ${now.getDate()}`;
        } else if (dateFormat === 'short') {
            date = `${now.getDate()} ${month.slice(0, 3)}`;
        } else {
            date = `${day.slice(0, 3)}, ${month.slice(0, 3)} ${now.getDate()}`;
        }
        document.getElementById('clock-time').textContent = time;
        document.getElementById('clock-date').textContent = date;
    },

    /**
     * Get pagination buffer based on whether directions are present
     */
    getPaginationBuffer(hasDirections) {
        const settings = this.getSettings();
        return hasDirections ? settings.bufferWithDirections : settings.bufferWithoutDirections;
    },

    /**
     * Get page interval in milliseconds
     */
    getPageInterval() {
        return this.getSettings().pageInterval;
    },

    /**
     * Get bus data interval in milliseconds
     */
    getBusDataInterval() {
        return this.getSettings().busDataInterval;
    },

    /**
     * Check if page cycling is enabled
     */
    isPageCyclingEnabled() {
        return this.getSettings().enablePageCycling;
    },

    /**
     * Check if debug mode is enabled
     */
    isDebugMode() {
        return this.getSettings().enableDebugMode;
    },

    /**
     * Log debug message if debug mode is enabled
     */
    debug(message, data) {
        if (this.isDebugMode()) {
            console.log('[MDP Debug]', message, data || '');
        }
    }
};
