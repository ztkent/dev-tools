package services

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net"
	"net/http"
	"strings"
	"time"
)

// IPAnalysisService provides IP and DNS analysis functionality
type IPAnalysisService struct {
	httpClient *http.Client
}

// NewIPAnalysisService creates a new IP analysis service
func NewIPAnalysisService() *IPAnalysisService {
	return &IPAnalysisService{
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// IPInfo represents comprehensive IP information
type IPInfo struct {
	IP          string    `json:"ip"`
	Version     string    `json:"version"` // "IPv4" or "IPv6"
	Type        string    `json:"type"`    // "public", "private", "reserved"
	Geolocation *GeoInfo  `json:"geolocation,omitempty"`
	ISP         *ISPInfo  `json:"isp,omitempty"`
	Security    *SecInfo  `json:"security,omitempty"`
	DNS         *DNSInfo  `json:"dns,omitempty"`
	Timestamp   time.Time `json:"timestamp"`
}

// GeoInfo represents geolocation information
type GeoInfo struct {
	Country     string  `json:"country"`
	CountryCode string  `json:"country_code"`
	Region      string  `json:"region"`
	RegionCode  string  `json:"region_code"`
	City        string  `json:"city"`
	Postal      string  `json:"postal"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Timezone    string  `json:"timezone"`
}

// ISPInfo represents ISP and network information
type ISPInfo struct {
	Provider     string `json:"provider"`
	Organization string `json:"organization"`
	ASN          string `json:"asn"`
	ASNName      string `json:"asn_name"`
	Domain       string `json:"domain"`
}

// SecInfo represents security information
type SecInfo struct {
	IsProxy    bool   `json:"is_proxy"`
	IsVPN      bool   `json:"is_vpn"`
	IsTor      bool   `json:"is_tor"`
	IsThreat   bool   `json:"is_threat"`
	RiskScore  int    `json:"risk_score"` // 0-100
	Reputation string `json:"reputation"` // "good", "neutral", "bad"
}

// DNSInfo represents DNS information
type DNSInfo struct {
	Hostname string   `json:"hostname,omitempty"`
	PTR      []string `json:"ptr,omitempty"`
}

// DNSRecord represents a DNS record
type DNSRecord struct {
	Name  string `json:"name"`
	Type  string `json:"type"`
	Value string `json:"value"`
	TTL   int    `json:"ttl"`
}

// DNSLookupResult represents DNS lookup results
type DNSLookupResult struct {
	Domain    string      `json:"domain"`
	Records   []DNSRecord `json:"records"`
	Timestamp time.Time   `json:"timestamp"`
	QueryTime int         `json:"query_time_ms"`
}

// TracerouteHop represents a single hop in traceroute
type TracerouteHop struct {
	HopNumber int      `json:"hop_number"`
	IP        string   `json:"ip"`
	Hostname  string   `json:"hostname,omitempty"`
	RTT       float64  `json:"rtt_ms"`
	Location  *GeoInfo `json:"location,omitempty"`
}

// TracerouteResult represents the full traceroute analysis
type TracerouteResult struct {
	Target     string          `json:"target"`
	Hops       []TracerouteHop `json:"hops"`
	TotalHops  int             `json:"total_hops"`
	TotalTime  float64         `json:"total_time_ms"`
	PacketLoss float64         `json:"packet_loss_percent"`
	Timestamp  time.Time       `json:"timestamp"`
}

// PerformanceMetrics represents network performance data
type PerformanceMetrics struct {
	Target            string    `json:"target"`
	PingMin           float64   `json:"ping_min_ms"`
	PingMax           float64   `json:"ping_max_ms"`
	PingAvg           float64   `json:"ping_avg_ms"`
	PingStdDev        float64   `json:"ping_stddev_ms"`
	PacketLoss        float64   `json:"packet_loss_percent"`
	Jitter            float64   `json:"jitter_ms"`
	DNSResolutionTime float64   `json:"dns_resolution_ms"`
	Timestamp         time.Time `json:"timestamp"`
}

// BulkAnalysisRequest represents a request for bulk IP analysis
type BulkAnalysisRequest struct {
	IPs     []string `json:"ips"`
	Options struct {
		IncludeGeolocation bool `json:"include_geolocation"`
		IncludeSecurity    bool `json:"include_security"`
		IncludeDNS         bool `json:"include_dns"`
		IncludePerformance bool `json:"include_performance"`
	} `json:"options"`
}

// BulkAnalysisResult represents the result of bulk analysis
type BulkAnalysisResult struct {
	Results []IPInfo `json:"results"`
	Summary struct {
		Total      int     `json:"total"`
		Successful int     `json:"successful"`
		Failed     int     `json:"failed"`
		Duration   float64 `json:"duration_ms"`
	} `json:"summary"`
	Timestamp time.Time `json:"timestamp"`
}

// GetClientIP extracts the real client IP from the HTTP request
func (s *IPAnalysisService) GetClientIP(r *http.Request) string {
	// Check for IP in various headers (proxy-aware)
	headers := []string{
		"CF-Connecting-IP",    // Cloudflare
		"True-Client-IP",      // Cloudflare Enterprise
		"X-Real-IP",           // Nginx
		"X-Forwarded-For",     // Standard
		"X-Client-IP",         // Apache
		"X-Forwarded",         // General
		"X-Cluster-Client-IP", // GCP Load Balancer
		"Forwarded-For",       // RFC 7239
		"Forwarded",           // RFC 7239
	}

	for _, header := range headers {
		if ip := r.Header.Get(header); ip != "" {
			// Handle comma-separated IPs (take the first one)
			if idx := strings.Index(ip, ","); idx != -1 {
				ip = strings.TrimSpace(ip[:idx])
			}
			// Validate IP
			if parsedIP := net.ParseIP(ip); parsedIP != nil {
				return ip
			}
		}
	}

	// Fallback to remote address
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// AnalyzeIP performs comprehensive IP analysis
func (s *IPAnalysisService) AnalyzeIP(ctx context.Context, ipStr string) (*IPInfo, error) {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return nil, fmt.Errorf("invalid IP address: %s", ipStr)
	}

	info := &IPInfo{
		IP:        ipStr,
		Version:   getIPVersion(ip),
		Type:      getIPType(ip),
		Timestamp: time.Now(),
	}

	// Get geolocation info (using ipinfo.io as primary source)
	if geo, err := s.getGeolocation(ctx, ipStr); err == nil {
		info.Geolocation = geo
	}

	// Get ISP info
	if isp, err := s.getISPInfo(ctx, ipStr); err == nil {
		info.ISP = isp
	}

	// Get DNS info (reverse lookup)
	if dns, err := s.getDNSInfo(ctx, ipStr); err == nil {
		info.DNS = dns
	}

	// Basic security analysis
	info.Security = s.getSecurityInfo(ip)

	return info, nil
}

// LookupDNS performs DNS record lookup
func (s *IPAnalysisService) LookupDNS(ctx context.Context, domain string, recordType string) (*DNSLookupResult, error) {
	start := time.Now()

	result := &DNSLookupResult{
		Domain:    domain,
		Records:   []DNSRecord{},
		Timestamp: start,
	}

	// Validate domain
	if domain == "" {
		return nil, fmt.Errorf("domain cannot be empty")
	}

	var records []DNSRecord
	var err error

	switch strings.ToUpper(recordType) {
	case "A":
		records, err = s.lookupA(domain)
	case "AAAA":
		records, err = s.lookupAAAA(domain)
	case "MX":
		records, err = s.lookupMX(domain)
	case "NS":
		records, err = s.lookupNS(domain)
	case "TXT":
		records, err = s.lookupTXT(domain)
	case "CNAME":
		records, err = s.lookupCNAME(domain)
	case "PTR":
		records, err = s.lookupPTR(domain)
	case "ALL":
		records, err = s.lookupAll(domain)
	default:
		return nil, fmt.Errorf("unsupported record type: %s", recordType)
	}

	if err != nil {
		return nil, fmt.Errorf("DNS lookup failed: %w", err)
	}

	result.Records = records
	result.QueryTime = int(time.Since(start).Milliseconds())

	return result, nil
}

// getIPVersion determines if IP is IPv4 or IPv6
func getIPVersion(ip net.IP) string {
	if ip.To4() != nil {
		return "IPv4"
	}
	return "IPv6"
}

// getIPType determines the type of IP address
func getIPType(ip net.IP) string {
	if ip.IsPrivate() {
		return "private"
	}
	if ip.IsLoopback() {
		return "loopback"
	}
	if ip.IsMulticast() {
		return "multicast"
	}
	if ip.IsLinkLocalUnicast() {
		return "link-local"
	}
	return "public"
}

// getGeolocation fetches geolocation information
func (s *IPAnalysisService) getGeolocation(ctx context.Context, ip string) (*GeoInfo, error) {
	// Using ipinfo.io (free tier allows 50k requests/month)
	url := fmt.Sprintf("https://ipinfo.io/%s/json", ip)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("geolocation API returned status %d", resp.StatusCode)
	}

	var data struct {
		Country  string `json:"country"`
		Region   string `json:"region"`
		City     string `json:"city"`
		Postal   string `json:"postal"`
		Loc      string `json:"loc"` // "lat,lng"
		Timezone string `json:"timezone"`
		Org      string `json:"org"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	geo := &GeoInfo{
		Country:     data.Country,
		Region:      data.Region,
		City:        data.City,
		Postal:      data.Postal,
		Timezone:    data.Timezone,
		CountryCode: data.Country, // ipinfo.io returns 2-letter code
	}

	// Parse lat,lng
	if data.Loc != "" {
		parts := strings.Split(data.Loc, ",")
		if len(parts) == 2 {
			if lat, err := parseFloat(parts[0]); err == nil {
				geo.Latitude = lat
			}
			if lng, err := parseFloat(parts[1]); err == nil {
				geo.Longitude = lng
			}
		}
	}

	return geo, nil
}

// getISPInfo extracts ISP information from ipinfo.io response
func (s *IPAnalysisService) getISPInfo(ctx context.Context, ip string) (*ISPInfo, error) {
	url := fmt.Sprintf("https://ipinfo.io/%s/json", ip)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data struct {
		Org      string `json:"org"`
		Hostname string `json:"hostname"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	isp := &ISPInfo{}

	// Parse org field (usually "AS#### Provider Name")
	if data.Org != "" {
		parts := strings.Fields(data.Org)
		if len(parts) > 0 && strings.HasPrefix(parts[0], "AS") {
			isp.ASN = parts[0]
			if len(parts) > 1 {
				isp.Provider = strings.Join(parts[1:], " ")
				isp.ASNName = isp.Provider
			}
		} else {
			isp.Provider = data.Org
		}
	}

	if data.Hostname != "" {
		// Extract domain from hostname
		parts := strings.Split(data.Hostname, ".")
		if len(parts) >= 2 {
			isp.Domain = strings.Join(parts[len(parts)-2:], ".")
		}
	}

	return isp, nil
}

// getDNSInfo performs reverse DNS lookup
func (s *IPAnalysisService) getDNSInfo(ctx context.Context, ip string) (*DNSInfo, error) {
	names, err := net.LookupAddr(ip)
	if err != nil {
		return nil, err
	}

	dns := &DNSInfo{
		PTR: names,
	}

	if len(names) > 0 {
		dns.Hostname = names[0]
	}

	return dns, nil
}

// getSecurityInfo performs basic security analysis
func (s *IPAnalysisService) getSecurityInfo(ip net.IP) *SecInfo {
	// Basic analysis - in future phases we'll integrate with security APIs
	security := &SecInfo{
		IsProxy:    false,
		IsVPN:      false,
		IsTor:      false,
		IsThreat:   false,
		RiskScore:  0,
		Reputation: "neutral",
	}

	// Basic heuristics
	if ip.IsPrivate() {
		security.RiskScore = 10
		security.Reputation = "good"
	}

	return security
}

// DNS lookup helper functions
func (s *IPAnalysisService) lookupA(domain string) ([]DNSRecord, error) {
	ips, err := net.LookupIP(domain)
	if err != nil {
		return nil, err
	}

	var records []DNSRecord
	for _, ip := range ips {
		if ip.To4() != nil { // IPv4 only
			records = append(records, DNSRecord{
				Name:  domain,
				Type:  "A",
				Value: ip.String(),
				TTL:   300, // Default TTL
			})
		}
	}

	return records, nil
}

func (s *IPAnalysisService) lookupAAAA(domain string) ([]DNSRecord, error) {
	ips, err := net.LookupIP(domain)
	if err != nil {
		return nil, err
	}

	var records []DNSRecord
	for _, ip := range ips {
		if ip.To4() == nil { // IPv6 only
			records = append(records, DNSRecord{
				Name:  domain,
				Type:  "AAAA",
				Value: ip.String(),
				TTL:   300,
			})
		}
	}

	return records, nil
}

func (s *IPAnalysisService) lookupMX(domain string) ([]DNSRecord, error) {
	mxRecords, err := net.LookupMX(domain)
	if err != nil {
		return nil, err
	}

	var records []DNSRecord
	for _, mx := range mxRecords {
		records = append(records, DNSRecord{
			Name:  domain,
			Type:  "MX",
			Value: fmt.Sprintf("%d %s", mx.Pref, mx.Host),
			TTL:   300,
		})
	}

	return records, nil
}

func (s *IPAnalysisService) lookupNS(domain string) ([]DNSRecord, error) {
	nsRecords, err := net.LookupNS(domain)
	if err != nil {
		return nil, err
	}

	var records []DNSRecord
	for _, ns := range nsRecords {
		records = append(records, DNSRecord{
			Name:  domain,
			Type:  "NS",
			Value: ns.Host,
			TTL:   300,
		})
	}

	return records, nil
}

func (s *IPAnalysisService) lookupTXT(domain string) ([]DNSRecord, error) {
	txtRecords, err := net.LookupTXT(domain)
	if err != nil {
		return nil, err
	}

	var records []DNSRecord
	for _, txt := range txtRecords {
		records = append(records, DNSRecord{
			Name:  domain,
			Type:  "TXT",
			Value: txt,
			TTL:   300,
		})
	}

	return records, nil
}

func (s *IPAnalysisService) lookupCNAME(domain string) ([]DNSRecord, error) {
	cname, err := net.LookupCNAME(domain)
	if err != nil {
		return nil, err
	}

	return []DNSRecord{{
		Name:  domain,
		Type:  "CNAME",
		Value: cname,
		TTL:   300,
	}}, nil
}

func (s *IPAnalysisService) lookupPTR(domain string) ([]DNSRecord, error) {
	names, err := net.LookupAddr(domain)
	if err != nil {
		return nil, err
	}

	var records []DNSRecord
	for _, name := range names {
		records = append(records, DNSRecord{
			Name:  domain,
			Type:  "PTR",
			Value: name,
			TTL:   300,
		})
	}

	return records, nil
}

func (s *IPAnalysisService) lookupAll(domain string) ([]DNSRecord, error) {
	var allRecords []DNSRecord

	// Lookup all record types concurrently
	types := []string{"A", "AAAA", "MX", "NS", "TXT", "CNAME"}

	// Channel to collect results
	resultChan := make(chan []DNSRecord, len(types))

	// Launch concurrent lookups
	for _, recordType := range types {
		go func(rType string) {
			if records, err := s.LookupDNS(context.Background(), domain, rType); err == nil {
				resultChan <- records.Records
			} else {
				// Send empty slice if lookup fails
				resultChan <- []DNSRecord{}
			}
		}(recordType)
	}

	// Collect results from all goroutines
	for i := 0; i < len(types); i++ {
		records := <-resultChan
		allRecords = append(allRecords, records...)
	}

	return allRecords, nil
}

// Helper function to parse float
func parseFloat(s string) (float64, error) {
	// Simple float parsing - could use strconv.ParseFloat for production
	var f float64
	if _, err := fmt.Sscanf(s, "%f", &f); err != nil {
		return 0, err
	}
	return f, nil
}

// PerformTraceroute performs a traceroute to the target
func (s *IPAnalysisService) PerformTraceroute(ctx context.Context, target string) (*TracerouteResult, error) {
	// Simulated traceroute implementation for demonstration
	// In production, you would use actual traceroute tools or libraries

	result := &TracerouteResult{
		Target:    target,
		Hops:      []TracerouteHop{},
		Timestamp: time.Now(),
	}

	// Simulate traceroute hops (in production, use actual traceroute)
	simulatedHops := []struct {
		ip  string
		rtt float64
	}{
		{"192.168.1.1", 1.2},
		{"10.0.0.1", 5.4},
		{"203.0.113.1", 15.6},
		{"198.51.100.1", 25.8},
		{target, 35.2},
	}

	for i, hop := range simulatedHops {
		hopResult := TracerouteHop{
			HopNumber: i + 1,
			IP:        hop.ip,
			RTT:       hop.rtt,
		}

		// Try to resolve hostname
		if names, err := net.LookupAddr(hop.ip); err == nil && len(names) > 0 {
			hopResult.Hostname = names[0]
		}

		// Get geolocation for public IPs
		if !isPrivateIP(hop.ip) {
			if analysis, err := s.AnalyzeIP(ctx, hop.ip); err == nil && analysis.Geolocation != nil {
				hopResult.Location = analysis.Geolocation
			}
		}

		result.Hops = append(result.Hops, hopResult)
		result.TotalTime += hop.rtt
	}

	result.TotalHops = len(result.Hops)
	result.PacketLoss = 0.0 // Simulated - no packet loss

	return result, nil
}

// AnalyzePerformance performs network performance analysis
func (s *IPAnalysisService) AnalyzePerformance(ctx context.Context, target string) (*PerformanceMetrics, error) {
	metrics := &PerformanceMetrics{
		Target:    target,
		Timestamp: time.Now(),
	}

	// Simulate DNS resolution time
	dnsStart := time.Now()
	_, err := net.LookupHost(target)
	if err != nil {
		metrics.DNSResolutionTime = -1 // Indicate DNS failure
	} else {
		metrics.DNSResolutionTime = float64(time.Since(dnsStart).Nanoseconds()) / 1e6
	}

	// Simulate ping measurements (in production, use actual ping implementation)
	pingTimes := []float64{12.3, 11.8, 13.1, 12.9, 11.5, 14.2, 12.1, 13.4, 11.9, 12.7}

	var sum, min, max float64
	min = pingTimes[0]
	max = pingTimes[0]

	for _, ping := range pingTimes {
		sum += ping
		if ping < min {
			min = ping
		}
		if ping > max {
			max = ping
		}
	}

	metrics.PingMin = min
	metrics.PingMax = max
	metrics.PingAvg = sum / float64(len(pingTimes))

	// Calculate standard deviation
	var variance float64
	for _, ping := range pingTimes {
		variance += (ping - metrics.PingAvg) * (ping - metrics.PingAvg)
	}
	metrics.PingStdDev = math.Sqrt(variance / float64(len(pingTimes)))

	// Calculate jitter (average of absolute differences)
	var jitterSum float64
	for i := 1; i < len(pingTimes); i++ {
		jitterSum += math.Abs(pingTimes[i] - pingTimes[i-1])
	}
	metrics.Jitter = jitterSum / float64(len(pingTimes)-1)

	metrics.PacketLoss = 0.0 // Simulated - no packet loss

	return metrics, nil
}

// BulkAnalyzeIPs performs analysis on multiple IPs
func (s *IPAnalysisService) BulkAnalyzeIPs(ctx context.Context, request *BulkAnalysisRequest) (*BulkAnalysisResult, error) {
	startTime := time.Now()

	result := &BulkAnalysisResult{
		Results:   make([]IPInfo, 0, len(request.IPs)),
		Timestamp: time.Now(),
	}

	result.Summary.Total = len(request.IPs)

	// Use goroutines for concurrent analysis
	type analysisResult struct {
		info IPInfo
		err  error
	}

	resultChan := make(chan analysisResult, len(request.IPs))
	semaphore := make(chan struct{}, 10) // Limit concurrent requests

	for _, ip := range request.IPs {
		go func(targetIP string) {
			semaphore <- struct{}{}        // Acquire semaphore
			defer func() { <-semaphore }() // Release semaphore

			info, err := s.AnalyzeIP(ctx, targetIP)
			if err != nil {
				// Create minimal error info
				info = &IPInfo{
					IP:        targetIP,
					Version:   "Unknown",
					Type:      "error",
					Timestamp: time.Now(),
				}
			}

			resultChan <- analysisResult{info: *info, err: err}
		}(ip)
	}

	// Collect results
	for i := 0; i < len(request.IPs); i++ {
		res := <-resultChan
		result.Results = append(result.Results, res.info)

		if res.err == nil {
			result.Summary.Successful++
		} else {
			result.Summary.Failed++
		}
	}

	result.Summary.Duration = float64(time.Since(startTime).Nanoseconds()) / 1e6

	return result, nil
}

// isPrivateIP checks if an IP is in private ranges
func isPrivateIP(ip string) bool {
	privateRanges := []string{
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
		"127.0.0.0/8",
		"169.254.0.0/16",
		"::1/128",
		"fc00::/7",
		"fe80::/10",
	}

	for _, cidr := range privateRanges {
		_, network, err := net.ParseCIDR(cidr)
		if err != nil {
			continue
		}
		if network.Contains(net.ParseIP(ip)) {
			return true
		}
	}
	return false
}
