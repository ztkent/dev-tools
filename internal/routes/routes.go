package routes

import (
	"fmt"
	"html/template"
	"net/http"
	"os"

	"github.com/google/uuid"
)

// StaticFileHandler serves static files from the web/static directory
func StaticFileHandler() http.HandlerFunc {
	fileServer := http.StripPrefix("/static/", http.FileServer(http.Dir("./web/static/")))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fileServer.ServeHTTP(w, r)
	})
}

// TagVistorsMiddleware tags visitors with a unique ID stored in a cookie
func TagVistorsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		VisitorCookieName := "devtools_visitor"
		cookie, err := r.Cookie(VisitorCookieName)
		var visitorID string
		if err != nil || cookie.Value == "" {
			visitorID = uuid.New().String()
		} else {
			visitorID = cookie.Value
		}

		secure := true
		if os.Getenv("ENV") == "dev" {
			secure = false
		}

		cookieToSet := &http.Cookie{
			Name:     VisitorCookieName,
			Value:    visitorID,
			Path:     "/",
			MaxAge:   24 * 60 * 60,
			HttpOnly: true,
			Secure:   secure,
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, cookieToSet)
		next.ServeHTTP(w, r)
	})
}

// HomePageHandler serves the main index.html page with base template
func HomePageHandler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tmpl, err := template.New("base.html").Funcs(GetTemplateFuncMap()).ParseFiles(
			"web/static/templates/base.html",
			"web/static/templates/index.html",
			"web/static/templates/breadcrumbs.html",
		)
		if err != nil {
			http.Error(w, "Error parsing templates", http.StatusInternalServerError)
			return
		}

		data := struct {
			Title       string
			Breadcrumbs []Breadcrumb
		}{
			Title:       getToolTitle("index"),
			Breadcrumbs: []Breadcrumb{{Name: "Home", URL: "/"}},
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := tmpl.Execute(w, data); err != nil {
			http.Error(w, fmt.Sprintf("Error executing template: %v", err), http.StatusInternalServerError)
			return
		}
	})
}

// ToolPageHandler creates a handler for rendering tool pages
func ToolPageHandler(toolName string) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Determine the correct tool path based on the tool name
		toolPath := "web/static/templates/tools/" + toolName + ".html"
		if toolName == "index" {
			toolPath = "web/static/templates/index.html"
		}

		tmpl, err := template.New("base.html").Funcs(GetTemplateFuncMap()).ParseFiles(
			"web/static/templates/base.html",
			toolPath,
			"web/static/templates/breadcrumbs.html",
		)
		if err != nil {
			http.Error(w, "Tool not found", http.StatusNotFound)
			return
		}

		data := struct {
			Title       string
			Breadcrumbs []Breadcrumb
		}{
			Title:       getToolTitle(toolName),
			Breadcrumbs: getToolBreadcrumbs(toolName),
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := tmpl.Execute(w, data); err != nil {
			http.Error(w, fmt.Sprintf("Error executing template: %v", err), http.StatusInternalServerError)
			return
		}
	})
}

// ToolContentHandler creates a handler for HTMX requests that returns just the content
func ToolContentHandler(toolName string) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Determine the correct tool path based on the tool name
		toolPath := "web/static/templates/tools/" + toolName + ".html"
		if toolName == "index" {
			toolPath = "web/static/templates/index.html"
		}

		tmpl, err := template.New(toolName+".html").Funcs(GetTemplateFuncMap()).ParseFiles(
			toolPath,
			"web/static/templates/breadcrumbs.html",
		)
		if err != nil {
			http.Error(w, "Tool not found", http.StatusNotFound)
			return
		}

		data := struct {
			Title       string
			Breadcrumbs []Breadcrumb
		}{
			Title:       getToolTitle(toolName),
			Breadcrumbs: getToolBreadcrumbs(toolName),
		}

		// Set the title in a custom header for HTMX to use
		w.Header().Set("HX-Title", getToolTitle(toolName))
		w.Header().Set("Content-Type", "text/html; charset=utf-8")

		// Return content for main target
		if err := tmpl.ExecuteTemplate(w, "content", data); err != nil {
			http.Error(w, "Error executing content template", http.StatusInternalServerError)
			return
		}

		// Return breadcrumbs with out-of-band swap
		w.Write([]byte(`<div id="breadcrumb-container" hx-swap-oob="true">`))
		if err := tmpl.ExecuteTemplate(w, "breadcrumbs", data); err != nil {
			http.Error(w, "Error executing breadcrumbs template", http.StatusInternalServerError)
			return
		}
		w.Write([]byte(`</div>`))
	})
}
