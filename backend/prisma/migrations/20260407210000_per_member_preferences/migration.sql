-- Move preferences from Room to RoomMember so each member has their own set.
-- The effective preferences used for movie recommendations will be the union of all members.

ALTER TABLE "RoomMember" ADD COLUMN "genreIds" INTEGER[] NOT NULL DEFAULT '{}';
ALTER TABLE "RoomMember" ADD COLUMN "referenceMovieIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "RoomMember" ADD COLUMN "referenceMovieTitles" TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE "Room" DROP COLUMN "genreIds";
ALTER TABLE "Room" DROP COLUMN "referenceMovieIds";
ALTER TABLE "Room" DROP COLUMN "referenceMovieTitles";
