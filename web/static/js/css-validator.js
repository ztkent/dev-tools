// CSS Validator Tool JavaScript
(function() {
    'use strict';

    // Prevent multiple initializations
    if (window.CSSValidator) {
        return;
    }

    class CSSValidator {
        constructor() {
            this.validationTimeout = null;
            this.cssRules = [];
            this.initializeElements();
            this.bindEvents();
            this.initializeSettings();
        }

        initializeElements() {
            // Input elements
            this.cssInput = document.getElementById('css-input');
            
            // Button elements
            this.validateBtn = document.getElementById('validate-btn');
            this.formatBtn = document.getElementById('format-btn');
            this.minifyBtn = document.getElementById('minify-btn');
            this.analyzeBtn = document.getElementById('analyze-btn');
            this.clearBtn = document.getElementById('clear-btn');
            
            // Output elements
            this.validationResults = document.getElementById('validation-results');
            this.validationMessage = document.getElementById('validation-message');
            this.formattedOutput = document.getElementById('formatted-output');
            this.issuesDisplay = document.getElementById('issues-display');
            this.issuesList = document.getElementById('issues-list');
            
            // Settings elements
            this.validationLevel = document.getElementById('validation-level');
            this.cssVersion = document.getElementById('css-version');
            this.formatOutput = document.getElementById('format-output');
            this.autoValidateCheckbox = document.getElementById('auto-validate');
            
            // Statistics elements
            this.cssStats = document.getElementById('css-stats');
            this.cssSize = document.getElementById('css-size');
            this.cssRulesCount = document.getElementById('css-rules');
            this.cssSelectors = document.getElementById('css-selectors');
            this.cssProperties = document.getElementById('css-properties');
            
            // Color palette elements
            this.colorPalette = document.getElementById('color-palette');
            this.colorList = document.getElementById('color-list');
            
            // Performance analysis elements
            this.performanceAnalysis = document.getElementById('performance-analysis');
            this.originalSize = document.getElementById('original-size');
            this.minifiedSize = document.getElementById('minified-size');
            this.compressionRatio = document.getElementById('compression-ratio');
            this.gzipSize = document.getElementById('gzip-size');
            
            // Browser compatibility elements
            this.browserCompatibility = document.getElementById('browser-compatibility');
            this.compatibilityList = document.getElementById('compatibility-list');
        }

        bindEvents() {
            // Button events
            if (this.validateBtn) {
                this.validateBtn.addEventListener('click', () => this.validateCSS());
            }
            
            if (this.formatBtn) {
                this.formatBtn.addEventListener('click', () => this.formatCSS());
            }
            
            if (this.minifyBtn) {
                this.minifyBtn.addEventListener('click', () => this.minifyCSS());
            }
            
            if (this.analyzeBtn) {
                this.analyzeBtn.addEventListener('click', () => this.analyzeCSS());
            }
            
            if (this.clearBtn) {
                this.clearBtn.addEventListener('click', () => this.clearAll());
            }

            // Input events
            if (this.cssInput) {
                this.cssInput.addEventListener('input', () => this.handleInputChange());
                this.cssInput.addEventListener('paste', () => {
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
                if (e.target.classList.contains('copy-button') && e.target.hasAttribute('data-copy-target')) {
                    this.copyToClipboard(e.target);
                }
            });
        }

        initializeSettings() {
            // Set default values
            if (this.validationLevel && !this.validationLevel.value) {
                this.validationLevel.value = 'standard';
            }
            
            if (this.cssVersion && !this.cssVersion.value) {
                this.cssVersion.value = 'css3';
            }
            
            if (this.formatOutput && !this.formatOutput.value) {
                this.formatOutput.value = 'formatted';
            }
            
            // Load sample CSS if input is empty
            if (this.cssInput && !this.cssInput.value.trim()) {
                this.loadSampleCSS();
            }
        }

        loadSampleCSS() {
            const sampleCSS = `/* Modern CSS Sample */
:root {
  --primary-color: #0bb1ee;
  --secondary-color: #223f49;
  --text-color: #ffffff;
  --background-color: #101e23;
  --border-radius: 8px;
  --transition: all 0.2s ease;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.card {
  background: var(--secondary-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: var(--transition);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: var(--background-color);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
  cursor: pointer;
}

.btn:hover {
  background: #0a9fd6;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .container {
    padding: 0 0.5rem;
  }
  
  .card {
    padding: 1rem;
  }
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Flexbox utilities */
.flex {
  display: flex;
}

.flex-center {
  align-items: center;
  justify-content: center;
}

.flex-between {
  justify-content: space-between;
}`;
            
            if (this.cssInput) {
                this.cssInput.value = sampleCSS;
                this.updateStatistics();
            }
        }

        handleInputChange() {
            if (this.autoValidateCheckbox && this.autoValidateCheckbox.checked) {
                this.validateCSS();
            }
            this.updateStatistics();
        }

        validateCSS() {
            const input = this.cssInput ? this.cssInput.value.trim() : '';
            
            this.clearIssues();
            
            if (!input) {
                this.showValidationResult(false, 'Please enter CSS to validate');
                this.clearOutputs();
                return null;
            }

            try {
                const analysis = this.parseCSS(input);
                const issues = this.findIssues(analysis, input);
                
                if (issues.length === 0) {
                    this.showValidationResult(true, 'Valid CSS! No issues found.');
                } else {
                    this.showValidationResult(false, `Found ${issues.length} issue${issues.length > 1 ? 's' : ''} in your CSS.`);
                    this.displayIssues(issues);
                }
                
                this.updateStatistics(analysis);
                this.extractColorPalette(input);
                this.analyzePerformance(input);
                this.checkBrowserCompatibility(analysis);
                
                return analysis;
            } catch (error) {
                this.showValidationResult(false, `CSS parsing error: ${error.message}`);
                this.clearOutputs();
                return null;
            }
        }

        parseCSS(cssText) {
            // Basic CSS parser - in production, you'd use a more robust parser
            const analysis = {
                rules: [],
                selectors: [],
                properties: [],
                values: [],
                mediaQueries: [],
                keyframes: [],
                imports: [],
                customProperties: []
            };

            // Remove comments
            let cleanCSS = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
            
            // Extract @import statements
            const importRegex = /@import\s+[^;]+;/g;
            let match;
            while ((match = importRegex.exec(cleanCSS)) !== null) {
                analysis.imports.push(match[0]);
            }

            // Extract @media queries
            const mediaRegex = /@media[^{]+\{[^{}]*\{[^}]*\}[^{}]*\}/g;
            while ((match = mediaRegex.exec(cleanCSS)) !== null) {
                analysis.mediaQueries.push(match[0]);
            }

            // Extract @keyframes
            const keyframesRegex = /@keyframes[^{]+\{[^{}]*(?:\{[^}]*\}[^{}]*)*\}/g;
            while ((match = keyframesRegex.exec(cleanCSS)) !== null) {
                analysis.keyframes.push(match[0]);
            }

            // Extract CSS custom properties (CSS variables)
            const customPropRegex = /--([\w-]+)\s*:\s*([^;]+)/g;
            while ((match = customPropRegex.exec(cleanCSS)) !== null) {
                analysis.customProperties.push({
                    name: `--${match[1]}`,
                    value: match[2].trim()
                });
            }

            // Extract regular CSS rules
            const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
            while ((match = ruleRegex.exec(cleanCSS)) !== null) {
                const selector = match[1].trim();
                const declarations = match[2].trim();
                
                if (!selector.startsWith('@')) {
                    analysis.selectors.push(selector);
                    
                    const properties = declarations.split(';').filter(prop => prop.trim());
                    properties.forEach(prop => {
                        const [property, value] = prop.split(':').map(s => s.trim());
                        if (property && value) {
                            analysis.properties.push(property);
                            analysis.values.push(value);
                        }
                    });
                    
                    analysis.rules.push({
                        selector: selector,
                        declarations: declarations,
                        properties: properties
                    });
                }
            }

            return analysis;
        }

        findIssues(analysis, cssText) {
            const issues = [];
            const validationLevel = this.validationLevel ? this.validationLevel.value : 'standard';

            // Check for common CSS issues
            analysis.rules.forEach((rule, ruleIndex) => {
                // Check for duplicate selectors
                const duplicates = analysis.rules.filter((r, i) => i !== ruleIndex && r.selector === rule.selector);
                if (duplicates.length > 0) {
                    issues.push({
                        type: 'warning',
                        category: 'Duplication',
                        message: `Duplicate selector: "${rule.selector}"`,
                        line: this.findLineNumber(cssText, rule.selector),
                        suggestion: 'Consider combining duplicate selectors to reduce CSS size'
                    });
                }

                // Check for vendor prefixes without standard property
                rule.properties.forEach(prop => {
                    const [property] = prop.split(':').map(s => s.trim());
                    if (property.startsWith('-webkit-') || property.startsWith('-moz-') || 
                        property.startsWith('-ms-') || property.startsWith('-o-')) {
                        const standardProp = property.replace(/^-\w+-/, '');
                        const hasStandard = rule.properties.some(p => p.trim().startsWith(standardProp + ':'));
                        if (!hasStandard && validationLevel === 'strict') {
                            issues.push({
                                type: 'warning',
                                category: 'Compatibility',
                                message: `Vendor prefix "${property}" without standard property`,
                                line: this.findLineNumber(cssText, property),
                                suggestion: `Add the standard property: ${standardProp}`
                            });
                        }
                    }
                });
            });

            // Check for unknown properties
            if (validationLevel === 'strict') {
                analysis.properties.forEach(property => {
                    if (!this.isValidCSSProperty(property)) {
                        issues.push({
                            type: 'error',
                            category: 'Syntax',
                            message: `Unknown CSS property: "${property}"`,
                            line: this.findLineNumber(cssText, property),
                            suggestion: 'Check the property name for typos'
                        });
                    }
                });
            }

            // Check for empty rules
            analysis.rules.forEach(rule => {
                if (!rule.declarations.trim()) {
                    issues.push({
                        type: 'warning',
                        category: 'Optimization',
                        message: `Empty rule: "${rule.selector}"`,
                        line: this.findLineNumber(cssText, rule.selector),
                        suggestion: 'Remove empty CSS rules to reduce file size'
                    });
                }
            });

            return issues;
        }

        isValidCSSProperty(property) {
            // List of common CSS properties - in production, use a comprehensive list
            const commonProperties = [
                'display', 'position', 'top', 'right', 'bottom', 'left', 'float', 'clear',
                'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
                'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
                'border', 'border-width', 'border-style', 'border-color', 'border-radius',
                'background', 'background-color', 'background-image', 'background-repeat',
                'background-position', 'background-size', 'background-attachment',
                'color', 'font', 'font-family', 'font-size', 'font-weight', 'font-style',
                'line-height', 'text-align', 'text-decoration', 'text-transform',
                'letter-spacing', 'word-spacing', 'white-space', 'vertical-align',
                'list-style', 'list-style-type', 'list-style-position', 'list-style-image',
                'table-layout', 'border-collapse', 'border-spacing', 'empty-cells',
                'caption-side', 'overflow', 'overflow-x', 'overflow-y', 'clip', 'visibility',
                'z-index', 'opacity', 'box-shadow', 'text-shadow', 'transform', 'transition',
                'animation', 'flex', 'flex-direction', 'flex-wrap', 'justify-content',
                'align-items', 'align-content', 'grid', 'grid-template-columns',
                'grid-template-rows', 'grid-gap', 'gap', 'box-sizing', 'cursor', 'outline'
            ];

            return commonProperties.includes(property) || 
                   property.startsWith('--') || // CSS custom properties
                   property.startsWith('-webkit-') || // Vendor prefixes
                   property.startsWith('-moz-') ||
                   property.startsWith('-ms-') ||
                   property.startsWith('-o-');
        }

        findLineNumber(cssText, searchText) {
            const lines = cssText.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(searchText)) {
                    return i + 1;
                }
            }
            return 1;
        }

        formatCSS() {
            const input = this.cssInput ? this.cssInput.value.trim() : '';
            
            if (!input) {
                this.showValidationResult(false, 'Please enter CSS to format');
                return;
            }

            try {
                const formatted = this.prettifyCSS(input);
                this.showFormattedOutput(formatted);
                this.showValidationResult(true, 'CSS formatted successfully!');
            } catch (error) {
                this.showValidationResult(false, 'Error formatting CSS: ' + error.message);
            }
        }

        minifyCSS() {
            const input = this.cssInput ? this.cssInput.value.trim() : '';
            
            if (!input) {
                this.showValidationResult(false, 'Please enter CSS to minify');
                return;
            }

            try {
                const minified = this.minifyCSSText(input);
                this.showFormattedOutput(minified);
                this.showValidationResult(true, 'CSS minified successfully!');
                this.analyzePerformance(input, minified);
            } catch (error) {
                this.showValidationResult(false, 'Error minifying CSS: ' + error.message);
            }
        }

        analyzeCSS() {
            const input = this.cssInput ? this.cssInput.value.trim() : '';
            
            if (!input) {
                this.showValidationResult(false, 'Please enter CSS to analyze');
                return;
            }

            try {
                const analysis = this.parseCSS(input);
                this.updateStatistics(analysis);
                this.extractColorPalette(input);
                this.analyzePerformance(input);
                this.checkBrowserCompatibility(analysis);
                this.showValidationResult(true, 'CSS analysis completed!');
            } catch (error) {
                this.showValidationResult(false, 'Error analyzing CSS: ' + error.message);
            }
        }

        prettifyCSS(cssText) {
            // Remove comments and normalize whitespace
            let formatted = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
            
            // Add proper spacing around braces
            formatted = formatted.replace(/\{/g, ' {\n');
            formatted = formatted.replace(/\}/g, '\n}\n');
            formatted = formatted.replace(/;/g, ';\n');
            
            // Format selectors
            formatted = formatted.replace(/,/g, ',\n');
            
            // Clean up multiple newlines and spaces
            formatted = formatted.replace(/\n\s*\n/g, '\n');
            formatted = formatted.replace(/^\s+|\s+$/gm, '');
            
            // Add proper indentation
            const lines = formatted.split('\n');
            let indentLevel = 0;
            const indentedLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                
                if (trimmed.includes('}')) indentLevel--;
                const indented = '  '.repeat(Math.max(0, indentLevel)) + trimmed;
                if (trimmed.includes('{')) indentLevel++;
                
                return indented;
            });
            
            return indentedLines.join('\n').trim();
        }

        minifyCSSText(cssText) {
            return cssText
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
                .replace(/\s*{\s*/g, '{') // Remove space around opening braces
                .replace(/;\s*/g, ';') // Remove space after semicolons
                .replace(/:\s*/g, ':') // Remove space after colons
                .replace(/,\s*/g, ',') // Remove space after commas
                .trim();
        }

        updateStatistics(analysis = null) {
            const input = this.cssInput ? this.cssInput.value.trim() : '';
            
            if (!input) {
                this.clearStatistics();
                return;
            }

            if (!analysis) {
                analysis = this.parseCSS(input);
            }

            // Calculate size
            const size = new Blob([input]).size;
            const sizeStr = this.formatBytes(size);
            
            // Update display
            if (this.cssSize) this.cssSize.textContent = sizeStr;
            if (this.cssRulesCount) this.cssRulesCount.textContent = analysis.rules.length.toString();
            if (this.cssSelectors) this.cssSelectors.textContent = analysis.selectors.length.toString();
            if (this.cssProperties) this.cssProperties.textContent = analysis.properties.length.toString();
            
            // Show statistics section
            if (this.cssStats) {
                this.cssStats.style.display = 'block';
            }
        }

        extractColorPalette(cssText) {
            const colors = new Set();
            
            // Match various color formats
            const colorRegex = /#([0-9a-fA-F]{3,6})|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;
            let match;
            
            while ((match = colorRegex.exec(cssText)) !== null) {
                colors.add(match[0]);
            }
            
            // Match named colors (basic set)
            const namedColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey'];
            namedColors.forEach(color => {
                const regex = new RegExp(`\\b${color}\\b`, 'gi');
                if (regex.test(cssText)) {
                    colors.add(color);
                }
            });

            if (colors.size > 0) {
                this.displayColorPalette(Array.from(colors));
            }
        }

        displayColorPalette(colors) {
            if (!this.colorList) return;
            
            this.colorList.innerHTML = '';
            
            colors.forEach(color => {
                const colorItem = document.createElement('div');
                colorItem.className = 'flex items-center gap-2 p-2 bg-[#101e23] rounded-lg border border-[#223f49]';
                
                const colorSwatch = document.createElement('div');
                colorSwatch.className = 'w-6 h-6 rounded border border-white/20';
                colorSwatch.style.backgroundColor = color;
                
                const colorText = document.createElement('span');
                colorText.className = 'text-white font-mono text-sm';
                colorText.textContent = color;
                
                colorItem.appendChild(colorSwatch);
                colorItem.appendChild(colorText);
                this.colorList.appendChild(colorItem);
            });
            
            if (this.colorPalette) {
                this.colorPalette.style.display = 'block';
            }
        }

        analyzePerformance(originalCSS, minifiedCSS = null) {
            if (!minifiedCSS) {
                minifiedCSS = this.minifyCSSText(originalCSS);
            }
            
            const originalSize = new Blob([originalCSS]).size;
            const minifiedSize = new Blob([minifiedCSS]).size;
            const compressionRatio = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
            const estimatedGzipSize = Math.round(minifiedSize * 0.3); // Rough estimation
            
            if (this.originalSize) this.originalSize.textContent = this.formatBytes(originalSize);
            if (this.minifiedSize) this.minifiedSize.textContent = this.formatBytes(minifiedSize);
            if (this.compressionRatio) this.compressionRatio.textContent = `${compressionRatio}%`;
            if (this.gzipSize) this.gzipSize.textContent = this.formatBytes(estimatedGzipSize);
            
            if (this.performanceAnalysis) {
                this.performanceAnalysis.style.display = 'block';
            }
        }

        checkBrowserCompatibility(analysis) {
            const compatibilityIssues = [];
            
            // Check for modern CSS features
            analysis.properties.forEach(property => {
                if (property.includes('grid')) {
                    compatibilityIssues.push({
                        feature: 'CSS Grid',
                        support: 'IE 10+ (partial), Modern browsers (full)',
                        severity: 'low'
                    });
                }
                if (property.includes('flex')) {
                    compatibilityIssues.push({
                        feature: 'Flexbox',
                        support: 'IE 10+ (partial), Modern browsers (full)',
                        severity: 'low'
                    });
                }
                if (property.includes('transform')) {
                    compatibilityIssues.push({
                        feature: 'CSS Transforms',
                        support: 'IE 9+, Modern browsers',
                        severity: 'low'
                    });
                }
            });

            this.displayCompatibilityInfo(compatibilityIssues);
        }

        displayCompatibilityInfo(issues) {
            if (!this.compatibilityList) return;
            
            this.compatibilityList.innerHTML = '';
            
            if (issues.length === 0) {
                const noIssues = document.createElement('div');
                noIssues.className = 'text-green-400 text-sm';
                noIssues.textContent = 'No compatibility issues detected';
                this.compatibilityList.appendChild(noIssues);
            } else {
                issues.forEach(issue => {
                    const issueItem = document.createElement('div');
                    issueItem.className = 'flex justify-between items-center text-sm';
                    
                    const feature = document.createElement('span');
                    feature.className = 'text-white';
                    feature.textContent = issue.feature;
                    
                    const support = document.createElement('span');
                    support.className = 'text-[#90bbcb] text-xs';
                    support.textContent = issue.support;
                    
                    issueItem.appendChild(feature);
                    issueItem.appendChild(support);
                    this.compatibilityList.appendChild(issueItem);
                });
            }
            
            if (this.browserCompatibility) {
                this.browserCompatibility.style.display = 'block';
            }
        }

        displayIssues(issues) {
            if (!this.issuesList) return;
            
            this.issuesList.innerHTML = '';
            
            issues.forEach(issue => {
                const issueItem = document.createElement('div');
                issueItem.className = `p-3 rounded border-l-4 ${
                    issue.type === 'error' ? 'bg-red-900/20 border-red-500' : 'bg-yellow-900/20 border-yellow-500'
                }`;
                
                const issueHeader = document.createElement('div');
                issueHeader.className = 'flex justify-between items-start mb-1';
                
                const issueTitle = document.createElement('div');
                issueTitle.className = `font-semibold ${issue.type === 'error' ? 'text-red-400' : 'text-yellow-400'}`;
                issueTitle.textContent = `${issue.category} ${issue.type}`;
                
                const issueLine = document.createElement('div');
                issueLine.className = 'text-xs text-[#90bbcb]';
                issueLine.textContent = `Line ${issue.line}`;
                
                issueHeader.appendChild(issueTitle);
                issueHeader.appendChild(issueLine);
                
                const issueMessage = document.createElement('div');
                issueMessage.className = 'text-white text-sm mb-2';
                issueMessage.textContent = issue.message;
                
                const issueSuggestion = document.createElement('div');
                issueSuggestion.className = 'text-[#90bbcb] text-xs';
                issueSuggestion.textContent = issue.suggestion;
                
                issueItem.appendChild(issueHeader);
                issueItem.appendChild(issueMessage);
                issueItem.appendChild(issueSuggestion);
                
                this.issuesList.appendChild(issueItem);
            });
            
            if (this.issuesDisplay) {
                this.issuesDisplay.style.display = 'block';
            }
        }

        formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        showValidationResult(isValid, message) {
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

            const hideDelay = isValid ? 4000 : 6000;
            this.validationTimeout = setTimeout(() => {
                this.hideValidationResult();
            }, hideDelay);
        }

        hideValidationResult() {
            if (this.validationResults) {
                this.validationResults.style.display = 'none';
            }
            
            if (this.validationTimeout) {
                clearTimeout(this.validationTimeout);
                this.validationTimeout = null;
            }
        }

        showFormattedOutput(output) {
            if (this.formattedOutput) {
                this.formattedOutput.value = output;
            }
        }

        clearIssues() {
            if (this.issuesDisplay) {
                this.issuesDisplay.style.display = 'none';
            }
        }

        clearOutputs() {
            if (this.formattedOutput) {
                this.formattedOutput.value = '';
            }
        }

        clearStatistics() {
            if (this.cssSize) this.cssSize.textContent = '-';
            if (this.cssRulesCount) this.cssRulesCount.textContent = '-';
            if (this.cssSelectors) this.cssSelectors.textContent = '-';
            if (this.cssProperties) this.cssProperties.textContent = '-';
            
            if (this.cssStats) this.cssStats.style.display = 'none';
            if (this.colorPalette) this.colorPalette.style.display = 'none';
            if (this.performanceAnalysis) this.performanceAnalysis.style.display = 'none';
            if (this.browserCompatibility) this.browserCompatibility.style.display = 'none';
        }

        clearAll() {
            if (this.cssInput) {
                this.cssInput.value = '';
            }
            this.clearOutputs();
            this.clearIssues();
            if (this.validationResults) {
                this.validationResults.style.display = 'none';
            }
            if (this.validationTimeout) {
                clearTimeout(this.validationTimeout);
                this.validationTimeout = null;
            }
            this.clearStatistics();
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

            const originalText = button.textContent;
            button.classList.add('loading');
            button.textContent = 'Copying...';

            navigator.clipboard.writeText(text).then(() => {
                this.showCopySuccess(button, originalText);
            }).catch(() => {
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
    window.CSSValidator = CSSValidator;

    // Function to initialize the validator
    window.initCSSValidator = function() {
        if (window.cssValidatorInstance) {
            window.cssValidatorInstance = null;
        }
        
        if (document.querySelector('.css-validator-container')) {
            window.cssValidatorInstance = new CSSValidator();
        }
    };
})();