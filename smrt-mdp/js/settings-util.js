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
