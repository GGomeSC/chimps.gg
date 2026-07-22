package chimps

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"
)

const nkMinimumInterval = 200 * time.Millisecond

var (
	mapCodePattern = regexp.MustCompile(`^[A-Z0-9]{6,12}$`)
	versionPattern = regexp.MustCompile(`^[0-9]+(?:\.[0-9]+)+$`)
)

type ninjaKiwiClient struct {
	root        string
	http        *http.Client
	mu          sync.Mutex
	lastRequest time.Time
}

type nkEnvelope[T any] struct {
	Success bool    `json:"success"`
	Error   *string `json:"error"`
	Body    T       `json:"body"`
}

type nkPlayer struct {
	DisplayName           string  `json:"displayName"`
	Rank                  int     `json:"rank"`
	VeteranRank           int     `json:"veteranRank"`
	Achievements          int     `json:"achievements"`
	MostExperiencedMonkey string  `json:"mostExperiencedMonkey"`
	HighestRound          int     `json:"highestRound"`
	AvatarURL             *string `json:"avatarURL"`
	BannerURL             *string `json:"bannerURL"`
	Followers             int64   `json:"followers"`
	BloonsPopped          struct {
		BloonsPopped int64 `json:"bloonsPopped"`
	} `json:"bloonsPopped"`
	Gameplay struct {
		GameCount    int64 `json:"gameCount"`
		GamesWon     int64 `json:"gamesWon"`
		HighestRound int   `json:"highestRound"`
	} `json:"gameplay"`
}

type nkCommunityMap struct {
	Name         string  `json:"name"`
	CreatedAt    int64   `json:"createdAt"`
	ID           string  `json:"id"`
	Creator      *string `json:"creator"`
	GameVersion  string  `json:"gameVersion"`
	MapURL       string  `json:"mapURL"`
	Plays        int64   `json:"plays"`
	Wins         int64   `json:"wins"`
	Losses       int64   `json:"losses"`
	PlaysUnique  int64   `json:"playsUnique"`
	WinsUnique   int64   `json:"winsUnique"`
	LossesUnique int64   `json:"lossesUnique"`
}

type nkChallengeItem struct {
	Metadata string `json:"metadata"`
}
type nkChallengeMetadata struct {
	GameVersion string `json:"gameVersion"`
}

func newNinjaKiwiClient(root string) *ninjaKiwiClient {
	return &ninjaKiwiClient{root: root, http: &http.Client{Timeout: 12 * time.Second}}
}

func (c *ninjaKiwiClient) get(ctx context.Context, target string, output any) error {
	c.mu.Lock()
	wait := nkMinimumInterval - time.Since(c.lastRequest)
	if wait > 0 {
		timer := time.NewTimer(wait)
		select {
		case <-ctx.Done():
			timer.Stop()
			c.mu.Unlock()
			return ctx.Err()
		case <-timer.C:
		}
	}
	c.lastRequest = time.Now()
	c.mu.Unlock()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target, nil)
	if err != nil {
		return errors.New("invalid upstream request")
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "chimps.gg/0.1 (community stats; low-volume requests)")
	res, err := c.http.Do(req)
	if err != nil {
		return errors.New("Ninja Kiwi is unavailable")
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("Ninja Kiwi returned status %d", res.StatusCode)
	}
	if err := json.NewDecoder(res.Body).Decode(output); err != nil {
		return errors.New("invalid Ninja Kiwi response")
	}
	return nil
}

func (c *ninjaKiwiClient) player(ctx context.Context, userID string) (nkPlayer, json.RawMessage, error) {
	var envelope nkEnvelope[json.RawMessage]
	err := c.get(ctx, c.root+"/btd6/users/"+url.PathEscape(userID), &envelope)
	if err != nil || !envelope.Success {
		return nkPlayer{}, nil, errors.New("player unavailable")
	}
	var player nkPlayer
	if err := json.Unmarshal(envelope.Body, &player); err != nil || strings.TrimSpace(player.DisplayName) == "" {
		return nkPlayer{}, nil, errors.New("invalid player response")
	}
	return player, envelope.Body, nil
}

func (c *ninjaKiwiClient) mapData(ctx context.Context, code string) (nkCommunityMap, error) {
	code = strings.ToUpper(strings.TrimSpace(code))
	if !mapCodePattern.MatchString(code) {
		return nkCommunityMap{}, errors.New("invalid map code")
	}
	var envelope nkEnvelope[nkCommunityMap]
	if err := c.get(ctx, c.root+"/btd6/maps/map/"+code, &envelope); err != nil || !envelope.Success {
		return nkCommunityMap{}, errors.New("map unavailable")
	}
	if envelope.Body.ID != code || !versionPattern.MatchString(envelope.Body.GameVersion) {
		return nkCommunityMap{}, errors.New("invalid map response")
	}
	return envelope.Body, nil
}

func (c *ninjaKiwiClient) liveVersion(ctx context.Context) (string, string, time.Time, error) {
	observed := time.Now().UTC()
	listURL := c.root + "/btd6/challenges/filter/newest?page=1"
	var list nkEnvelope[[]nkChallengeItem]
	if err := c.get(ctx, listURL, &list); err != nil || !list.Success || len(list.Body) == 0 {
		return "", "", observed, errors.New("live version unavailable")
	}
	source := list.Body[0].Metadata
	parsed, err := url.Parse(source)
	if err != nil || parsed.Scheme != "https" || parsed.Host != mustHost(c.root) {
		return "", "", observed, errors.New("invalid version source")
	}
	var metadata nkEnvelope[nkChallengeMetadata]
	if err := c.get(ctx, source, &metadata); err != nil || !metadata.Success || !versionPattern.MatchString(metadata.Body.GameVersion) {
		return "", "", observed, errors.New("invalid live version")
	}
	return metadata.Body.GameVersion, source, observed, nil
}

func mustHost(raw string) string { parsed, _ := url.Parse(raw); return parsed.Host }

func userIDFromURL(raw *string) string {
	if raw == nil {
		return ""
	}
	parsed, err := url.Parse(*raw)
	if err != nil {
		return ""
	}
	parts := strings.Split(strings.Trim(parsed.Path, "/"), "/")
	if len(parts) == 3 && parts[0] == "btd6" && parts[1] == "users" {
		return parts[2]
	}
	return ""
}

func extractUserID(value any) string {
	switch typed := value.(type) {
	case map[string]any:
		for _, key := range []string{"userID", "userId", "playerID", "playerId"} {
			if candidate, ok := typed[key].(string); ok && strings.TrimSpace(candidate) != "" {
				return candidate
			}
		}
		for _, nested := range typed {
			if candidate := extractUserID(nested); candidate != "" {
				return candidate
			}
		}
	case []any:
		for _, nested := range typed {
			if candidate := extractUserID(nested); candidate != "" {
				return candidate
			}
		}
	}
	return ""
}

func (c *ninjaKiwiClient) resolveOAK(ctx context.Context, oak string) (string, error) {
	oak = strings.TrimSpace(oak)
	if len(oak) < 8 || len(oak) > 2048 || strings.ContainsAny(oak, "/?#") {
		return "", errors.New("invalid OAK")
	}
	var envelope nkEnvelope[any]
	// The OAK is confined to this request URL and is never returned or logged.
	if err := c.get(ctx, c.root+"/btd6/save/"+url.PathEscape(oak), &envelope); err != nil || !envelope.Success {
		return "", errors.New("OAK could not be verified")
	}
	userID := extractUserID(envelope.Body)
	if userID == "" {
		return "", errors.New("OAK response did not identify a player")
	}
	return userID, nil
}
