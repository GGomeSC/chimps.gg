package chimps

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	chimpsapi "github.com/GGomeSC/chimps.gg/backend/generated/api"
	"github.com/jackc/pgx/v5"
)

const communityCacheTTL = time.Hour

func (s *server) ResolveOwnPlayer(w http.ResponseWriter, r *http.Request) {
	if s.nk == nil {
		writeError(w, http.StatusServiceUnavailable, "upstream_unavailable", "Ninja Kiwi is unavailable.")
		return
	}
	var input chimpsapi.ResolveOwnPlayerJSONRequestBody
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096))
	if err := decoder.Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_oak", "Invalid OAK.")
		return
	}
	userID, err := s.nk.resolveOAK(r.Context(), input.Oak)
	input.Oak = "" // release the credential before any further work
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid_oak", "The OAK could not be verified.")
		return
	}
	if _, err := s.fetchAndStorePlayer(r.Context(), userID); err != nil {
		writeError(w, http.StatusBadGateway, "player_unavailable", "The player profile is unavailable.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"userId": userID})
}

func (s *server) ResolvePlayer(w http.ResponseWriter, r *http.Request) {
	if s.nk == nil {
		writeError(w, http.StatusServiceUnavailable, "upstream_unavailable", "Ninja Kiwi is unavailable.")
		return
	}
	var input chimpsapi.ResolvePlayerJSONRequestBody
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 2048)).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_player", "Enter a valid profile URL or user ID.")
		return
	}
	userID := parsePlayerIdentifier(input.Identifier)
	if userID == "" {
		writeError(w, http.StatusBadRequest, "invalid_player", "Enter a valid profile URL or user ID.")
		return
	}
	player, err := s.fetchAndStorePlayer(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "player_not_found", "Player not found.")
		return
	}
	writeJSON(w, http.StatusOK, player)
}

func (s *server) SearchPublicPlayers(w http.ResponseWriter, r *http.Request, params chimpsapi.SearchPublicPlayersParams) {
	q := strings.TrimSpace(params.Q)
	if q == "" {
		writeJSON(w, http.StatusOK, map[string]any{"players": []chimpsapi.PublicPlayer{}})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), publicQueryTimeout)
	defer cancel()
	pattern := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(q)
	rows, err := s.postgres.pool.Query(ctx, `
		select user_id, display_name, rank, veteran_rank, achievements, most_experienced_monkey,
		       highest_round, avatar_url, banner_url, followers, bloons_popped, game_count, games_won, last_synced_at
		from public.nk_players
		where lower(display_name) like lower($2) || '%' escape '\'
		order by (lower(display_name) = lower($1)) desc, display_name, user_id
		limit 12`, q, pattern)
	if err != nil {
		s.databaseFailure(w, "search_players", err)
		return
	}
	defer rows.Close()
	players := []chimpsapi.PublicPlayer{}
	for rows.Next() {
		player, err := scanPlayer(rows)
		if err != nil {
			s.databaseFailure(w, "scan_players", err)
			return
		}
		players = append(players, player)
	}
	writeJSON(w, http.StatusOK, map[string]any{"players": players})
}

func (s *server) GetPublicPlayer(w http.ResponseWriter, r *http.Request, userID string) {
	ctx, cancel := context.WithTimeout(r.Context(), publicQueryTimeout)
	defer cancel()
	player, err := s.loadPlayer(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "player_not_found", "Player not found.")
		return
	}
	if err != nil {
		s.databaseFailure(w, "get_player", err)
		return
	}
	writeJSON(w, http.StatusOK, player)
}

