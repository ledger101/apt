import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    updateDoc
} from "firebase/firestore";
import { db } from "./firebase";
import {
    Report,
    DischargeTest,
    Site,
    Borehole,
    Series,
    Quality
} from "@/types";

class FirestoreService {
    // Helpers
    private cleanForFirestore(obj: any): any {
        if (obj === null || obj === undefined) return null;
        if (obj instanceof Date || obj instanceof Timestamp) return obj;
        if (Array.isArray(obj)) return obj.map(v => this.cleanForFirestore(v));
        if (typeof obj !== 'object') return obj;

        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                cleaned[key] = this.cleanForFirestore(value);
            }
        }
        return cleaned;
    }

    // Pumping Reports
    async saveReport(report: Report): Promise<void> {
        const reportData = this.cleanForFirestore({
            ...report,
            reportDate: report.reportDate instanceof Date ? Timestamp.fromDate(report.reportDate) : report.reportDate,
            createdAt: report.createdAt instanceof Date ? Timestamp.fromDate(report.createdAt) : report.createdAt,
            updatedAt: Timestamp.now()
        });

        await addDoc(collection(db, "reports"), reportData);
    }

    // Site-Based Discharge Data
    async saveBoreholeData(site: Site, borehole: Borehole, test: DischargeTest): Promise<void> {
        const docId = `${site.siteId}_${borehole.boreholeNo}`;
        const docRef = doc(db, "sites", docId);

        const mergedData = this.cleanForFirestore({
            // Site Data
            siteId: site.siteId,
            siteName: site.siteName,
            client: site.client,
            contractor: site.contractor,
            province: site.province,
            district: site.district,
            coordinates: site.coordinates,

            // Borehole Data
            boreholeNo: borehole.boreholeNo,
            boreholeId: borehole.boreholeId,
            altBhNo: borehole.altBhNo,
            elevation_m: borehole.elevation_m,
            boreholeDepth_m: borehole.boreholeDepth_m,
            datumAboveCasing_m: borehole.datumAboveCasing_m,
            existingPump: borehole.existingPump,
            staticWL_mbdl: borehole.staticWL_mbdl,
            casingHeight_magl: borehole.casingHeight_magl,
            pumpDepth_m: borehole.pumpDepth_m,
            pumpInletDiam_mm: borehole.pumpInletDiam_mm,
            pumpType: borehole.pumpType,
            swl_mbch: borehole.swl_mbch,

            // Test Metadata
            testId: test.testId,
            testType: test.testType,
            testSummary: test.summary,
            testStartTime: test.startTime ? (test.startTime instanceof Date ? Timestamp.fromDate(test.startTime) : test.startTime) : null,
            testEndTime: test.endTime ? (test.endTime instanceof Date ? Timestamp.fromDate(test.endTime) : test.endTime) : null,
            sourceFilePath: test.sourceFilePath,

            updatedAt: Timestamp.now(),
            createdAt: site.createdAt || Timestamp.now()
        });

        await setDoc(docRef, mergedData, { merge: true });
    }

    async saveSeriesData(siteId: string, boreholeNo: string, seriesList: Series[]): Promise<void> {
        const parentId = `${siteId}_${boreholeNo}`;

        for (const s of seriesList) {
            let docId = '';
            if (s.seriesType === 'discharge_rate') docId = `discharge${s.rateIndex}`;
            else if (s.seriesType === 'recovery') docId = 'recovery';
            else if (s.seriesType === 'discharge') docId = 'dischargeborehole';
            else if (s.seriesType.includes('obshole1')) docId = 'observationHole1';
            else if (s.seriesType.includes('obshole2')) docId = 'observationHole2';
            else if (s.seriesType.includes('obshole3')) docId = 'observationHole3';
            else docId = `series_${s.seriesId}`;

            const docRef = doc(db, `sites/${parentId}/tests`, docId);
            const seriesData = this.cleanForFirestore({
                points: s.points,
                seriesType: s.seriesType,
                rateIndex: s.rateIndex,
                pageIndex: s.pageIndex,
                createdAt: Timestamp.now()
            });

            await setDoc(docRef, seriesData);
        }
    }

    async saveQualityData(siteId: string, boreholeNo: string, qualityList: Quality[]): Promise<void> {
        const parentId = `${siteId}_${boreholeNo}`;
        for (const q of qualityList) {
            const docId = `quality_rate${q.rateIndex}`;
            const docRef = doc(db, `sites/${parentId}/tests`, docId);
            const data = this.cleanForFirestore({
                ...q,
                createdAt: Timestamp.now()
            });
            await setDoc(docRef, data);
        }
    }

    // Dashboard Summary Fetches
    async getRecentReports(limit: number = 5): Promise<Report[]> {
        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), where("createdAt", "!=", null));
        // Note: will need index for this or just simple orderBy
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any));
    }
}

export const firestoreService = new FirestoreService();
