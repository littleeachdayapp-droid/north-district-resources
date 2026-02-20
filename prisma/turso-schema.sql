-- CreateTable
CREATE TABLE "Church" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameEs" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT DEFAULT 'TX',
    "zip" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "pastor" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "churchId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEs" TEXT,
    "authorComposer" TEXT,
    "publisher" TEXT,
    "description" TEXT,
    "descriptionEs" TEXT,
    "subcategory" TEXT,
    "format" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "availabilityNotes" TEXT,
    "maxLoanWeeks" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resource_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameEs" TEXT,
    "category" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ResourceTag" (
    "resourceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("resourceId", "tagId"),
    CONSTRAINT "ResourceTag_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResourceTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "churchId" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoanRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "requestingChurchId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "neededByDate" DATETIME,
    "returnByDate" DATETIME,
    "message" TEXT,
    "responseMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LoanRequest_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoanRequest_requestingChurchId_fkey" FOREIGN KEY ("requestingChurchId") REFERENCES "Church" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "loanRequestId" TEXT,
    "borrowingChurchId" TEXT NOT NULL,
    "lendingChurchId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "returnDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Loan_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Loan_loanRequestId_fkey" FOREIGN KEY ("loanRequestId") REFERENCES "LoanRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Loan_borrowingChurchId_fkey" FOREIGN KEY ("borrowingChurchId") REFERENCES "Church" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Loan_lendingChurchId_fkey" FOREIGN KEY ("lendingChurchId") REFERENCES "Church" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Resource_churchId_category_availabilityStatus_idx" ON "Resource"("churchId", "category", "availabilityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "LoanRequest_resourceId_requestingChurchId_status_idx" ON "LoanRequest"("resourceId", "requestingChurchId", "status");

-- CreateIndex
CREATE INDEX "LoanRequest_status_idx" ON "LoanRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_loanRequestId_key" ON "Loan"("loanRequestId");

-- CreateIndex
CREATE INDEX "Loan_resourceId_borrowingChurchId_lendingChurchId_status_idx" ON "Loan"("resourceId", "borrowingChurchId", "lendingChurchId", "status");

-- CreateIndex
CREATE INDEX "Loan_lendingChurchId_status_idx" ON "Loan"("lendingChurchId", "status");

-- CreateIndex
CREATE INDEX "Loan_borrowingChurchId_status_idx" ON "Loan"("borrowingChurchId", "status");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

