package handlers

import (
	"net/http"

	"github.com/sa-nafi/vipr-web/backend/internal/utils"
)

// HealthCheck handles the GET /health endpoint
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	utils.WriteJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}
