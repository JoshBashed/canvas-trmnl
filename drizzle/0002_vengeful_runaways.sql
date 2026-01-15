ALTER TABLE "canvasTokens" ALTER COLUMN "encryptedCanvasServer" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "canvasTokens" ALTER COLUMN "encryptedCanvasToken" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "canvasTokens" DROP COLUMN "canvasServer";--> statement-breakpoint
ALTER TABLE "canvasTokens" DROP COLUMN "canvasToken";