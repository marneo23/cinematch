-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "genreIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "referenceMovieId" TEXT,
ADD COLUMN     "referenceMovieTitle" TEXT;
