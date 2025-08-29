// IP/DNS Analysis Tool JavaScript
(function() {
    'use strict';

    // Prevent multiple initializations
    if (window.IPDNSAnalyzer) {
        return;
    }

    class IPDNSAnalyzer {
        constructor() {
            this.currentIP = null;
            this.analysisCache = new Map();
            this.analysisHistory = [];
            this.maxHistorySize = 50;
            this.initializeElements();
            this.bindEvents();
            this.loadCurrentIP();
            this.loadHistoryFromStorage();
        }

        initializeElements() {
            // Main elements
            this.currentIPDisplay = document.getElementById('current-ip');
            this.refreshIPBtn = document.getElementById('refresh-ip-btn');
            this.analyzeIPBtn = document.getElementById('analyze-ip-btn');
            
            // IP Analysis elements
            this.ipInput = document.getElementById('ip-input');
            this.ipResults = document.getElementById('ip-results');
            this.ipLoading = document.getElementById('ip-loading');
            this.ipError = document.getElementById('ip-error');
            
            // DNS Analysis elements
            this.domainInput = document.getElementById('domain-input');
            this.recordTypeSelect = document.getElementById('record-type');
            this.dnsLookupBtn = document.getElementById('dns-lookup-btn');
            this.dnsResults = document.getElementById('dns-results');
            this.dnsLoading = document.getElementById('dns-loading');
            this.dnsError = document.getElementById('dns-error');
            
            this.tracerouteInput = document.getElementById('traceroute-input');
            this.tracerouteBtn = document.getElementById('traceroute-btn');
            this.tracerouteResults = document.getElementById('traceroute-results');
            this.tracerouteLoading = document.getElementById('traceroute-loading');
            this.tracerouteError = document.getElementById('traceroute-error');
            
            this.performanceInput = document.getElementById('performance-input');
            this.performanceBtn = document.getElementById('performance-btn');
            this.performanceResults = document.getElementById('performance-results');
            this.performanceLoading = document.getElementById('performance-loading');
            this.performanceError = document.getElementById('performance-error');
            
            this.bulkInput = document.getElementById('bulk-input');
            this.bulkBtn = document.getElementById('bulk-btn');
            this.bulkResults = document.getElementById('bulk-results');
            this.bulkLoading = document.getElementById('bulk-loading');
            this.bulkError = document.getElementById('bulk-error');
            
            this.historyContainer = document.getElementById('history-container');
            this.historyList = document.getElementById('history-list');
            
            // Current IP info display elements
            this.currentIPInfo = document.getElementById('current-ip-info');
            this.ipVersion = document.getElementById('ip-version');
            this.ipType = document.getElementById('ip-type');
            this.ipCountry = document.getElementById('ip-country');
            this.ipRegion = document.getElementById('ip-region');
            this.ipCity = document.getElementById('ip-city');
            this.ipISP = document.getElementById('ip-isp');
            this.ipOrg = document.getElementById('ip-org');
            this.ipASN = document.getElementById('ip-asn');
            this.ipHostname = document.getElementById('ip-hostname');
        }

        bindEvents() {
            // IP Analysis events
            if (this.refreshIPBtn) {
                this.refreshIPBtn.addEventListener('click', () => this.loadCurrentIP());
            }
            
            if (this.analyzeIPBtn) {
                this.analyzeIPBtn.addEventListener('click', () => this.analyzeCustomIP());
            }
            
            if (this.ipInput) {
                this.ipInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.analyzeCustomIP();
                    }
                });
            }

            // DNS Analysis events
            if (this.dnsLookupBtn) {
                this.dnsLookupBtn.addEventListener('click', () => this.performDNSLookup());
            }
            
            if (this.domainInput) {
                this.domainInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performDNSLookup();
                    }
                });
            }

            if (this.tracerouteBtn) {
                this.tracerouteBtn.addEventListener('click', () => this.performTraceroute());
            }
            
            if (this.tracerouteInput) {
                this.tracerouteInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performTraceroute();
                    }
                });
            }

            if (this.performanceBtn) {
                this.performanceBtn.addEventListener('click', () => this.analyzePerformance());
            }
            
            if (this.performanceInput) {
                this.performanceInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.analyzePerformance();
                    }
                });
            }

            if (this.bulkBtn) {
                this.bulkBtn.addEventListener('click', () => this.performBulkAnalysis());
            }
        }

        async loadCurrentIP() {
            this.showLoading('ip');
            this.clearError('ip');

            try {
                let ip;
                
                try {
                    // Try JSONP first (no CORS issues)
                    ip = await this.getIPViaJSONP();
                } catch (jsonpError) {
                    // Fallback to fetch with CORS-enabled services
                    ip = await this.getIPViaFetch();
                }
                
                // Create a basic IP info object with just the IP
                this.currentIP = {
                    ip: ip,
                    version: this.detectIPVersion(ip),
                    type: 'public' // Client-side detected IPs are always public
                };
                
                // Display basic info first
                this.displayCurrentIPInfo(this.currentIP);
                
                // Auto-populate the input field
                if (this.ipInput) {
                    this.ipInput.value = ip;
                }
                
                // Automatically analyze the IP for detailed information
                try {
                    const analysis = await this.performIPAnalysis(ip);
                    // Update the current IP info with full analysis
                    this.currentIP = analysis;
                    this.displayCurrentIPInfo(analysis);
                    
                    // Auto-run additional analyses for the current IP
                    this.performAutoAnalyses(ip);
                } catch (analysisError) {
                    console.warn('Failed to auto-analyze current IP:', analysisError);
                    // Keep the basic info if detailed analysis fails
                    
                    // Still try to run auto analyses even if detailed IP analysis fails
                    this.performAutoAnalyses(ip);
                }
                
            } catch (error) {
                console.error('Error loading current IP:', error);
                this.showError('ip', 'Failed to detect your public IP address. Please check your internet connection and try again.');
            } finally {
                this.hideLoading('ip');
            }
        }

        // Use JSONP to get IP address without CORS issues
        getIPViaJSONP() {
            return new Promise((resolve, reject) => {
                // Try ipify first (supports JSONP)
                const script = document.createElement('script');
                const callbackName = 'ipCallback_' + Date.now();
                
                // Create global callback
                window[callbackName] = function(data) {
                    cleanup();
                    if (data && data.ip) {
                        resolve(data.ip);
                    } else {
                        reject(new Error('No IP returned'));
                    }
                };
                
                const cleanup = () => {
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                    delete window[callbackName];
                };
                
                script.onerror = () => {
                    cleanup();
                    // Fallback to fetch method
                    reject(new Error('JSONP failed'));
                };
                
                script.src = `https://api.ipify.org?format=jsonp&callback=${callbackName}`;
                document.head.appendChild(script);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    cleanup();
                    reject(new Error('JSONP request timeout'));
                }, 10000);
            });
        }

        // Fallback method using fetch with a CORS-enabled service
        async getIPViaFetch() {
            // Try services known to have proper CORS headers
            const services = [
                'https://ipapi.co/json/',
                'https://ipinfo.io/json'
            ];

            for (const service of services) {
                try {
                    const response = await fetch(service);
                    if (!response.ok) continue;
                    
                    const data = await response.json();
                    
                    // Different services return IP in different fields
                    if (data.ip) return data.ip;
                    if (data.query) return data.query;
                    
                } catch (error) {
                    console.warn(`Service ${service} failed:`, error);
                    continue;
                }
            }
            
            throw new Error('All IP detection services failed');
        }

        // Helper method to perform IP analysis
        async performIPAnalysis(ip) {
            const response = await fetch(`/api/ip/analyze/${encodeURIComponent(ip)}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }

        // Automatically perform additional analyses for the current IP
        async performAutoAnalyses(ip) {
            // Auto-populate input fields with current IP
            if (this.domainInput) {
                this.domainInput.value = ip;
            }
            if (this.tracerouteInput) {
                this.tracerouteInput.value = ip;
            }
            if (this.performanceInput) {
                this.performanceInput.value = ip;
            }

            // Perform DNS lookup for the IP (PTR records)
            try {
                console.log('Auto-performing DNS lookup for current IP...');
                await this.performDNSLookup();
            } catch (error) {
                console.warn('Auto DNS lookup failed:', error);
            }

            // Perform traceroute to a common destination (Google DNS) to show network path
            try {
                console.log('Auto-performing traceroute analysis...');
                if (this.tracerouteInput) {
                    this.tracerouteInput.value = '8.8.8.8'; // Use Google DNS as default target
                }
                await this.performTraceroute();
            } catch (error) {
                console.warn('Auto traceroute failed:', error);
            }

            // Perform performance analysis to a common destination
            try {
                console.log('Auto-performing performance analysis...');
                if (this.performanceInput) {
                    this.performanceInput.value = '8.8.8.8'; // Use Google DNS as default target
                }
                await this.analyzePerformance();
            } catch (error) {
                console.warn('Auto performance analysis failed:', error);
            }
        }

        async analyzeCustomIP() {
            const ip = this.ipInput ? this.ipInput.value.trim() : '';
            
            if (!ip) {
                this.showError('ip', 'Please enter an IP address');
                return;
            }

            // Validate IP format
            if (!this.isValidIP(ip)) {
                this.showError('ip', 'Please enter a valid IP address');
                return;
            }

            // Check cache first
            if (this.analysisCache.has(ip)) {
                this.displayIPAnalysis(this.analysisCache.get(ip));
                return;
            }

            this.showLoading('ip');
            this.clearError('ip');

            try {
                const data = await this.performIPAnalysis(ip);
                
                // Cache the result
                this.analysisCache.set(ip, data);
                
                this.displayIPAnalysis(data);
                
                // Add to history
                this.addToHistory('IP Analysis', {
                    type: 'ip',
                    ip: ip,
                    country: data.geolocation?.country || 'Unknown',
                    isp: data.isp?.provider || 'Unknown',
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('Error analyzing IP:', error);
                this.showError('ip', `Failed to analyze IP: ${error.message}`);
            } finally {
                this.hideLoading('ip');
            }
        }

        async performDNSLookup() {
            const domain = this.domainInput ? this.domainInput.value.trim() : '';
            const recordType = this.recordTypeSelect ? this.recordTypeSelect.value : 'ALL';
            
            if (!domain) {
                this.showError('dns', 'Please enter a domain name');
                return;
            }

            this.showLoading('dns');
            this.clearError('dns');

            try {
                const response = await fetch('/api/dns/lookup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        domain: domain,
                        type: recordType
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                this.displayDNSResults(data);
                
            } catch (error) {
                console.error('Error performing DNS lookup:', error);
            } finally {
                this.hideLoading('dns');
            }
        }

        displayCurrentIPInfo(data) {
            if (this.currentIPDisplay) {
                this.currentIPDisplay.textContent = data.ip;
            }

            if (this.currentIPInfo) {
                this.currentIPInfo.style.display = 'block';
            }

            // Update basic info fields
            this.updateElement(this.ipVersion, data.version);
            this.updateElement(this.ipType, data.type);
            
            // Check if we have full analysis data or just basic detection
            if (data.geolocation || data.isp || data.dns) {
                // Full analysis data available
                if (data.geolocation) {
                    this.updateElement(this.ipCountry, data.geolocation.country || 'Unknown');
                    this.updateElement(this.ipRegion, data.geolocation.region || 'Unknown');
                    this.updateElement(this.ipCity, data.geolocation.city || 'Unknown');
                } else {
                    this.updateElement(this.ipCountry, 'Unknown');
                    this.updateElement(this.ipRegion, 'Unknown');
                    this.updateElement(this.ipCity, 'Unknown');
                }
                
                if (data.isp) {
                    this.updateElement(this.ipISP, data.isp.provider || 'Unknown');
                    this.updateElement(this.ipOrg, data.isp.organization || data.isp.provider || 'Unknown');
                    this.updateElement(this.ipASN, data.isp.asn || 'Unknown');
                } else {
                    this.updateElement(this.ipISP, 'Unknown');
                    this.updateElement(this.ipOrg, 'Unknown');
                    this.updateElement(this.ipASN, 'Unknown');
                }
                
                if (data.dns && data.dns.hostname) {
                    this.updateElement(this.ipHostname, data.dns.hostname);
                } else {
                    this.updateElement(this.ipHostname, 'Unknown');
                }
            } else {
                // Basic detection only - show loading indicators
                this.updateElement(this.ipCountry, 'Loading...');
                this.updateElement(this.ipRegion, 'Loading...');
                this.updateElement(this.ipCity, 'Loading...');
                this.updateElement(this.ipISP, 'Loading...');
                this.updateElement(this.ipOrg, 'Loading...');
                this.updateElement(this.ipASN, 'Loading...');
                this.updateElement(this.ipHostname, 'Loading...');
            }
        }

        displayIPAnalysis(data) {
            if (!this.ipResults) return;

            const html = `
                <div class="bg-[#223f49] rounded-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-white text-lg font-semibold">IP Analysis Results</h3>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- Basic Info -->
                        <div class="bg-[#101e23] rounded-lg p-4">
                            <h4 class="text-[#90bbcb] text-sm font-semibold mb-3">Basic Information</h4>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">IP Address:</span>
                                    <span class="text-white text-sm font-mono">${data.ip}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Version:</span>
                                    <span class="text-white text-sm">${data.version}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Type:</span>
                                    <span class="text-white text-sm capitalize">${data.type}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Geolocation -->
                        ${data.geolocation ? `
                        <div class="bg-[#101e23] rounded-lg p-4">
                            <h4 class="text-[#90bbcb] text-sm font-semibold mb-3">Geolocation</h4>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Country:</span>
                                    <span class="text-white text-sm">${data.geolocation.country || 'Unknown'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Region:</span>
                                    <span class="text-white text-sm">${data.geolocation.region || 'Unknown'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">City:</span>
                                    <span class="text-white text-sm">${data.geolocation.city || 'Unknown'}</span>
                                </div>
                                ${data.geolocation.timezone ? `
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Timezone:</span>
                                    <span class="text-white text-sm">${data.geolocation.timezone}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}

                        <!-- ISP Info -->
                        ${data.isp ? `
                        <div class="bg-[#101e23] rounded-lg p-4">
                            <h4 class="text-[#90bbcb] text-sm font-semibold mb-3">ISP Information</h4>
                            <div class="space-y-2">
                                ${data.isp.provider ? `
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Provider:</span>
                                    <span class="text-white text-sm">${data.isp.provider}</span>
                                </div>
                                ` : ''}
                                ${data.isp.asn ? `
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">ASN:</span>
                                    <span class="text-white text-sm font-mono">${data.isp.asn}</span>
                                </div>
                                ` : ''}
                                ${data.isp.domain ? `
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Domain:</span>
                                    <span class="text-white text-sm">${data.isp.domain}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}

                        <!-- DNS Info -->
                        ${data.dns && (data.dns.hostname || data.dns.ptr) ? `
                        <div class="bg-[#101e23] rounded-lg p-4">
                            <h4 class="text-[#90bbcb] text-sm font-semibold mb-3">DNS Information</h4>
                            <div class="space-y-2">
                                ${data.dns.hostname ? `
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Hostname:</span>
                                    <span class="text-white text-sm font-mono">${data.dns.hostname}</span>
                                </div>
                                ` : ''}
                                ${data.dns.ptr && data.dns.ptr.length > 0 ? `
                                <div>
                                    <span class="text-[#90bbcb] text-sm">PTR Records:</span>
                                    <div class="mt-1 space-y-1">
                                        ${data.dns.ptr.map(ptr => `<div class="text-white text-sm font-mono">${ptr}</div>`).join('')}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Security Info -->
                        ${data.security ? `
                        <div class="bg-[#101e23] rounded-lg p-4">
                            <h4 class="text-[#90bbcb] text-sm font-semibold mb-3">Security Analysis</h4>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Risk Score:</span>
                                    <span class="text-white text-sm">${data.security.risk_score}/100</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Reputation:</span>
                                    <span class="text-white text-sm capitalize">${data.security.reputation}</span>
                                </div>
                                <div class="space-y-1">
                                    ${this.createSecurityBadge('VPN', data.security.is_vpn)}
                                    ${this.createSecurityBadge('Proxy', data.security.is_proxy)}
                                    ${this.createSecurityBadge('Tor', data.security.is_tor)}
                                    ${this.createSecurityBadge('Threat', data.security.is_threat)}
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;

            this.ipResults.innerHTML = html;
            this.ipResults.style.display = 'block';
        }

        displayDNSResults(data) {
            if (!this.dnsResults) return;

            // Ensure records is an array
            const records = data.records || [];

            const html = `
                <div class="bg-[#223f49] rounded-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-white text-lg font-semibold">DNS Lookup Results</h3>
                        <div class="flex gap-2 items-center">
                            <span class="text-[#90bbcb] text-sm">Query time: ${data.query_time_ms || 0}ms</span>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <div class="flex justify-between items-center">
                            <span class="text-[#90bbcb] text-sm">Domain:</span>
                            <span class="text-white text-sm font-mono">${data.domain || 'Unknown'}</span>
                        </div>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[#90bbcb] text-sm">Records found:</span>
                            <span class="text-white text-sm">${records.length}</span>
                        </div>
                    </div>

                    ${records.length === 0 ? `
                    <div class="text-center py-8">
                        <div class="text-[#90bbcb] text-sm">No records found for this domain and record type.</div>
                    </div>
                    ` : `
                    <div class="overflow-x-auto">
                        <table class="w-full">
                                                        <thead>
                                <tr class="border-b border-[#315968]">
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">Type</th>
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">Value</th>
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">TTL</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${records.map((record, index) => `
                                    <tr class="border-b border-[#315968] hover:bg-[#101e23] transition-colors">
                                        <td class="text-white text-sm py-3 font-mono">${record.type || 'Unknown'}</td>
                                        <td class="text-white text-sm py-3 font-mono break-all">${record.value || 'Unknown'}</td>
                                        <td class="text-white text-sm py-3">${record.ttl || 0}s</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    `}
                </div>
            `;

            this.dnsResults.innerHTML = html;
            this.dnsResults.style.display = 'block';

            // Add to history
            this.addToHistory('DNS Lookup', {
                type: 'dns',
                domain: data.domain,
                record_type: this.recordTypeSelect ? this.recordTypeSelect.value : 'ALL',
                records_found: data.records.length,
                timestamp: new Date().toISOString()
            });
        }


        async performTraceroute() {
            const target = this.tracerouteInput ? this.tracerouteInput.value.trim() : '';
            
            if (!target) {
                this.showError('traceroute', 'Please enter a target (IP or domain)');
                return;
            }

            this.showLoading('traceroute');
            this.clearError('traceroute');

            try {
                const response = await fetch(`/api/ip/traceroute/${encodeURIComponent(target)}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                this.displayTracerouteResults(data);
                
                // Add to history
                this.addToHistory('Traceroute', {
                    type: 'traceroute',
                    target: target,
                    total_hops: data.total_hops,
                    total_time: data.total_time_ms,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('Error performing traceroute:', error);
                this.showError('traceroute', `Traceroute failed: ${error.message}`);
            } finally {
                this.hideLoading('traceroute');
            }
        }

        async analyzePerformance() {
            const target = this.performanceInput ? this.performanceInput.value.trim() : '';
            
            if (!target) {
                this.showError('performance', 'Please enter a target (IP or domain)');
                return;
            }

            this.showLoading('performance');
            this.clearError('performance');

            try {
                const response = await fetch(`/api/ip/performance/${encodeURIComponent(target)}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                this.displayPerformanceResults(data);
                
                // Add to history
                this.addToHistory('Performance Analysis', {
                    type: 'performance',
                    target: target,
                    ping_avg: data.ping_avg_ms,
                    packet_loss: data.packet_loss_percent,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('Error analyzing performance:', error);
                this.showError('performance', `Performance analysis failed: ${error.message}`);
            } finally {
                this.hideLoading('performance');
            }
        }

        async performBulkAnalysis() {
            const input = this.bulkInput ? this.bulkInput.value.trim() : '';
            
            if (!input) {
                this.showError('bulk', 'Please enter IP addresses (one per line)');
                return;
            }

            const ips = input.split('\n')
                .map(ip => ip.trim())
                .filter(ip => ip.length > 0);

            if (ips.length === 0) {
                this.showError('bulk', 'No valid IP addresses found');
                return;
            }

            if (ips.length > 100) {
                this.showError('bulk', 'Maximum 100 IP addresses allowed');
                return;
            }

            this.showLoading('bulk');
            this.clearError('bulk');

            try {
                const response = await fetch('/api/ip/batch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ips: ips,
                        options: {
                            include_geolocation: true,
                            include_security: true,
                            include_dns: true,
                            include_performance: false
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                this.displayBulkResults(data);
                
                // Add to history
                this.addToHistory('Bulk Analysis', {
                    type: 'bulk',
                    total_ips: data.summary.total,
                    successful: data.summary.successful,
                    failed: data.summary.failed,
                    duration: data.summary.duration_ms,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('Error performing bulk analysis:', error);
                this.showError('bulk', `Bulk analysis failed: ${error.message}`);
            } finally {
                this.hideLoading('bulk');
            }
        }

        displayTracerouteResults(data) {
            if (!this.tracerouteResults) return;

            const html = `
                <div class="bg-[#223f49] rounded-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-white text-lg font-semibold">Traceroute Results</h3>
                        <div class="flex gap-2 items-center">
                            <span class="text-[#90bbcb] text-sm">Total time: ${data.total_time_ms.toFixed(1)}ms</span>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <div class="flex justify-between items-center">
                            <span class="text-[#90bbcb] text-sm">Target:</span>
                            <span class="text-white text-sm font-mono">${data.target}</span>
                        </div>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[#90bbcb] text-sm">Total hops:</span>
                            <span class="text-white text-sm">${data.total_hops}</span>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b border-[#315968]">
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">Hop</th>
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">IP Address</th>
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">Hostname</th>
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">RTT</th>
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.hops.map(hop => `
                                    <tr class="border-b border-[#315968] hover:bg-[#101e23] transition-colors">
                                        <td class="text-white text-sm py-3">${hop.hop_number}</td>
                                        <td class="text-white text-sm py-3 font-mono">${hop.ip}</td>
                                        <td class="text-white text-sm py-3">${hop.hostname || '-'}</td>
                                        <td class="text-white text-sm py-3">${hop.rtt_ms.toFixed(1)}ms</td>
                                        <td class="text-white text-sm py-3">${hop.location ? `${hop.location.city}, ${hop.location.country}` : '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            this.tracerouteResults.innerHTML = html;
            this.tracerouteResults.style.display = 'block';
        }

        displayPerformanceResults(data) {
            if (!this.performanceResults) return;

            const html = `
                <div class="bg-[#223f49] rounded-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-white text-lg font-semibold">Performance Analysis Results</h3>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div class="bg-[#101e23] rounded-lg p-4">
                            <h4 class="text-[#90bbcb] text-sm font-semibold mb-3">Ping Statistics</h4>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Min:</span>
                                    <span class="text-white text-sm">${data.ping_min_ms.toFixed(1)}ms</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Avg:</span>
                                    <span class="text-white text-sm">${data.ping_avg_ms.toFixed(1)}ms</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Max:</span>
                                    <span class="text-white text-sm">${data.ping_max_ms.toFixed(1)}ms</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Std Dev:</span>
                                    <span class="text-white text-sm">${data.ping_stddev_ms.toFixed(1)}ms</span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-[#101e23] rounded-lg p-4">
                            <h4 class="text-[#90bbcb] text-sm font-semibold mb-3">Network Quality</h4>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Jitter:</span>
                                    <span class="text-white text-sm">${data.jitter_ms.toFixed(1)}ms</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">Packet Loss:</span>
                                    <span class="text-white text-sm">${data.packet_loss_percent.toFixed(1)}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#90bbcb] text-sm">DNS Resolution:</span>
                                    <span class="text-white text-sm">${data.dns_resolution_ms > 0 ? data.dns_resolution_ms.toFixed(1) + 'ms' : 'Failed'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-[#101e23] rounded-lg p-4">
                            <h4 class="text-[#90bbcb] text-sm font-semibold mb-3">Quality Rating</h4>
                            <div class="space-y-2">
                                ${this.getQualityRating(data)}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.performanceResults.innerHTML = html;
            this.performanceResults.style.display = 'block';
        }

        displayBulkResults(data) {
            if (!this.bulkResults) return;

            const html = `
                <div class="bg-[#223f49] rounded-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-white text-lg font-semibold">Bulk Analysis Results</h3>
                        <div class="flex gap-2 items-center">
                            <span class="text-[#90bbcb] text-sm">Duration: ${data.summary.duration_ms.toFixed(0)}ms</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="bg-[#101e23] rounded-lg p-4">
                            <div class="text-[#90bbcb] text-xs font-semibold mb-1">Total IPs</div>
                            <div class="text-white text-2xl font-bold">${data.summary.total}</div>
                        </div>
                        <div class="bg-[#101e23] rounded-lg p-4">
                            <div class="text-[#90bbcb] text-xs font-semibold mb-1">Successful</div>
                            <div class="text-green-400 text-2xl font-bold">${data.summary.successful}</div>
                        </div>
                        <div class="bg-[#101e23] rounded-lg p-4">
                            <div class="text-[#90bbcb] text-xs font-semibold mb-1">Failed</div>
                            <div class="text-red-400 text-2xl font-bold">${data.summary.failed}</div>
                        </div>
                    </div>

                    <div class="overflow-x-auto max-h-96 overflow-y-auto">
                        <table class="w-full">
                                                        <thead class="sticky top-0 bg-[#223f49]">
                                <tr class="border-b border-[#315968]">
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">IP Address</th>
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">Country</th>
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">ISP</th>
                                    <th class="text-left text-[#90bbcb] text-sm font-semibold py-2">Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.results.map(result => `
                                    <tr class="border-b border-[#315968] hover:bg-[#101e23] transition-colors">
                                        <td class="text-white text-sm py-3 font-mono">${result.ip}</td>
                                        <td class="text-white text-sm py-3">${result.geolocation?.country || '-'}</td>
                                        <td class="text-white text-sm py-3">${result.isp?.provider || '-'}</td>
                                        <td class="text-white text-sm py-3 capitalize">${result.type}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            this.bulkResults.innerHTML = html;
            this.bulkResults.style.display = 'block';
        }

        getQualityRating(data) {
            let rating = 'Excellent';
            let color = 'text-green-400';
            
            if (data.ping_avg_ms > 100 || data.jitter_ms > 10 || data.packet_loss_percent > 1) {
                rating = 'Poor';
                color = 'text-red-400';
            } else if (data.ping_avg_ms > 50 || data.jitter_ms > 5) {
                rating = 'Fair';
                color = 'text-yellow-400';
            } else if (data.ping_avg_ms > 20 || data.jitter_ms > 2) {
                rating = 'Good';
                color = 'text-blue-400';
            }
            
            return `<div class="text-center ${color} text-lg font-semibold">${rating}</div>`;
        }

        addToHistory(operation, details) {
            const historyItem = {
                id: Date.now(),
                operation: operation,
                details: details,
                timestamp: new Date().toISOString()
            };

            this.analysisHistory.unshift(historyItem);
            
            // Limit history size
            if (this.analysisHistory.length > this.maxHistorySize) {
                this.analysisHistory = this.analysisHistory.slice(0, this.maxHistorySize);
            }

            this.saveHistoryToStorage();
            this.updateHistoryDisplay();
        }

        updateHistoryDisplay() {
            if (!this.historyList) return;

            if (this.analysisHistory.length === 0) {
                this.historyList.innerHTML = '<div class="text-[#90bbcb] text-sm py-4 text-center">No analysis history yet</div>';
                return;
            }

            const html = this.analysisHistory.map(item => `
                <div class="bg-[#101e23] rounded-lg p-3 mb-2">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="text-white text-sm font-semibold">${item.operation}</div>
                            <div class="text-[#90bbcb] text-xs">${new Date(item.timestamp).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="text-[#90bbcb] text-xs mt-1">
                        ${this.formatHistoryDetails(item.details)}
                    </div>
                </div>
            `).join('');

            this.historyList.innerHTML = html;
        }

        formatHistoryDetails(details) {
            switch (details.type) {
                case 'ip':
                    return `IP: ${details.ip} | Country: ${details.country || 'Unknown'}`;
                case 'dns':
                    return `Domain: ${details.domain} | Type: ${details.record_type} | Records: ${details.records_found}`;
                case 'traceroute':
                    return `Target: ${details.target} | Hops: ${details.total_hops} | Time: ${details.total_time.toFixed(1)}ms`;
                case 'performance':
                    return `Target: ${details.target} | Avg Ping: ${details.ping_avg.toFixed(1)}ms | Loss: ${details.packet_loss}%`;
                case 'bulk':
                    return `IPs: ${details.total_ips} | Success: ${details.successful} | Failed: ${details.failed}`;
                default:
                    return 'Analysis completed';
            }
        }

        loadHistoryFromStorage() {
            try {
                const stored = localStorage.getItem('ip-dns-analysis-history');
                if (stored) {
                    this.analysisHistory = JSON.parse(stored);
                    this.updateHistoryDisplay();
                }
            } catch (error) {
                console.warn('Failed to load history from storage:', error);
                this.analysisHistory = [];
            }
        }

        saveHistoryToStorage() {
            try {
                localStorage.setItem('ip-dns-analysis-history', JSON.stringify(this.analysisHistory));
            } catch (error) {
                console.warn('Failed to save history to storage:', error);
            }
        }

        createSecurityBadge(label, value) {
            const color = value ? 'bg-red-600' : 'bg-green-600';
            const text = value ? 'Yes' : 'No';
            return `
                <div class="flex justify-between items-center">
                    <span class="text-[#90bbcb] text-xs">${label}:</span>
                    <span class="px-2 py-1 rounded text-xs font-semibold ${color} text-white">${text}</span>
                </div>
            `;
        }

        updateElement(element, value) {
            if (element && value !== undefined && value !== null) {
                element.textContent = value;
            }
        }

        detectIPVersion(ip) {
            // Simple IPv4/IPv6 detection
            if (ip.includes(':')) {
                return 'IPv6';
            } else if (ip.includes('.')) {
                return 'IPv4';
            }
            return 'Unknown';
        }

        isValidIP(ip) {
            // Simple IP validation
            const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
            
            return ipv4Regex.test(ip) || ipv6Regex.test(ip);
        }

        showLoading(type) {
            const loadingElement = type === 'ip' ? this.ipLoading : 
                                   type === 'dns' ? this.dnsLoading :
                                   type === 'traceroute' ? this.tracerouteLoading :
                                   type === 'performance' ? this.performanceLoading :
                                   type === 'bulk' ? this.bulkLoading : null;
            if (loadingElement) {
                loadingElement.style.display = 'block';
            }
        }

        hideLoading(type) {
            const loadingElement = type === 'ip' ? this.ipLoading : 
                                   type === 'dns' ? this.dnsLoading :
                                   type === 'traceroute' ? this.tracerouteLoading :
                                   type === 'performance' ? this.performanceLoading :
                                   type === 'bulk' ? this.bulkLoading : null;
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }

        showError(type, message) {
            const errorElement = type === 'ip' ? this.ipError : 
                                 type === 'dns' ? this.dnsError :
                                 type === 'traceroute' ? this.tracerouteError :
                                 type === 'performance' ? this.performanceError :
                                 type === 'bulk' ? this.bulkError : null;
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }

        clearError(type) {
            const errorElement = type === 'ip' ? this.ipError : 
                                 type === 'dns' ? this.dnsError :
                                 type === 'traceroute' ? this.tracerouteError :
                                 type === 'performance' ? this.performanceError :
                                 type === 'bulk' ? this.bulkError : null;
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }

    // Store the class globally to prevent redeclaration
    window.IPDNSAnalyzer = IPDNSAnalyzer;

    // Function to initialize the analyzer
    window.initIPDNSAnalyzer = function() {
        // Clear any existing instance
        if (window.ipDnsAnalyzerInstance) {
            window.ipDnsAnalyzerInstance = null;
        }
        
        // Only initialize if the IP DNS container exists
        if (document.querySelector('.ip-dns-container')) {
            window.ipDnsAnalyzerInstance = new IPDNSAnalyzer();
        }
    };
})();