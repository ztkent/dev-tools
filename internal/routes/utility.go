package routes

import "html/template"

type Breadcrumb struct {
	Name string
	URL  string
}

// GetTemplateFuncMap returns the standard template function map used across all handlers
func GetTemplateFuncMap() template.FuncMap {
	return template.FuncMap{
		"title": getToolTitle,
		"sub": func(a, b int) int {
			return a - b
		},
	}
}

func getToolTitle(toolName string) string {
	titles := map[string]string{
		"index":          "Dev Tools",
		"unix-time":      "Unix Time Converter - Dev Tools",
		"json-validator": "JSON Validator - Dev Tools",
		"ip":             "IP Check - Dev Tools",
		"css-linter":     "CSS Linter - Dev Tools",
	}

	if title, exists := titles[toolName]; exists {
		return title
	}
	return "Dev Tools"
}

func getToolBreadcrumbs(toolName string) []Breadcrumb {
	breadcrumbs := []Breadcrumb{
		{Name: "Home", URL: "/"},
	}

	toolNames := map[string]string{
		"unix-time":      "Unix Time Converter",
		"json-validator": "JSON Validator",
		"ip":             "IP Check",
		"css-linter":     "CSS Linter",
	}

	if name, exists := toolNames[toolName]; exists {
		breadcrumbs = append(breadcrumbs, Breadcrumb{
			Name: name,
			URL:  "/" + toolName,
		})
	}

	return breadcrumbs
}