func (s *server) GetPublicCommunityMap(w http.ResponseWriter, r *http.Request, mapCode string) {
	if s.nk == nil {
		writeError(w, http.StatusServiceUnavailable, "upstream_unavailable", "Ninja Kiwi is unavailable.")
		return
	}
	code := strings.ToUpper(strings.TrimSpace(mapCode))
	if !mapCodePattern.MatchString(code) {
		writeError(w, http.StatusBadRequest, "invalid_map_code", "Enter a valid map share code.")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()
	lastSync, err := s.communityMapLastSync(ctx, code)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && time.Since(lastSync) > communityCacheTTL) {
		if refreshErr := s.refreshCommunityMap(ctx, code); refreshErr != nil && errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "map_not_found", "Community map not found.")
			return
		}
	} else if err != nil {
		s.databaseFailure(w, "get_map_cache", err)
		return
	}
	result, err := s.loadCommunityMap(ctx, code)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "map_not_found", "Community map not found.")
		return
	}
	if err != nil {
		s.databaseFailure(w, "get_community_map", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *server) SyncCommunityMaps(w http.ResponseWriter, r *http.Request) {
	if s.nk == nil {
		writeError(w, http.StatusServiceUnavailable, "upstream_unavailable", "Ninja Kiwi is unavailable.")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Minute)
	defer cancel()
	version, source, observed, err := s.nk.liveVersion(ctx)
	if err != nil {
		writeError(w, http.StatusBadGateway, "version_unavailable", "Live game version could not be verified.")
		return
	}
	last, err := s.latestSnapshotVersion(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		s.databaseFailure(w, "latest_snapshot_version", err)
		return
	}
	if last != "" && compareVersions(version, last) < 0 {
		writeError(w, http.StatusConflict, "version_regression", "Live game version regressed; no snapshots were written.")
		return
	}
	rows, err := s.postgres.pool.Query(ctx, `select map_code from public.community_maps order by map_code`)
	if err != nil {
		s.databaseFailure(w, "list_cached_maps", err)
		return
	}
	codes := []string{}
	for rows.Next() {
		var code string
		if rows.Scan(&code) == nil {
			codes = append(codes, code)
		}
	}
	rows.Close()
	maps := make([]nkCommunityMap, 0, len(codes))
	for _, code := range codes {
		item, fetchErr := s.nk.mapData(ctx, code)
		if fetchErr != nil {
			writeError(w, http.StatusBadGateway, "map_refresh_failed", "A tracked map could not be refreshed; no snapshots were written.")
			return
		}
		maps = append(maps, item)
	}
	tx, err := s.postgres.pool.Begin(ctx)
	if err != nil {
		s.databaseFailure(w, "begin_snapshot_sync", err)
		return
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `insert into public.nk_version_observations (game_version, source_url, observed_at) values ($1,$2,$3)`, version, source, observed); err != nil {
		s.databaseFailure(w, "record_version_observation", err)
		return
	}
	for _, item := range maps {
		if err := upsertMap(ctx, tx, item, userIDFromURL(item.Creator)); err != nil {
			s.databaseFailure(w, "refresh_snapshot_map", err)
			return
		}
		_, err = tx.Exec(ctx, `insert into public.community_map_snapshots
			(map_code, snapshot_date, captured_at, game_version, version_source_url, version_observed_at, plays, wins, losses, plays_unique, wins_unique, losses_unique)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			on conflict (map_code, snapshot_date) do nothing`, item.ID, observed.Format("2006-01-02"), observed, version, source, observed, item.Plays, item.Wins, item.Losses, item.PlaysUnique, item.WinsUnique, item.LossesUnique)
		if err != nil {
			s.databaseFailure(w, "insert_map_snapshot", err)
			return
		}
	}
	if err := tx.Commit(ctx); err != nil {
		s.databaseFailure(w, "commit_snapshot_sync", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"version": version, "maps": len(maps)})
}

type rowScanner interface{ Scan(...any) error }

func scanPlayer(row rowScanner) (chimpsapi.PublicPlayer, error) {
	var p chimpsapi.PublicPlayer
	err := row.Scan(&p.UserId, &p.DisplayName, &p.Rank, &p.VeteranRank, &p.Achievements, &p.MostExperiencedMonkey, &p.HighestRound, &p.AvatarUrl, &p.BannerUrl, &p.Followers, &p.BloonsPopped, &p.GameCount, &p.GamesWon, &p.LastSyncedAt)
	return p, err
}

func (s *server) loadPlayer(ctx context.Context, id string) (chimpsapi.PublicPlayer, error) {
	return scanPlayer(s.postgres.pool.QueryRow(ctx, `select user_id, display_name, rank, veteran_rank, achievements, most_experienced_monkey, highest_round, avatar_url, banner_url, followers, bloons_popped, game_count, games_won, last_synced_at from public.nk_players where user_id=$1`, id))
}

func (s *server) fetchAndStorePlayer(ctx context.Context, id string) (chimpsapi.PublicPlayer, error) {
	player, raw, err := s.nk.player(ctx, id)
	if err != nil {
		return chimpsapi.PublicPlayer{}, err
	}
	highest := player.Gameplay.HighestRound
	if highest == 0 {
		highest = player.HighestRound
	}
	_, err = s.postgres.pool.Exec(ctx, `insert into public.nk_players
		(user_id, display_name, rank, veteran_rank, achievements, most_experienced_monkey, highest_round, avatar_url, banner_url, followers, bloons_popped, game_count, games_won, profile_data, last_synced_at)
		values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now())
		on conflict (user_id) do update set display_name=excluded.display_name, rank=excluded.rank, veteran_rank=excluded.veteran_rank, achievements=excluded.achievements, most_experienced_monkey=excluded.most_experienced_monkey, highest_round=excluded.highest_round, avatar_url=excluded.avatar_url, banner_url=excluded.banner_url, followers=excluded.followers, bloons_popped=excluded.bloons_popped, game_count=excluded.game_count, games_won=excluded.games_won, profile_data=excluded.profile_data, last_synced_at=now()`, id, player.DisplayName, player.Rank, player.VeteranRank, player.Achievements, player.MostExperiencedMonkey, highest, player.AvatarURL, player.BannerURL, player.Followers, player.BloonsPopped.BloonsPopped, player.Gameplay.GameCount, player.Gameplay.GamesWon, raw)
	if err != nil {
		return chimpsapi.PublicPlayer{}, err
	}
	return s.loadPlayer(ctx, id)
}

func parsePlayerIdentifier(input string) string {
	input = strings.TrimSpace(input)
	if input == "" {
		return ""
	}
	if parsed, err := url.Parse(input); err == nil && parsed.Scheme == "https" && parsed.Host == "data.ninjakiwi.com" {
		return userIDFromURL(&input)
	}
	if strings.ContainsAny(input, "/?# ") || len(input) > 128 {
		return ""
	}
	return input
}

func (s *server) communityMapLastSync(ctx context.Context, code string) (time.Time, error) {
	var value time.Time
	err := s.postgres.pool.QueryRow(ctx, `select last_synced_at from public.community_maps where map_code=$1`, code).Scan(&value)
	return value, err
}

func (s *server) refreshCommunityMap(ctx context.Context, code string) error {
	item, err := s.nk.mapData(ctx, code)
	if err != nil {
		return err
	}
	creator := userIDFromURL(item.Creator)
	if creator != "" {
		_, _ = s.fetchAndStorePlayer(ctx, creator)
	}
	_, err = s.postgres.pool.Exec(ctx, `insert into public.community_maps
		(map_code,name,creator_user_id,created_at,creation_version,map_url,plays,wins,losses,plays_unique,wins_unique,losses_unique,last_synced_at)
		values ($1,$2,$3,to_timestamp($4::double precision/1000),$5,$6,$7,$8,$9,$10,$11,$12,now())
		on conflict (map_code) do update set name=excluded.name, creator_user_id=coalesce(excluded.creator_user_id,community_maps.creator_user_id), creation_version=excluded.creation_version, map_url=excluded.map_url, plays=excluded.plays, wins=excluded.wins, losses=excluded.losses, plays_unique=excluded.plays_unique, wins_unique=excluded.wins_unique, losses_unique=excluded.losses_unique, last_synced_at=now()`, item.ID, item.Name, nullString(creator), item.CreatedAt, item.GameVersion, item.MapURL, item.Plays, item.Wins, item.Losses, item.PlaysUnique, item.WinsUnique, item.LossesUnique)
	return err
}

func upsertMap(ctx context.Context, tx pgx.Tx, item nkCommunityMap, creator string) error {
	_, err := tx.Exec(ctx, `update public.community_maps set name=$2, creator_user_id=coalesce($3,creator_user_id), creation_version=$4, map_url=$5, plays=$6,wins=$7,losses=$8,plays_unique=$9,wins_unique=$10,losses_unique=$11,last_synced_at=now() where map_code=$1`, item.ID, item.Name, nullString(creator), item.GameVersion, item.MapURL, item.Plays, item.Wins, item.Losses, item.PlaysUnique, item.WinsUnique, item.LossesUnique)
	return err
}
func nullString(value string) any {
	if value == "" {
		return nil
	}
	return value
}

type snapshot struct {
	version  string
	captured time.Time
	counters chimpsapi.CommunityMapCounters
}

func (s *server) loadCommunityMap(ctx context.Context, code string) (chimpsapi.PublicCommunityMap, error) {
	var result chimpsapi.PublicCommunityMap
	var creatorID *string
	err := s.postgres.pool.QueryRow(ctx, `select map_code,name,creator_user_id,created_at,creation_version,map_url,plays,wins,losses,plays_unique,wins_unique,losses_unique,first_observed_at,last_synced_at from public.community_maps where map_code=$1`, code).Scan(&result.MapCode, &result.Name, &creatorID, &result.CreatedAt, &result.CreationVersion, &result.MapUrl, &result.Counters.Plays, &result.Counters.Wins, &result.Counters.Losses, &result.Counters.PlaysUnique, &result.Counters.WinsUnique, &result.Counters.LossesUnique, &result.FirstObservedAt, &result.LastSyncedAt)
	if err != nil {
		return result, err
	}
	if creatorID != nil {
		if player, loadErr := s.loadPlayer(ctx, *creatorID); loadErr == nil {
			result.Creator = &player
		}
	}
	result.WinRate = decisiveWinRate(result.Counters.Wins, result.Counters.Losses)
	rows, err := s.postgres.pool.Query(ctx, `select game_version,captured_at,plays,wins,losses,plays_unique,wins_unique,losses_unique from public.community_map_snapshots where map_code=$1 order by captured_at`, code)
	if err != nil {
		return result, err
	}
	defer rows.Close()
	snaps := []snapshot{}
	for rows.Next() {
		var x snapshot
		if err := rows.Scan(&x.version, &x.captured, &x.counters.Plays, &x.counters.Wins, &x.counters.Losses, &x.counters.PlaysUnique, &x.counters.WinsUnique, &x.counters.LossesUnique); err != nil {
			return result, err
		}
		snaps = append(snaps, x)
	}
	result.Trends, result.Transitions = deriveTrends(snaps)
	return result, nil
}

func decisiveWinRate(wins, losses int64) *float64 {
	decisive := wins + losses
	if decisive == 0 {
		return nil
	}
	rate := float64(wins) / float64(decisive)
	return &rate
}

func deriveTrends(items []snapshot) ([]chimpsapi.CommunityMapVersionTrend, []chimpsapi.CommunityMapTransition) {
	trends := map[string]*chimpsapi.CommunityMapVersionTrend{}
	transitions := []chimpsapi.CommunityMapTransition{}
	if len(items) > 0 {
		trends[items[0].version] = &chimpsapi.CommunityMapVersionTrend{Version: items[0].version, SinceTrackingBegan: true}
	}
	for i := 1; i < len(items); i++ {
		a, b := items[i-1], items[i]
		if a.version != b.version {
			transitions = append(transitions, chimpsapi.CommunityMapTransition{FromVersion: a.version, ToVersion: b.version, CapturedAt: b.captured})
			if trends[b.version] == nil {
				trends[b.version] = &chimpsapi.CommunityMapVersionTrend{Version: b.version}
			}
			continue
		}
		t := trends[b.version]
		if t == nil {
			t = &chimpsapi.CommunityMapVersionTrend{Version: b.version}
			trends[b.version] = t
		}
		add := func(target *int64, next, prev int64) {
			if next >= prev {
				*target += next - prev
			}
		}
		add(&t.Plays, b.counters.Plays, a.counters.Plays)
		add(&t.Wins, b.counters.Wins, a.counters.Wins)
		add(&t.Losses, b.counters.Losses, a.counters.Losses)
		add(&t.PlaysUnique, b.counters.PlaysUnique, a.counters.PlaysUnique)
		add(&t.WinsUnique, b.counters.WinsUnique, a.counters.WinsUnique)
		add(&t.LossesUnique, b.counters.LossesUnique, a.counters.LossesUnique)
	}
	result := make([]chimpsapi.CommunityMapVersionTrend, 0, len(trends))
	for _, t := range trends {
		result = append(result, *t)
	}
	sort.Slice(result, func(i, j int) bool { return compareVersions(result[i].Version, result[j].Version) > 0 })
	return result, transitions
}

func (s *server) latestSnapshotVersion(ctx context.Context) (string, error) {
	var value string
	err := s.postgres.pool.QueryRow(ctx, `select game_version from public.nk_version_observations order by observed_at desc limit 1`).Scan(&value)
	return value, err
}
func compareVersions(a, b string) int {
	aa, bb := strings.Split(a, "."), strings.Split(b, ".")
	n := len(aa)
	if len(bb) > n {
		n = len(bb)
	}
	for i := 0; i < n; i++ {
		av, bv := 0, 0
		if i < len(aa) {
			av, _ = strconv.Atoi(aa[i])
		}
		if i < len(bb) {
			bv, _ = strconv.Atoi(bb[i])
		}
		if av < bv {
			return -1
		}
		if av > bv {
			return 1
		}
	}
	return 0
}
