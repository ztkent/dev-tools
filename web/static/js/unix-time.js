// Unix Time Tool JavaScript
(function() {
    'use strict';

    // Prevent multiple initializations
    if (window.UnixTimeConverter) {
        return;
    }

    class UnixTimeConverter {
        constructor() {
            this.isUTC = false; // Start with local time
            this.initializeElements();
            this.bindEvents();
            this.startCurrentTimeUpdate();
            this.updateCurrentTimestamp();
        }

        initializeElements() {
            // Timestamp to Date elements
            this.timestampInput = document.getElementById('timestamp-input');
            this.utcOutput = document.getElementById('utc-output');
            this.localOutput = document.getElementById('local-output');

            // Date to Timestamp elements
            this.yearInput = document.getElementById('year-input');
            this.monthInput = document.getElementById('month-input');
            this.dayInput = document.getElementById('day-input');
            this.hourInput = document.getElementById('hour-input');
            this.minuteInput = document.getElementById('minute-input');
            this.secondInput = document.getElementById('second-input');
            this.timestampOutput = document.getElementById('timestamp-output');
            this.millisecondsOutput = document.getElementById('milliseconds-output');

            // Current timestamp elements
            this.currentTimestamp = document.getElementById('current-timestamp');
            this.currentDate = document.getElementById('current-date');
            this.currentTimezone = document.getElementById('current-timezone');
            this.timezoneToggleBtn = document.getElementById('timezone-toggle-btn');
            this.timezoneLabel = document.getElementById('timezone-label');

            // Format output elements
            this.formatDate = document.getElementById('format-date');
            this.formatISO8601 = document.getElementById('format-iso8601');
            this.formatRFC822 = document.getElementById('format-rfc822');
            this.formatRFC2822 = document.getElementById('format-rfc2822');
            this.formatRFC3339 = document.getElementById('format-rfc3339');

            // Error elements
            this.timestampError = document.getElementById('timestamp-error');
            this.dateError = document.getElementById('date-error');
        }

        bindEvents() {
            // Timestamp to date conversion
            if (this.timestampInput) {
                this.timestampInput.addEventListener('input', () => this.convertTimestampToDate());
            }

            // Date to timestamp conversion
            const dateInputs = [
                this.yearInput, this.monthInput, this.dayInput,
                this.hourInput, this.minuteInput, this.secondInput
            ];
            
            dateInputs.forEach(input => {
                if (input) {
                    input.addEventListener('input', () => this.convertDateToTimestamp());
                }
            });

            // Timezone toggle
            if (this.timezoneToggleBtn) {
                this.timezoneToggleBtn.addEventListener('click', () => this.toggleTimezone());
            }

            // Copy button events
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-button')) {
                    this.copyToClipboard(e.target);
                }
            });

            // Initialize current date/time in date inputs
            this.initializeDateInputs();
        }

        startCurrentTimeUpdate() {
            // Clear any existing interval
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            
            // Update every second
            this.updateInterval = setInterval(() => {
                this.updateCurrentTimestamp();
            }, 1000);
        }

        updateCurrentTimestamp() {
            const now = Date.now();
            const timestamp = Math.floor(now / 1000);
            const date = new Date(now);

            if (this.currentTimestamp) {
                this.currentTimestamp.textContent = timestamp;
            }

            if (this.currentDate) {
                this.currentDate.textContent = this.formatFullDate(date, this.isUTC);
            }

            if (this.currentTimezone) {
                this.currentTimezone.textContent = this.getTimezoneDisplay(date);
            }

            // Update format outputs
            this.updateFormatOutputs(date);
        }

        toggleTimezone() {
            this.isUTC = !this.isUTC;
            
            if (this.timezoneLabel) {
                this.timezoneLabel.textContent = this.isUTC ? 'UTC Time' : 'Local Time';
            }
            
            // Update the current timestamp display immediately
            this.updateCurrentTimestamp();
        }

        getTimezoneDisplay(date) {
            if (this.isUTC) {
                return 'UTC (Coordinated Universal Time)';
            } else {
                // Get timezone offset and name
                const offset = date.getTimezoneOffset();
                const hours = Math.floor(Math.abs(offset) / 60);
                const minutes = Math.abs(offset) % 60;
                const sign = offset <= 0 ? '+' : '-';
                const offsetStr = `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                
                // Try to get timezone name
                try {
                    const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const shortName = date.toLocaleDateString('en', {timeZoneName: 'short'}).split(', ')[1];
                    return `${shortName} (${offsetStr}) - ${timezoneName}`;
                } catch (e) {
                    return `Local Time (${offsetStr})`;
                }
            }
        }

        updateFormatOutputs(date) {
            if (this.formatDate) {
                this.formatDate.textContent = this.formatDateOnly(date, this.isUTC);
            }
            
            if (this.formatISO8601) {
                this.formatISO8601.textContent = this.formatISO8601Date(date, this.isUTC);
            }
            
            if (this.formatRFC822) {
                this.formatRFC822.textContent = this.formatRFC822Date(date, this.isUTC);
            }
            
            if (this.formatRFC2822) {
                this.formatRFC2822.textContent = this.formatRFC2822Date(date, this.isUTC);
            }
            
            if (this.formatRFC3339) {
                this.formatRFC3339.textContent = this.formatRFC3339Date(date, this.isUTC);
            }
        }

        formatDateOnly(date, isUTC = false) {
            // Format: 07/27/2025 @ 5:37pm UTC or 07/27/2025 @ 5:37pm PST
            let month, day, year, hours, minutes, timezoneSuffix;
            
            if (isUTC) {
                month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                day = date.getUTCDate().toString().padStart(2, '0');
                year = date.getUTCFullYear();
                hours = date.getUTCHours();
                minutes = date.getUTCMinutes().toString().padStart(2, '0');
                timezoneSuffix = 'UTC';
            } else {
                month = (date.getMonth() + 1).toString().padStart(2, '0');
                day = date.getDate().toString().padStart(2, '0');
                year = date.getFullYear();
                hours = date.getHours();
                minutes = date.getMinutes().toString().padStart(2, '0');
                
                // Get local timezone abbreviation
                try {
                    const shortName = date.toLocaleDateString('en', {timeZoneName: 'short'}).split(', ')[1];
                    timezoneSuffix = shortName || 'Local';
                } catch (e) {
                    timezoneSuffix = 'Local';
                }
            }
            
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12
            
            return `${month}/${day}/${year} @ ${hours}:${minutes}${ampm} ${timezoneSuffix}`;
        }

        formatISO8601Date(date, isUTC = false) {
            if (isUTC) {
                // Format: 2025-07-27T17:37:04+00:00
                return date.toISOString().replace('Z', '+00:00');
            } else {
                // Format for local time: 2025-07-27T10:37:04-07:00
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const seconds = date.getSeconds().toString().padStart(2, '0');
                
                // Get timezone offset
                const offset = date.getTimezoneOffset();
                const offsetHours = Math.floor(Math.abs(offset) / 60);
                const offsetMinutes = Math.abs(offset) % 60;
                const sign = offset <= 0 ? '+' : '-';
                const offsetStr = `${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
                
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetStr}`;
            }
        }

        formatRFC822Date(date, isUTC = false) {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            let dayName, day, monthName, year, hours, minutes, seconds, timezoneStr;
            
            if (isUTC) {
                // Format: Sun, 27 Jul 2025 17:37:04 +0000
                dayName = days[date.getUTCDay()];
                day = date.getUTCDate().toString().padStart(2, '0');
                monthName = months[date.getUTCMonth()];
                year = date.getUTCFullYear();
                hours = date.getUTCHours().toString().padStart(2, '0');
                minutes = date.getUTCMinutes().toString().padStart(2, '0');
                seconds = date.getUTCSeconds().toString().padStart(2, '0');
                timezoneStr = '+0000';
            } else {
                // Format: Sun, 27 Jul 2025 10:37:04 -0700
                dayName = days[date.getDay()];
                day = date.getDate().toString().padStart(2, '0');
                monthName = months[date.getMonth()];
                year = date.getFullYear();
                hours = date.getHours().toString().padStart(2, '0');
                minutes = date.getMinutes().toString().padStart(2, '0');
                seconds = date.getSeconds().toString().padStart(2, '0');
                
                // Get timezone offset
                const offset = date.getTimezoneOffset();
                const offsetHours = Math.floor(Math.abs(offset) / 60);
                const offsetMinutes = Math.abs(offset) % 60;
                const sign = offset <= 0 ? '+' : '-';
                timezoneStr = `${sign}${offsetHours.toString().padStart(2, '0')}${offsetMinutes.toString().padStart(2, '0')}`;
            }
            
            return `${dayName}, ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds} ${timezoneStr}`;
        }

        formatRFC2822Date(date, isUTC = false) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            let dayName, day, monthName, year, hours, minutes, seconds, timezoneStr;
            
            if (isUTC) {
                // Format: Sunday, 27-Jul-25 17:37:04 UTC
                dayName = days[date.getUTCDay()];
                day = date.getUTCDate().toString().padStart(2, '0');
                monthName = months[date.getUTCMonth()];
                year = date.getUTCFullYear().toString().slice(-2);
                hours = date.getUTCHours().toString().padStart(2, '0');
                minutes = date.getUTCMinutes().toString().padStart(2, '0');
                seconds = date.getUTCSeconds().toString().padStart(2, '0');
                timezoneStr = 'UTC';
            } else {
                // Format: Sunday, 27-Jul-25 10:37:04 PST
                dayName = days[date.getDay()];
                day = date.getDate().toString().padStart(2, '0');
                monthName = months[date.getMonth()];
                year = date.getFullYear().toString().slice(-2);
                hours = date.getHours().toString().padStart(2, '0');
                minutes = date.getMinutes().toString().padStart(2, '0');
                seconds = date.getSeconds().toString().padStart(2, '0');
                
                // Get local timezone abbreviation
                try {
                    timezoneStr = date.toLocaleDateString('en', {timeZoneName: 'short'}).split(', ')[1] || 'Local';
                } catch (e) {
                    timezoneStr = 'Local';
                }
            }
            
            return `${dayName}, ${day}-${monthName}-${year} ${hours}:${minutes}:${seconds} ${timezoneStr}`;
        }

        formatRFC3339Date(date, isUTC = false) {
            // RFC 3339 is the same as ISO 8601
            return this.formatISO8601Date(date, isUTC);
        }

        convertTimestampToDate() {
            const input = this.timestampInput.value.trim();
            this.clearError('timestamp');

            if (!input) {
                this.clearOutputs(['utc', 'local']);
                return;
            }

            try {
                const timestamp = this.parseTimestamp(input);
                const date = new Date(timestamp);

                if (isNaN(date.getTime())) {
                    throw new Error('Invalid timestamp');
                }

                // UTC time
                if (this.utcOutput) {
                    this.utcOutput.textContent = this.formatFullDate(date, true);
                }

                // Local time
                if (this.localOutput) {
                    this.localOutput.textContent = this.formatFullDate(date, false);
                }

            } catch (error) {
                this.showError('timestamp', 'Invalid timestamp format');
                this.clearOutputs(['utc', 'local']);
            }
        }

        convertDateToTimestamp() {
            this.clearError('date');

            try {
                const year = parseInt(this.yearInput.value) || new Date().getFullYear();
                const month = parseInt(this.monthInput.value) || 1;
                const day = parseInt(this.dayInput.value) || 1;
                const hour = parseInt(this.hourInput.value) || 0;
                const minute = parseInt(this.minuteInput.value) || 0;
                const second = parseInt(this.secondInput.value) || 0;

                // Validate ranges
                if (month < 1 || month > 12) throw new Error('Invalid month');
                if (day < 1 || day > 31) throw new Error('Invalid day');
                if (hour < 0 || hour > 23) throw new Error('Invalid hour');
                if (minute < 0 || minute > 59) throw new Error('Invalid minute');
                if (second < 0 || second > 59) throw new Error('Invalid second');

                const date = new Date(year, month - 1, day, hour, minute, second);
                
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid date');
                }

                const timestamp = Math.floor(date.getTime() / 1000);
                const milliseconds = date.getTime();

                if (this.timestampOutput) {
                    this.timestampOutput.textContent = timestamp;
                }

                if (this.millisecondsOutput) {
                    this.millisecondsOutput.textContent = milliseconds;
                }

            } catch (error) {
                this.showError('date', error.message);
                this.clearOutputs(['timestamp', 'milliseconds']);
            }
        }

        parseTimestamp(input) {
            const num = parseFloat(input);
            
            if (isNaN(num)) {
                throw new Error('Not a valid number');
            }

            // Auto-detect format based on length
            const str = input.toString();
            
            if (str.length <= 10) {
                // Seconds
                return num * 1000;
            } else if (str.length <= 13) {
                // Milliseconds
                return num;
            } else if (str.length <= 16) {
                // Microseconds
                return num / 1000;
            } else {
                // Nanoseconds
                return num / 1000000;
            }
        }

        formatFullDate(date, isUTC = false) {
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: isUTC ? 'UTC' : undefined
            };

            const formatted = date.toLocaleDateString('en-US', options);
            
            return formatted;
        }

        initializeDateInputs() {
            const now = new Date();
            
            if (this.yearInput && !this.yearInput.value) {
                this.yearInput.value = now.getFullYear();
            }
            if (this.monthInput && !this.monthInput.value) {
                this.monthInput.value = now.getMonth() + 1;
            }
            if (this.dayInput && !this.dayInput.value) {
                this.dayInput.value = now.getDate();
            }
            if (this.hourInput && !this.hourInput.value) {
                this.hourInput.value = now.getHours();
            }
            if (this.minuteInput && !this.minuteInput.value) {
                this.minuteInput.value = now.getMinutes();
            }
            if (this.secondInput && !this.secondInput.value) {
                this.secondInput.value = now.getSeconds();
            }

            // Trigger initial conversion
            this.convertDateToTimestamp();
        }

        copyToClipboard(button) {
            const targetId = button.getAttribute('data-copy-target');
            const targetElement = document.getElementById(targetId);
            
            if (!targetElement || button.classList.contains('loading')) return;

            const text = targetElement.textContent.trim();
            
            if (!text) return;

            // Add loading state
            const originalText = button.textContent;
            button.classList.add('loading');
            button.textContent = 'Copying...';

            navigator.clipboard.writeText(text).then(() => {
                this.showCopySuccess(button, originalText);
            }).catch(() => {
                // Fallback for older browsers
                try {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    this.showCopySuccess(button, originalText);
                } catch (err) {
                    this.showCopyError(button, originalText);
                }
            });
        }

        showCopySuccess(button, originalText) {
            button.classList.remove('loading');
            button.classList.add('copied');
            button.textContent = 'Copied!';
            
            setTimeout(() => {
                button.classList.remove('copied');
                button.textContent = originalText;
            }, 2000);
        }

        showCopyError(button, originalText) {
            button.classList.remove('loading');
            button.textContent = 'Error';
            button.style.background = '#ff6b6b';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        }

        showError(type, message) {
            const errorElement = type === 'timestamp' ? this.timestampError : this.dateError;
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }

        clearError(type) {
            const errorElement = type === 'timestamp' ? this.timestampError : this.dateError;
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }

        clearOutputs(types) {
            types.forEach(type => {
                let element;
                switch (type) {
                    case 'utc':
                        element = this.utcOutput;
                        break;
                    case 'local':
                        element = this.localOutput;
                        break;
                    case 'timestamp':
                        element = this.timestampOutput;
                        break;
                    case 'milliseconds':
                        element = this.millisecondsOutput;
                        break;
                }
                if (element) {
                    element.textContent = '';
                }
            });
        }
    }

    // Store the class globally to prevent redeclaration
    window.UnixTimeConverter = UnixTimeConverter;

    // Function to initialize the converter
    window.initUnixTimeConverter = function() {
        // Clear any existing instance and interval
        if (window.unixTimeConverterInstance) {
            if (window.unixTimeConverterInstance.updateInterval) {
                clearInterval(window.unixTimeConverterInstance.updateInterval);
            }
            window.unixTimeConverterInstance = null;
        }
        
        // Only initialize if the unix time container exists
        if (document.querySelector('.unix-time-container')) {
            window.unixTimeConverterInstance = new UnixTimeConverter();
        }
    };
})();