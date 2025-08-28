// JSON Validator Tool JavaScript
(function() {
    'use strict';

    // Prevent multiple initializations
    if (window.JSONValidator) {
        return;
    }

    class JSONValidator {
        constructor() {
            this.validationTimeout = null; // Track timeout for auto-hiding validation results
            this.initializeElements();
            this.bindEvents();
            this.initializeSettings();
        }

        initializeElements() {
            // Input elements
            this.jsonInput = document.getElementById('json-input');
            
            // Button elements
            this.validateBtn = document.getElementById('validate-btn');
            this.formatBtn = document.getElementById('format-btn');
            this.minifyBtn = document.getElementById('minify-btn');
            this.convertBtn = document.getElementById('convert-btn');
            this.clearBtn = document.getElementById('clear-btn');
            
            // Output elements
            this.validationResults = document.getElementById('validation-results');
            this.validationMessage = document.getElementById('validation-message');
            this.formattedOutput = document.getElementById('formatted-output');
            this.analysisResults = document.getElementById('analysis-results');
            
            // Settings elements
            this.indentSelect = document.getElementById('indent-select');
            this.formatSelect = document.getElementById('format-select');
            this.autoValidateCheckbox = document.getElementById('auto-validate');
            
            // Error elements
            this.errorDisplay = document.getElementById('error-display');
            this.errorMessage = document.getElementById('error-message');
            
            // Analysis display elements
            this.jsonSize = document.getElementById('json-size');
            this.jsonKeys = document.getElementById('json-keys');
            this.jsonDepth = document.getElementById('json-depth');
            this.jsonType = document.getElementById('json-type');
        }

        bindEvents() {
            // Button events
            if (this.validateBtn) {
                this.validateBtn.addEventListener('click', () => this.validateJSON());
            }
            
            if (this.formatBtn) {
                this.formatBtn.addEventListener('click', () => this.formatJSON());
            }
            
            if (this.minifyBtn) {
                this.minifyBtn.addEventListener('click', () => this.minifyJSON());
            }
            
            if (this.convertBtn) {
                this.convertBtn.addEventListener('click', () => this.convertJSON());
            }
            
            if (this.clearBtn) {
                this.clearBtn.addEventListener('click', () => this.clearAll());
            }

            // Input events
            if (this.jsonInput) {
                this.jsonInput.addEventListener('input', () => this.handleInputChange());
                this.jsonInput.addEventListener('paste', () => {
                    // Delay to allow paste content to be processed
                    setTimeout(() => this.handleInputChange(), 10);
                });
            }

            // Settings events
            if (this.autoValidateCheckbox) {
                this.autoValidateCheckbox.addEventListener('change', () => {
                    if (this.autoValidateCheckbox.checked) {
                        this.handleInputChange();
                    }
                });
            }

            // Copy button events
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-button')) {
                    this.copyToClipboard(e.target);
                }
            });
        }

        initializeSettings() {
            // Set default values if elements exist
            if (this.indentSelect && !this.indentSelect.value) {
                this.indentSelect.value = '2';
            }
            
            if (this.formatSelect && !this.formatSelect.value) {
                this.formatSelect.value = 'formatted';
            }
            
            // Load sample JSON if input is empty
            if (this.jsonInput && !this.jsonInput.value.trim()) {
                this.loadSampleJSON();
            }
        }

        loadSampleJSON() {
            const sampleJSON = {
                "name": "JSON Validator Tool",
                "version": "1.0.0",
                "features": [
                    "Syntax validation",
                    "Pretty formatting",
                    "Minification",
                    "Format conversion"
                ],
                "config": {
                    "autoValidate": true,
                    "indentation": 2
                },
                "metadata": {
                    "created": "2025-08-27",
                    "author": "Dev Tools"
                }
            };
            
            if (this.jsonInput) {
                this.jsonInput.value = JSON.stringify(sampleJSON, null, 2);
                // Update analysis without showing validation message on initial load
                this.updateAnalysis();
            }
        }

        handleInputChange() {
            if (this.autoValidateCheckbox && this.autoValidateCheckbox.checked) {
                this.validateJSON();
            }
            this.updateAnalysis();
        }

        validateJSON() {
            const input = this.jsonInput ? this.jsonInput.value.trim() : '';
            
            this.clearErrors();
            
            if (!input) {
                this.showValidationResult(false, 'Please enter JSON to validate');
                this.clearOutputs();
                return null;
            }

            try {
                const parsed = JSON.parse(input);
                this.showValidationResult(true, 'Valid JSON! Your JSON is correctly formatted.');
                this.updateAnalysis(parsed, input);
                return parsed;
            } catch (error) {
                this.showValidationResult(false, `Invalid JSON: ${this.parseJSONError(error)}`);
                this.showError(error.message);
                this.clearOutputs();
                return null;
            }
        }

        formatJSON() {
            const input = this.jsonInput ? this.jsonInput.value.trim() : '';
            
            if (!input) {
                this.showError('Please enter JSON to format');
                return;
            }

            let parsed;
            try {
                parsed = JSON.parse(input);
            } catch (error) {
                this.showValidationResult(false, `Invalid JSON: ${this.parseJSONError(error)}`);
                this.showError('Cannot format invalid JSON: ' + error.message);
                return;
            }

            try {
                const indentValue = this.indentSelect ? this.indentSelect.value : '2';
                let indent;
                
                if (indentValue === '0') {
                    indent = '\t'; // Use tab character
                } else {
                    indent = parseInt(indentValue); // Use spaces
                }
                
                const formatted = JSON.stringify(parsed, null, indent);
                this.showFormattedOutput(formatted);
                this.showValidationResult(true, 'JSON formatted successfully!');
            } catch (error) {
                this.showError('Error formatting JSON: ' + error.message);
            }
        }

        minifyJSON() {
            const input = this.jsonInput ? this.jsonInput.value.trim() : '';
            
            if (!input) {
                this.showError('Please enter JSON to minify');
                return;
            }

            let parsed;
            try {
                parsed = JSON.parse(input);
            } catch (error) {
                this.showValidationResult(false, `Invalid JSON: ${this.parseJSONError(error)}`);
                this.showError('Cannot minify invalid JSON: ' + error.message);
                return;
            }

            try {
                const minified = JSON.stringify(parsed);
                this.showFormattedOutput(minified);
                this.showValidationResult(true, 'JSON minified successfully!');
            } catch (error) {
                this.showError('Error minifying JSON: ' + error.message);
            }
        }

        convertJSON() {
            const input = this.jsonInput ? this.jsonInput.value.trim() : '';
            
            if (!input) {
                this.showError('Please enter JSON to convert');
                return;
            }

            let parsed;
            try {
                parsed = JSON.parse(input);
            } catch (error) {
                this.showValidationResult(false, `Invalid JSON: ${this.parseJSONError(error)}`);
                this.showError('Cannot convert invalid JSON: ' + error.message);
                return;
            }

            const format = this.formatSelect ? this.formatSelect.value : 'formatted';
            
            try {
                let converted;
                switch (format) {
                    case 'xml':
                        converted = this.jsonToXML(parsed);
                        break;
                    case 'yaml':
                        converted = this.jsonToYAML(parsed);
                        break;
                    case 'csv':
                        converted = this.jsonToCSV(parsed);
                        break;
                    case 'url-encoded':
                        converted = this.jsonToURLEncoded(parsed);
                        break;
                    case 'base64':
                        converted = this.jsonToBase64(parsed);
                        break;
                    case 'minified':
                        converted = JSON.stringify(parsed);
                        break;
                    case 'formatted':
                    default:
                        const indentValue = this.indentSelect ? this.indentSelect.value : '2';
                        let indent;
                        
                        if (indentValue === '0') {
                            indent = '\t'; // Use tab character
                        } else {
                            indent = parseInt(indentValue); // Use spaces
                        }
                        
                        converted = JSON.stringify(parsed, null, indent);
                        break;
                }
                this.showFormattedOutput(converted);
                this.showValidationResult(true, `JSON converted to ${format} successfully!`);
            } catch (error) {
                this.showError('Error converting JSON: ' + error.message);
            }
        }

        jsonToXML(obj, rootName = 'root') {
            const self = this; // Store reference to this
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
            
            function convertValue(value, key) {
                if (value === null) return `<${key}></${key}>`;
                if (typeof value === 'object' && !Array.isArray(value)) {
                    let result = `<${key}>`;
                    for (const [k, v] of Object.entries(value)) {
                        result += convertValue(v, k);
                    }
                    result += `</${key}>`;
                    return result;
                } else if (Array.isArray(value)) {
                    return value.map(item => convertValue(item, key)).join('');
                } else {
                    return `<${key}>${self.escapeXML(String(value))}</${key}>`;
                }
            }
            
            xml += convertValue(obj, rootName);
            return xml;
        }

        jsonToYAML(obj, indent = 0) {
            const spaces = '  '.repeat(indent);
            let yaml = '';
            
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    if (typeof item === 'object' && item !== null) {
                        yaml += `${spaces}- `;
                        yaml += this.jsonToYAML(item, indent + 1).trim() + '\n';
                    } else {
                        yaml += `${spaces}- ${this.yamlValue(item)}\n`;
                    }
                }
            } else if (typeof obj === 'object' && obj !== null) {
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'object' && value !== null) {
                        yaml += `${spaces}${key}:\n`;
                        yaml += this.jsonToYAML(value, indent + 1);
                    } else {
                        yaml += `${spaces}${key}: ${this.yamlValue(value)}\n`;
                    }
                }
            } else {
                return this.yamlValue(obj);
            }
            
            return yaml;
        }

        jsonToCSV(obj) {
            if (!Array.isArray(obj)) {
                // If it's a single object, wrap it in an array
                if (typeof obj === 'object' && obj !== null) {
                    obj = [obj];
                } else {
                    throw new Error('CSV conversion requires an array of objects or a single object');
                }
            }
            
            if (obj.length === 0) return '';
            
            // Get all unique keys
            const keys = new Set();
            obj.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    Object.keys(item).forEach(key => keys.add(key));
                }
            });
            
            if (keys.size === 0) {
                // Handle array of primitives
                return obj.map((item, index) => `"${index}","${String(item).replace(/"/g, '""')}"`).join('\n');
            }
            
            const headers = Array.from(keys);
            let csv = headers.map(h => `"${h}"`).join(',') + '\n';
            
            obj.forEach(item => {
                const row = headers.map(header => {
                    const value = item && typeof item === 'object' ? item[header] : '';
                    let cellValue = '';
                    if (value === null || value === undefined) {
                        cellValue = '';
                    } else if (typeof value === 'object') {
                        cellValue = JSON.stringify(value);
                    } else {
                        cellValue = String(value);
                    }
                    return `"${cellValue.replace(/"/g, '""')}"`;
                });
                csv += row.join(',') + '\n';
            });
            
            return csv;
        }

        jsonToURLEncoded(obj) {
            const params = new URLSearchParams();
            
            function addParam(key, value) {
                if (value === null || value === undefined) {
                    params.append(key, '');
                } else if (typeof value === 'object') {
                    params.append(key, JSON.stringify(value));
                } else {
                    params.append(key, String(value));
                }
            }
            
            if (typeof obj === 'object' && !Array.isArray(obj)) {
                for (const [key, value] of Object.entries(obj)) {
                    addParam(key, value);
                }
            } else {
                params.append('data', JSON.stringify(obj));
            }
            
            return params.toString();
        }

        jsonToBase64(obj) {
            const jsonString = JSON.stringify(obj);
            return btoa(unescape(encodeURIComponent(jsonString)));
        }

        yamlValue(value) {
            if (value === null) return 'null';
            if (typeof value === 'string') {
                // Check if string needs quotes
                if (value.includes('\n') || value.includes(':') || value.includes('-') || 
                    value.trim() !== value || /^[0-9]/.test(value)) {
                    return `"${value.replace(/"/g, '\\"')}"`;
                }
                return value;
            }
            return String(value);
        }

        escapeXML(str) {
            return str.replace(/[<>&'"]/g, function (c) {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case "'": return '&apos;';
                    case '"': return '&quot;';
                }
            });
        }

        updateAnalysis(parsed = null, originalInput = '') {
            if (!parsed && originalInput) {
                try {
                    parsed = JSON.parse(originalInput);
                } catch (e) {
                    this.clearAnalysis();
                    return;
                }
            }
            
            if (!parsed) {
                const input = this.jsonInput ? this.jsonInput.value.trim() : '';
                if (input) {
                    try {
                        parsed = JSON.parse(input);
                        originalInput = input;
                    } catch (e) {
                        this.clearAnalysis();
                        return;
                    }
                } else {
                    this.clearAnalysis();
                    return;
                }
            }
            
            if (!originalInput) {
                originalInput = this.jsonInput ? this.jsonInput.value : '';
            }
            
            // Calculate size
            const size = new Blob([originalInput]).size;
            const sizeStr = this.formatBytes(size);
            
            // Count keys
            const keyCount = this.countKeys(parsed);
            
            // Calculate depth
            const depth = this.calculateDepth(parsed);
            
            // Determine type
            const type = this.getJSONType(parsed);
            
            // Update display
            if (this.jsonSize) this.jsonSize.textContent = sizeStr;
            if (this.jsonKeys) this.jsonKeys.textContent = keyCount.toString();
            if (this.jsonDepth) this.jsonDepth.textContent = depth.toString();
            if (this.jsonType) this.jsonType.textContent = type;
            
            // Show analysis section
            if (this.analysisResults) {
                this.analysisResults.style.display = 'block';
            }
        }

        clearAnalysis() {
            if (this.jsonSize) this.jsonSize.textContent = '-';
            if (this.jsonKeys) this.jsonKeys.textContent = '-';
            if (this.jsonDepth) this.jsonDepth.textContent = '-';
            if (this.jsonType) this.jsonType.textContent = '-';
        }

        countKeys(obj) {
            let count = 0;
            
            function countRecursive(item) {
                if (typeof item === 'object' && item !== null) {
                    if (Array.isArray(item)) {
                        item.forEach(countRecursive);
                    } else {
                        count += Object.keys(item).length;
                        Object.values(item).forEach(countRecursive);
                    }
                }
            }
            
            countRecursive(obj);
            return count;
        }

        calculateDepth(obj) {
            function getDepth(item) {
                if (typeof item !== 'object' || item === null) {
                    return 0;
                }
                
                if (Array.isArray(item)) {
                    return item.length > 0 ? 1 + Math.max(...item.map(getDepth)) : 1;
                } else {
                    const values = Object.values(item);
                    return values.length > 0 ? 1 + Math.max(...values.map(getDepth)) : 1;
                }
            }
            
            return getDepth(obj);
        }

        getJSONType(obj) {
            if (obj === null) return 'null';
            if (Array.isArray(obj)) return `Array (${obj.length} items)`;
            if (typeof obj === 'object') return `Object (${Object.keys(obj).length} properties)`;
            return typeof obj;
        }

        formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        parseJSONError(error) {
            const message = error.message;
            
            // Try to extract line and column information
            const match = message.match(/position (\d+)/);
            if (match) {
                const position = parseInt(match[1]);
                const input = this.jsonInput ? this.jsonInput.value : '';
                const lines = input.substring(0, position).split('\n');
                const line = lines.length;
                const column = lines[lines.length - 1].length + 1;
                return `${message} (Line ${line}, Column ${column})`;
            }
            
            return message;
        }

        showValidationResult(isValid, message) {
            // Clear any existing timeout
            if (this.validationTimeout) {
                clearTimeout(this.validationTimeout);
                this.validationTimeout = null;
            }

            if (this.validationResults) {
                this.validationResults.style.display = 'block';
                this.validationResults.className = isValid 
                    ? 'validation-success p-4 rounded-lg bg-green-900/30 border border-green-600/50'
                    : 'validation-error p-4 rounded-lg bg-red-900/30 border border-red-600/50';
            }
            
            if (this.validationMessage) {
                this.validationMessage.textContent = message;
                this.validationMessage.className = isValid 
                    ? 'text-green-400 font-medium'
                    : 'text-red-400 font-medium';
            }

            // Auto-hide validation results after 4 seconds (success) or 6 seconds (error)
            const hideDelay = isValid ? 4000 : 6000;
            this.validationTimeout = setTimeout(() => {
                this.hideValidationResult();
            }, hideDelay);
        }

        hideValidationResult() {
            if (this.validationResults) {
                this.validationResults.style.display = 'none';
            }
            
            // Clear the timeout reference
            if (this.validationTimeout) {
                clearTimeout(this.validationTimeout);
                this.validationTimeout = null;
            }
        }

        showFormattedOutput(output) {
            if (this.formattedOutput) {
                this.formattedOutput.value = output;
                this.formattedOutput.style.display = 'block';
            }
        }

        showError(message) {
            if (this.errorDisplay) {
                this.errorDisplay.style.display = 'block';
            }
            if (this.errorMessage) {
                this.errorMessage.textContent = message;
            }
        }

        clearErrors() {
            if (this.errorDisplay) {
                this.errorDisplay.style.display = 'none';
            }
        }

        clearOutputs() {
            if (this.formattedOutput) {
                this.formattedOutput.value = '';
            }
        }

        clearAll() {
            if (this.jsonInput) {
                this.jsonInput.value = '';
            }
            this.clearOutputs();
            this.clearErrors();
            if (this.validationResults) {
                this.validationResults.style.display = 'none';
            }
            // Clear any active validation timeout
            if (this.validationTimeout) {
                clearTimeout(this.validationTimeout);
                this.validationTimeout = null;
            }
            this.clearAnalysis();
        }

        copyToClipboard(button) {
            const targetId = button.getAttribute('data-copy-target');
            const targetElement = document.getElementById(targetId);
            
            if (!targetElement || button.classList.contains('loading')) return;

            let text;
            if (targetElement.tagName.toLowerCase() === 'textarea' || targetElement.tagName.toLowerCase() === 'input') {
                text = targetElement.value.trim();
            } else {
                text = targetElement.textContent.trim();
            }
            
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
    }

    // Store the class globally to prevent redeclaration
    window.JSONValidator = JSONValidator;

    // Function to initialize the validator
    window.initJSONValidator = function() {
        // Clear any existing instance
        if (window.jsonValidatorInstance) {
            window.jsonValidatorInstance = null;
        }
        
        // Only initialize if the json validator container exists
        if (document.querySelector('.json-validator-container')) {
            window.jsonValidatorInstance = new JSONValidator();
        }
    };
})();