// Firestore Data Model Definition

export const FirestoreDataModel = {
  organizations: {
    orgId: {
      projects: {
        projectId: {
          name: "string",
          client: "string",
          sites: ["siteId"],
        },
      },
    },
  },
  sites: {
    siteId: {
      name: "string",
      projectId: "string",
      rigs: ["rigId"],
    },
  },
  rigs: {
    rigId: {
      rigNumber: "string",
      siteId: "string",
    },
  },
  reports: {
    reportId: {
      orgId: "string",
      projectId: "string",
      siteId: "string",
      rigId: "string",
      reportDate: "Timestamp",
      client: "string",
      controlBHId: "string",
      obsBH1Id: "string",
      obsBH2Id: "string",
      obsBH3Id: "string",
      challenges: ["string"],
      supervisorName: "string",
      clientRepName: "string",
      status: "string", // Submitted | Reviewed | Approved | Archived
      createdBy: "string",
      createdAt: "Timestamp",
      updatedAt: "Timestamp",
      fileRef: "string", // Path to original .xlsx file
      checks: {
        templateVersion: "string",
        parseWarnings: ["string"],
        parseErrors: ["string"],
      },
      dayShift: {
        startTime: "string",
        endTime: "string",
        totalHours: "number",
        chargeableHours: "number",
        activities: [
          {
            order: "number",
            activity: "string",
            from: "string",
            to: "string",
            total: "string",
            chargeable: "boolean",
          },
        ],
        personnel: [
          {
            name: "string",
            hoursWorked: "number",
          },
        ],
      },
      nightShift: {
        startTime: "string",
        endTime: "string",
        totalHours: "number",
        chargeableHours: "number",
        activities: [
          {
            order: "number",
            activity: "string",
            from: "string",
            to: "string",
            total: "string",
            chargeable: "boolean",
          },
        ],
        personnel: [
          {
            name: "string",
            hoursWorked: "number",
          },
        ],
      },
    },
  },
};