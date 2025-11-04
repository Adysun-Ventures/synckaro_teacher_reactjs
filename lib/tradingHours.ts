// Indian Stock Market Trading Hours Utility
// Checks if current time is within trading hours (9:15 AM - 3:30 PM IST, Mon-Fri)

/**
 * Array of major Indian market holidays
 * Format: YYYY-MM-DD (ISO date format)
 * These are dates when the stock market is closed
 */
const MARKET_HOLIDAYS = [
  // 2024 Holidays
  '2024-01-26', // Republic Day
  '2024-03-08', // Holi
  '2024-03-29', // Good Friday
  '2024-04-11', // Eid ul-Fitr
  '2024-04-17', // Ram Navami
  '2024-06-17', // Bakri Eid
  '2024-08-15', // Independence Day
  '2024-08-26', // Janmashtami
  '2024-10-02', // Gandhi Jayanti
  '2024-10-31', // Diwali (Bali Pratipada)
  '2024-11-01', // Diwali (Lakshmi Puja)
  '2024-11-15', // Diwali (Govardhan Puja)
  '2024-11-25', // Gurunanak Jayanti
  '2024-12-25', // Christmas
  // 2025 Holidays
  '2025-01-26', // Republic Day
  '2025-03-14', // Holi
  '2025-04-18', // Good Friday
  '2025-08-15', // Independence Day
  '2025-10-02', // Gandhi Jayanti
  '2025-10-20', // Diwali
  '2025-10-21', // Diwali
  '2025-12-25', // Christmas
  // 2026 Holidays
  '2026-01-26', // Republic Day
  '2026-03-03', // Holi
  '2026-04-03', // Good Friday
  '2026-08-15', // Independence Day
  '2026-10-02', // Gandhi Jayanti
  '2026-11-08', // Diwali
  '2026-11-09', // Diwali
  '2026-12-25', // Christmas
  // 2027 Holidays
  '2027-01-26', // Republic Day
  '2027-03-22', // Holi
  '2027-03-26', // Good Friday
  '2027-08-15', // Independence Day
  '2027-10-02', // Gandhi Jayanti
  '2027-10-26', // Diwali
  '2027-10-27', // Diwali
  '2027-12-25', // Christmas
  // 2028 Holidays
  '2028-01-26', // Republic Day
  '2028-03-10', // Holi
  '2028-04-14', // Good Friday
  '2028-08-15', // Independence Day
  '2028-10-02', // Gandhi Jayanti
  '2028-11-13', // Diwali
  '2028-11-14', // Diwali
  '2028-12-25', // Christmas
  // 2029 Holidays
  '2029-01-26', // Republic Day
  '2029-02-28', // Holi
  '2029-03-30', // Good Friday
  '2029-08-15', // Independence Day
  '2029-10-02', // Gandhi Jayanti
  '2029-11-02', // Diwali
  '2029-11-03', // Diwali
  '2029-12-25', // Christmas
  // 2030 Holidays
  '2030-01-26', // Republic Day
  '2030-03-19', // Holi
  '2030-04-19', // Good Friday
  '2030-08-15', // Independence Day
  '2030-10-02', // Gandhi Jayanti
  '2030-10-23', // Diwali
  '2030-10-24', // Diwali
  '2030-12-25', // Christmas
];

/**
 * Converts current time to IST (Indian Standard Time)
 * IST is UTC+5:30 (5 hours 30 minutes ahead of UTC)
 * 
 * @returns {Date} Date object representing current time in IST
 */
function getISTTime(): Date {
  const now = new Date();
  // Get UTC time in milliseconds
  // getTimezoneOffset() returns offset in minutes (positive for behind UTC)
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  // IST offset: 5 hours 30 minutes = 5.5 hours in milliseconds
  const istOffset = 5.5 * 60 * 60 * 1000;
  // Create new Date object with UTC time + IST offset
  return new Date(utcTime + istOffset);
}

/**
 * Checks if a given date is a market holiday
 * 
 * @param {Date} date - The date to check
 * @returns {boolean} - true if the date is a holiday, false otherwise
 */
function isHoliday(date: Date): boolean {
  // Format date as YYYY-MM-DD for comparison
  // toISOString() returns format: "YYYY-MM-DDTHH:mm:ss.sssZ"
  // split('T')[0] gets just the date part: "YYYY-MM-DD"
  const dateString = date.toISOString().split('T')[0];
  // Check if date string exists in holidays array
  return MARKET_HOLIDAYS.includes(dateString);
}

/**
 * Checks if a given date is a weekday (Monday to Friday)
 * 
 * @param {Date} date - The date to check
 * @returns {boolean} - true if date is Monday-Friday, false for weekends
 */
function isWeekDay(date: Date): boolean {
  // getDay() returns: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  const day = date.getDay();
  // Check if day is between 1 (Monday) and 5 (Friday)
  return day >= 1 && day <= 5;
}

/**
 * Main function: Checks if current time is within Indian stock market trading hours
 * 
 * Trading hours: 9:15 AM - 3:30 PM IST
 * Trading days: Monday to Friday
 * Excludes: Weekends and market holidays
 * 
 * @returns {boolean} - true if trading is active, false if market is closed
 */
export function isTradingHours(): boolean {
  // Step 1: Get current time in IST
  const istTime = getISTTime();

  // Step 2: Check if it's a weekday
  // If it's weekend (Saturday or Sunday), market is closed
  if (!isWeekDay(istTime)) {
    return false; // Weekend - market is closed
  }

  // Step 3: Check if it's a market holiday
  // If it's a holiday, market is closed even if it's a weekday
  if (isHoliday(istTime)) {
    return false; // Holiday - market is closed
  }

  // Step 4: Check if current time is within trading hours (9:15 AM - 3:30 PM)
  // Get hours (0-23) and minutes (0-59) from IST time
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();

  // Convert time to total minutes for easier comparison
  // Example: 9:15 AM = 9 hours * 60 minutes + 15 minutes = 555 minutes
  // Example: 3:30 PM = 15 hours * 60 minutes + 30 minutes = 930 minutes
  const currentTimeInMinutes = hours * 60 + minutes;
  const marketOpenTime = 9 * 60 + 15;   // 9:15 AM = 555 minutes
  const marketCloseTime = 15 * 60 + 30; // 3:30 PM = 930 minutes

  // Check if current time is >= market open AND < market close
  // Note: Using < instead of <= because market closes at 3:30 PM
  // At exactly 3:30 PM, market is closed, so we exclude it
  return currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes < marketCloseTime;
}