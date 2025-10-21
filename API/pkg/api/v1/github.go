package v1

import (
	"bytes"
	"fmt"
	"io"
	"net/http"

	"github.com/google/go-github/v76/github"
)

type GithubController struct {
	webhookSecretKey []byte
}

func NewGithubController(secret []byte) *GithubController {
	return &GithubController{webhookSecretKey: secret}
}

func (c *GithubController) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	fmt.Printf("Raw payload: %s\n", string(body))
	r.Body = io.NopCloser(bytes.NewBuffer(body)) // remettre le body pour ValidatePayload

	payload, err := github.ValidatePayload(r, c.webhookSecretKey)
	if err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		fmt.Println("invalid payload")
		return
	}

	event, err := github.ParseWebHook(github.WebHookType(r), payload)
	if err != nil {
		http.Error(w, "cannot parse webhook", http.StatusBadRequest)
		fmt.Println("cannot parse webhook")
		return
	}

	switch e := event.(type) {
	case *github.InstallationEvent:
		installationID := e.GetInstallation().GetID()
		accountLogin := e.GetInstallation().GetAccount().GetLogin()

		switch e.GetAction() {
		case "created":
			fmt.Printf("Installation: ID=%d, Account=%s, Action=%s\n", installationID, accountLogin, e.GetAction())
		default:
			fmt.Printf("Default: ID=%d, Account=%s, Action=%s\n", installationID, accountLogin, e.GetAction())
		}
	}
}
