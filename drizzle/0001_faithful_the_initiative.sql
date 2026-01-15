ALTER TABLE "canvasTokens" ALTER COLUMN "canvasServer" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "canvasTokens" ALTER COLUMN "canvasToken" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "canvasTokens" ADD COLUMN "encryptedCanvasServer" text;--> statement-breakpoint
ALTER TABLE "canvasTokens" ADD COLUMN "encryptedCanvasToken" text;