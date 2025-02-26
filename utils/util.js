// utils/util.js
/**
 * Format time
 * @param {Date} date
 * @returns {string} Formatted time string
 */
const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

/**
 * Format number to 2 digits
 * @param {number} n
 * @returns {string} Formatted number
 */
const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : '0' + n
}

/**
 * Get future date based on days from now
 * @param {number} days Days from current date
 * @returns {Date} Future date
 */
const getFutureDate = (days) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date
}

/**
 * Map text options to actual values
 * @param {string} timeOption Selected time option
 * @returns {Date} Mapped date
 */
const mapTimeOptionToDate = (timeOption) => {
    switch(timeOption) {
        case 'Today':
            return new Date();
        case 'Tomorrow':
            return getFutureDate(1);
        case 'The day after tomorrow':
            return getFutureDate(2);
        default:
            return new Date();
    }
}

module.exports = {
    formatTime,
    formatNumber,
    getFutureDate,
    mapTimeOptionToDate
}