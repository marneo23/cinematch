-- Drop old singular columns and add array columns
ALTER TABLE "Room" DROP COLUMN IF EXISTS "referenceMovieId";
ALTER TABLE "Room" DROP COLUMN IF EXISTS "referenceMovieTitle";
ALTER TABLE "Room" ADD COLUMN "referenceMovieIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Room" ADD COLUMN "referenceMovieTitles" TEXT[] NOT NULL DEFAULT '{}';
