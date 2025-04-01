CREATE TABLE "canvasTokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consumerId" uuid NOT NULL,
	"canvasServer" text NOT NULL,
	"canvasToken" text NOT NULL,
	CONSTRAINT "canvasTokens_consumerId_unique" UNIQUE("consumerId")
);
--> statement-breakpoint
CREATE TABLE "consumers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consumerId" uuid NOT NULL,
	"setting" json NOT NULL,
	CONSTRAINT "settings_consumerId_unique" UNIQUE("consumerId")
);
--> statement-breakpoint
CREATE TABLE "trmnlAuthorizationTokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trmnlAuthorizationTokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "trmnlData" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consumerId" uuid NOT NULL,
	"trmnlId" uuid NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"settingsId" integer NOT NULL,
	CONSTRAINT "trmnlData_consumerId_unique" UNIQUE("consumerId"),
	CONSTRAINT "trmnlData_trmnlId_unique" UNIQUE("trmnlId")
);
--> statement-breakpoint
ALTER TABLE "canvasTokens" ADD CONSTRAINT "canvasTokens_consumerId_consumers_id_fk" FOREIGN KEY ("consumerId") REFERENCES "public"."consumers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_consumerId_consumers_id_fk" FOREIGN KEY ("consumerId") REFERENCES "public"."consumers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trmnlData" ADD CONSTRAINT "trmnlData_consumerId_consumers_id_fk" FOREIGN KEY ("consumerId") REFERENCES "public"."consumers"("id") ON DELETE cascade ON UPDATE no action;