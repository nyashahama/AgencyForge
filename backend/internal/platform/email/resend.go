package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

type InviteMessage struct {
	To        string
	Role      string
	AcceptURL string
}

type Mailer interface {
	SendInvite(context.Context, InviteMessage) error
}

type ResendMailer struct {
	apiKey     string
	from       string
	httpClient *http.Client
}

func NewResendMailer(apiKey string, from string, httpClient *http.Client) *ResendMailer {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}

	return &ResendMailer{
		apiKey:     apiKey,
		from:       from,
		httpClient: httpClient,
	}
}

func (m *ResendMailer) SendInvite(ctx context.Context, invite InviteMessage) error {
	payload := map[string]any{
		"from":    m.from,
		"to":      []string{invite.To},
		"subject": "You're invited to AgencyForge",
		"html": fmt.Sprintf(
			"<p>You have been invited to AgencyForge as <strong>%s</strong>.</p><p><a href=\"%s\">Accept your invite</a></p>",
			invite.Role,
			invite.AcceptURL,
		),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal resend payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create resend request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("send resend request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("resend returned status %d", resp.StatusCode)
	}

	return nil
}
