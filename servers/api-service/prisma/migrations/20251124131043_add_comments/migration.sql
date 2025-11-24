-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "drawingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "elementId" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_drawingId_idx" ON "comments"("drawingId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "drawings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
