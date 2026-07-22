package chimps

import (
	"testing"
	"time"

	chimpsapi "github.com/GGomeSC/chimps.gg/backend/generated/api"
)

func TestCompareVersionsUsesNumericComponents(t *testing.T) {
	t.Parallel()
	cases := []struct {
		left, right string
		want        int
	}{
		{"55.2", "55.2", 0},
		{"55.10", "55.2", 1},
		{"54.9", "55.0", -1},
		{"55.2.1", "55.2", 1},
	}
	for _, test := range cases {
		if got := compareVersions(test.left, test.right); got != test.want {
			t.Fatalf("compareVersions(%q,%q)=%d, want %d", test.left, test.right, got, test.want)
		}
	}
}

func TestDecisiveWinRateDoesNotUsePlays(t *testing.T) {
	t.Parallel()
	rate := decisiveWinRate(113434, 26476)
	if rate == nil || *rate < 0.810 || *rate > 0.811 {
		t.Fatalf("decisiveWinRate=%v, want about 81.1%%", rate)
	}
	if got := decisiveWinRate(0, 0); got != nil {
		t.Fatalf("zero outcomes returned %v, want nil", *got)
	}
}

func TestDeriveTrendsExcludesTransitionsAndNegativeCounters(t *testing.T) {
	t.Parallel()
	when := time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)
	items := []snapshot{
		{version: "54.0", captured: when, counters: counters(100, 60, 20, 90, 55, 18)},
		{version: "54.0", captured: when.AddDate(0, 0, 1), counters: counters(110, 68, 22, 98, 62, 20)},
		{version: "55.0", captured: when.AddDate(0, 0, 2), counters: counters(120, 75, 25, 106, 68, 23)},
		{version: "55.0", captured: when.AddDate(0, 0, 3), counters: counters(5, 3, 1, 4, 3, 1)}, // correction/reset
	}
	trends, transitions := deriveTrends(items)
	if len(transitions) != 1 || transitions[0].FromVersion != "54.0" || transitions[0].ToVersion != "55.0" {
		t.Fatalf("unexpected transitions: %#v", transitions)
	}
	if len(trends) != 2 {
		t.Fatalf("got %d trends, want 2", len(trends))
	}
	var old, current chimpsapi.CommunityMapVersionTrend
	for _, trend := range trends {
		if trend.Version == "54.0" {
			old = trend
		} else if trend.Version == "55.0" {
			current = trend
		}
	}
	if !old.SinceTrackingBegan || old.Plays != 10 || old.Wins != 8 || old.Losses != 2 {
		t.Fatalf("unexpected first trend: %#v", old)
	}
	if current.SinceTrackingBegan || current.Plays != 0 || current.Wins != 0 || current.Losses != 0 {
		t.Fatalf("transition/reset was attributed: %#v", current)
	}
}

func counters(plays, wins, losses, playsUnique, winsUnique, lossesUnique int64) chimpsapi.CommunityMapCounters {
	return chimpsapi.CommunityMapCounters{Plays: plays, Wins: wins, Losses: losses, PlaysUnique: playsUnique, WinsUnique: winsUnique, LossesUnique: lossesUnique}
}
