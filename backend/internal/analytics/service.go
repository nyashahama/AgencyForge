package analytics

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/nyashahama/AgencyForge/backend/db/gen"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/authctx"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/database"
)

const (
	defaultDays          = 7
	maxDays              = 90
	defaultActivityLimit = 8
	maxActivityLimit     = 50
)

type Service struct {
	queries *dbgen.Queries
}

func NewService(db *database.Pool) *Service {
	var queries *dbgen.Queries
	if db != nil {
		queries = dbgen.New(db)
	}

	return &Service{queries: queries}
}

func (s *Service) Dashboard(ctx context.Context, principal authctx.Principal, days int, activityLimit int) (*Dashboard, error) {
	if s.queries == nil {
		return nil, errors.New("analytics service is not configured with a database")
	}

	days = normalizeDays(days)
	activityLimit = normalizeActivityLimit(activityLimit)

	overviewRow, err := s.queries.GetAnalyticsOverview(ctx, principal.AgencyID)
	if err != nil {
		return nil, fmt.Errorf("get analytics overview: %w", err)
	}

	throughput, err := s.loadThroughput(ctx, principal, days)
	if err != nil {
		return nil, err
	}

	specialists, err := s.ListSpecialists(ctx, principal)
	if err != nil {
		return nil, err
	}

	recentActivity, err := s.loadRecentActivity(ctx, principal, activityLimit)
	if err != nil {
		return nil, err
	}

	statuses, err := s.loadCampaignStatuses(ctx, principal)
	if err != nil {
		return nil, err
	}

	weeklyOutput := 0
	for _, point := range throughput {
		weeklyOutput += point.Campaigns
	}

	return &Dashboard{
		Overview: Overview{
			LiveCampaigns:        int(overviewRow.LiveCampaigns),
			ReviewsDue:           int(overviewRow.ReviewsDue),
			BriefsProcessed:      int(overviewRow.BriefsProcessed),
			ActiveClients:        int(overviewRow.ActiveClients),
			ActiveSpecialists:    int(overviewRow.ActiveSpecialists),
			PendingApprovals:     int(overviewRow.PendingApprovals),
			WeeklyOutput:         weeklyOutput,
			AvgCompletionPercent: int(overviewRow.AvgCompletionPercent),
			ApprovalRate:         overviewRow.ApprovalRate,
			ApprovalLatencyDays:  overviewRow.ApprovalLatencyDays,
			AvgTurnaroundDays:    overviewRow.AvgTurnaroundDays,
		},
		Throughput:       throughput,
		Specialists:      specialists,
		RecentActivity:   recentActivity,
		CampaignStatuses: statuses,
	}, nil
}

func (s *Service) ListThroughput(ctx context.Context, principal authctx.Principal, days int) ([]ThroughputPoint, error) {
	if s.queries == nil {
		return nil, errors.New("analytics service is not configured with a database")
	}

	return s.loadThroughput(ctx, principal, normalizeDays(days))
}

func (s *Service) ListSpecialists(ctx context.Context, principal authctx.Principal) ([]SpecialistLoad, error) {
	if s.queries == nil {
		return nil, errors.New("analytics service is not configured with a database")
	}

	rows, err := s.queries.ListSpecialistUtilizationByAgency(ctx, principal.AgencyID)
	if err != nil {
		return nil, fmt.Errorf("list specialist utilization: %w", err)
	}

	items := make([]SpecialistLoad, 0, len(rows))
	for _, row := range rows {
		items = append(items, SpecialistLoad{
			ID:                 row.ID.String(),
			Name:               row.Name,
			Code:               row.Code,
			SpecialtyType:      row.SpecialtyType,
			Status:             specialistStatus(row.BlockedAssignmentCount, row.LoadUnits),
			Color:              specialistColor(row.Code),
			Load:               int(row.LoadUnits),
			OpenAssignments:    int(row.OpenAssignmentCount),
			BlockedAssignments: int(row.BlockedAssignmentCount),
			ActiveCampaigns:    int(row.ActiveCampaignCount),
		})
	}

	return items, nil
}

