package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type ProjectServiceClient struct {
	baseURL    string
	httpClient *http.Client
}

type Project struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	UserID         string   `json:"user_id"`
	GroupID        *string  `json:"group_id,omitempty"`
	GithubToken    *string  `json:"github_token,omitempty"`
	GithubRepo     *string  `json:"github_repo,omitempty"`
	GithubURL      *string  `json:"github_url,omitempty"`
	KeystoreID     *string  `json:"keystore_id,omitempty"`
	FlutterVersion *string  `json:"flutter_version,omitempty"`
	GradleVersion  *string  `json:"gradle_version,omitempty"`
	Platform       string   `json:"platform"`
	FolderID       *string  `json:"folder_id,omitempty"`
	EnvVars        []EnvVar `json:"env_vars,omitempty"`
}

type EnvVar struct {
	ID       string  `json:"id"`
	Key      string  `json:"key"`
	Category string  `json:"category"`
	Type     string  `json:"type"`
	Value    *string `json:"value,omitempty"`
	FileURL  *string `json:"file_url,omitempty"`
}

func NewProjectServiceClient(baseURL string) *ProjectServiceClient {
	return &ProjectServiceClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *ProjectServiceClient) GetProject(projectID string, authToken string) (*Project, error) {
	url := fmt.Sprintf("%s/api/projects/%s", c.baseURL, projectID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+authToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get project: %s", string(body))
	}

	var project Project
	if err := json.NewDecoder(resp.Body).Decode(&project); err != nil {
		return nil, err
	}

	return &project, nil
}
