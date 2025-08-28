package routes

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/ztkent/dev-tools/internal/services"
)

// IPAPIHandler handles IP analysis API endpoints
type IPAPIHandler struct {
	ipService *services.IPAnalysisService
}

// NewIPAPIHandler creates a new IP API handler
func NewIPAPIHandler() *IPAPIHandler {
	return &IPAPIHandler{
		ipService: services.NewIPAnalysisService(),
	}
}

// GetCurrentIP returns the client's current IP address with basic analysis
func (h *IPAPIHandler) GetCurrentIP(w http.ResponseWriter, r *http.Request) {
	// Get client IP
	clientIP := h.ipService.GetClientIP(r)

	// Perform analysis
	analysis, err := h.ipService.AnalyzeIP(r.Context(), clientIP)
	if err != nil {
		log.Printf("Error analyzing IP %s: %v", clientIP, err)
		http.Error(w, "Failed to analyze IP", http.StatusInternalServerError)
		return
	}

	// Return JSON response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(analysis); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// AnalyzeIP analyzes a specific IP address
func (h *IPAPIHandler) AnalyzeIP(w http.ResponseWriter, r *http.Request) {
	ip := chi.URLParam(r, "ip")
	if ip == "" {
		http.Error(w, "IP address required", http.StatusBadRequest)
		return
	}

	// Validate IP format
	if parsedIP := net.ParseIP(ip); parsedIP == nil {
		http.Error(w, "Invalid IP address format", http.StatusBadRequest)
		return
	}

	// Perform analysis
	analysis, err := h.ipService.AnalyzeIP(r.Context(), ip)
	if err != nil {
		log.Printf("Error analyzing IP %s: %v", ip, err)
		http.Error(w, "Failed to analyze IP", http.StatusInternalServerError)
		return
	}

	// Return JSON response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(analysis); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// LookupDNS performs DNS record lookup
func (h *IPAPIHandler) LookupDNS(w http.ResponseWriter, r *http.Request) {
	// Parse request body for POST or query params for GET
	var domain, recordType string

	if r.Method == http.MethodPost {
		var req struct {
			Domain string `json:"domain"`
			Type   string `json:"type"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON request", http.StatusBadRequest)
			return
		}

		domain = req.Domain
		recordType = req.Type
	} else {
		domain = r.URL.Query().Get("domain")
		recordType = r.URL.Query().Get("type")
	}

	if domain == "" {
		http.Error(w, "Domain required", http.StatusBadRequest)
		return
	}

	if recordType == "" {
		recordType = "A" // Default to A record
	}

	// Perform DNS lookup
	result, err := h.ipService.LookupDNS(r.Context(), domain, strings.ToUpper(recordType))
	if err != nil {
		log.Printf("Error looking up DNS for %s (%s): %v", domain, recordType, err)
		http.Error(w, fmt.Sprintf("DNS lookup failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Return JSON response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// BatchAnalyzeIPs handles bulk IP analysis
func (h *IPAPIHandler) BatchAnalyzeIPs(w http.ResponseWriter, r *http.Request) {
	var request services.BulkAnalysisRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(request.IPs) == 0 {
		http.Error(w, "No IPs provided", http.StatusBadRequest)
		return
	}

	if len(request.IPs) > 100 {
		http.Error(w, "Too many IPs (maximum 100)", http.StatusBadRequest)
		return
	}

	result, err := h.ipService.BulkAnalyzeIPs(r.Context(), &request)
	if err != nil {
		log.Printf("Error in bulk analysis: %v", err)
		http.Error(w, "Bulk analysis failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("Error encoding bulk analysis response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// PerformTraceroute handles traceroute requests
func (h *IPAPIHandler) PerformTraceroute(w http.ResponseWriter, r *http.Request) {
	target := chi.URLParam(r, "target")
	if target == "" {
		http.Error(w, "Target parameter is required", http.StatusBadRequest)
		return
	}

	result, err := h.ipService.PerformTraceroute(r.Context(), target)
	if err != nil {
		log.Printf("Error performing traceroute to %s: %v", target, err)
		http.Error(w, "Traceroute failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("Error encoding traceroute response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// AnalyzePerformance handles performance analysis requests
func (h *IPAPIHandler) AnalyzePerformance(w http.ResponseWriter, r *http.Request) {
	target := chi.URLParam(r, "target")
	if target == "" {
		http.Error(w, "Target parameter is required", http.StatusBadRequest)
		return
	}

	result, err := h.ipService.AnalyzePerformance(r.Context(), target)
	if err != nil {
		log.Printf("Error analyzing performance for %s: %v", target, err)
		http.Error(w, "Performance analysis failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("Error encoding performance response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// RegisterIPAPIRoutes registers all IP API routes
func RegisterIPAPIRoutes(r chi.Router, cache interface{}) {
	handler := NewIPAPIHandler()

	r.Route("/ip", func(r chi.Router) {
		// Current IP analysis
		r.Get("/current", handler.GetCurrentIP)

		// Specific IP analysis
		r.Get("/analyze/{ip}", handler.AnalyzeIP)

		// Batch IP analysis
		r.Post("/batch", handler.BatchAnalyzeIPs)

		r.Get("/traceroute/{target}", handler.PerformTraceroute)
		r.Get("/performance/{target}", handler.AnalyzePerformance)
	})

	r.Route("/dns", func(r chi.Router) {
		// DNS lookup - supports both GET and POST
		r.Get("/lookup", handler.LookupDNS)
		r.Post("/lookup", handler.LookupDNS)
	})
}
