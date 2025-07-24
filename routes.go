package main

import (
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
			MaxAge:   24 * 60 * 60, // 24 hours
			HttpOnly: true,
			Secure:   secure,
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, cookieToSet)
		next.ServeHTTP(w, r)
	})
}

// HomePageHandler serves the main index.html page
func HomePageHandler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/static/templates/index.html")
	})
}
