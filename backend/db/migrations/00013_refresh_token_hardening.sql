-- +goose Up
DELETE FROM refresh_tokens;

-- +goose Down
SELECT 1;
