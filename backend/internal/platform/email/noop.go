package email

import "context"

type NoopMailer struct{}

func NewNoopMailer() *NoopMailer {
	return &NoopMailer{}
}

func (m *NoopMailer) SendInvite(context.Context, InviteMessage) error {
	return nil
}