func (s *Service) loadThroughput(ctx context.Context, principal authctx.Principal, days int) ([]ThroughputPoint, error) {
	windowStart, windowEnd := timeWindow(days)

	rows, err := s.queries.ListAnalyticsThroughputByDay(ctx, dbgen.ListAnalyticsThroughputByDayParams{
		AgencyID: principal.AgencyID,
		StartAt:  windowStart,
		EndAt:    windowEnd,
	})
	if err != nil {
		return nil, fmt.Errorf("list throughput: %w", err)
	}

	points := make([]ThroughputPoint, 0, len(rows))
	for _, row := range rows {
		points = append(points, ThroughputPoint{
			Day:       row.DayBucket,
			DayLabel:  row.DayLabel,
			Campaigns: int(row.Campaigns),
		})
	}

	return points, nil
}

func (s *Service) loadRecentActivity(ctx context.Context, principal authctx.Principal, limit int) ([]ActivityItem, error) {
	rows, err := s.queries.ListActivityEventsByAgency(ctx, dbgen.ListActivityEventsByAgencyParams{
		AgencyID: principal.AgencyID,
		Limit:    int32(limit),
	})
	if err != nil {
		return nil, fmt.Errorf("list recent activity: %w", err)
	}

	items := make([]ActivityItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, ActivityItem{
			ID:         row.ID.String(),
			EventType:  row.EventType,
			Message:    row.Message,
			Icon:       iconForEvent(row.EventType),
			TimeLabel:  formatTimeLabel(row.OccurredAt),
			Metadata:   decodeMetadata(row.Metadata),
			OccurredAt: row.OccurredAt,
		})
	}

	return items, nil
}

func (s *Service) loadCampaignStatuses(ctx context.Context, principal authctx.Principal) ([]CampaignStatusCount, error) {
	rows, err := s.queries.ListCampaignStatusCountsByAgency(ctx, principal.AgencyID)
	if err != nil {
		return nil, fmt.Errorf("list campaign statuses: %w", err)
	}

	items := make([]CampaignStatusCount, 0, len(rows))
	for _, row := range rows {
		items = append(items, CampaignStatusCount{
			Status: row.Status,
			Count:  int(row.CampaignCount),
		})
	}

	return items, nil
}

func normalizeDays(days int) int {
	if days <= 0 {
		return defaultDays
	}
	if days > maxDays {
		return maxDays
	}
	return days
}

func normalizeActivityLimit(limit int) int {
	if limit <= 0 {
		return defaultActivityLimit
	}
	if limit > maxActivityLimit {
		return maxActivityLimit
	}
	return limit
}

func timeWindow(days int) (time.Time, time.Time) {
	now := time.Now().UTC()
	end := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	start := end.AddDate(0, 0, -(days - 1))
	return start, end
}

func specialistStatus(blockedAssignments int64, loadUnits int64) string {
	switch {
	case blockedAssignments > 0:
		return "attention"
	case loadUnits > 0:
		return "active"
	default:
		return "idle"
	}
}

func specialistColor(code string) string {
	switch strings.ToLower(code) {
	case "copy":
		return "amber"
	case "design":
		return "cyan"
	case "media":
		return "lime"
	case "legal":
		return "rose"
	case "budget":
		return "blue"
	case "portal":
		return "stone"
	default:
		return "slate"
	}
}

func decodeMetadata(raw []byte) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}

	var metadata map[string]any
	if err := json.Unmarshal(raw, &metadata); err != nil {
		return map[string]any{}
	}
	if metadata == nil {
		return map[string]any{}
	}
	return metadata
}

func formatTimeLabel(occurredAt time.Time) string {
	delta := time.Since(occurredAt)
	switch {
	case delta < time.Minute:
		return "just now"
	case delta < time.Hour:
		return fmt.Sprintf("%dm ago", int(delta.Minutes()))
	case delta < 24*time.Hour:
		return fmt.Sprintf("%dh ago", int(delta.Hours()))
	case delta < 7*24*time.Hour:
		return fmt.Sprintf("%dd ago", int(delta.Hours()/24))
	default:
		return occurredAt.Format("02 Jan 2006")
	}
}

func iconForEvent(eventType string) string {
	switch {
	case strings.Contains(eventType, "approved"):
		return "OK"
	case strings.Contains(eventType, "created"), strings.Contains(eventType, "uploaded"):
		return "+"
	case strings.Contains(eventType, "updated"):
		return "*"
	case strings.Contains(eventType, "published"):
		return ">>"
	default:
		return "[]"
	}
}
