-- CreateEnum
CREATE TYPE "HeroMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "CardMediaType" AS ENUM ('IMAGE', 'GIF');

-- AlterTable
ALTER TABLE "services"
ADD COLUMN "hero_media_type" "HeroMediaType",
ADD COLUMN "hero_media_url" TEXT,
ADD COLUMN "hero_media_alt_text" TEXT,
ADD COLUMN "hero_poster_url" TEXT,
ADD COLUMN "card_media_type" "CardMediaType",
ADD COLUMN "card_media_url" TEXT,
ADD COLUMN "card_media_alt_text" TEXT,
ADD COLUMN "is_decorative" BOOLEAN;
