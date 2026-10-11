CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_type` text NOT NULL,
	`original_filename` text NOT NULL,
	`content_hash` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text NOT NULL,
	`point_count` integer NOT NULL,
	`no_fix_count` integer NOT NULL,
	`skipped_count` integer NOT NULL,
	`distance_m` real NOT NULL,
	`max_speed_kmh` real,
	`bbox` text NOT NULL,
	`uploaded_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "tracks_activity_type_check" CHECK("tracks"."activity_type" IN ('motorcycle', 'bicycle'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracks_content_hash_unique` ON `tracks` (`content_hash`);--> statement-breakpoint
CREATE INDEX `tracks_started_at_idx` ON `tracks` (`started_at`);