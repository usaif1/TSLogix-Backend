/**
 * Utility function to convert dates to UTC
 * @param {Date|string} date - Date to convert to UTC
 * @returns {Date} - UTC Date object or null if input was invalid
 */
function toUTC(date) {
    if (!date) return null;
    
    try { 
      const dateObj = new Date(date);
      if (isNaN(dateObj)) return null;
      return dateObj.toISOString();
    } catch (error) {
      console.error("Invalid date format:", error);
      return null;
    }
}
