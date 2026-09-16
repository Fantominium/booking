-- Extend card media to support uploaded videos reused on reservation pages.
ALTER TYPE "CardMediaType" ADD VALUE IF NOT EXISTS 'VIDEO';
