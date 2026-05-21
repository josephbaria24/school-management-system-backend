import { Router } from "express";
import * as registrar from "../controllers/registrar.controller.js";

const router = Router();

router.get("/registrar/scholastic-delinquency", registrar.getScholasticDelinquency);
router.put("/registrar/scholastic-delinquency", registrar.putScholasticDelinquency);

router.get("/registrar/grading-system", registrar.getGradingSystem);
router.put("/registrar/grading-system", registrar.putGradingSystem);

router.get("/registrar/add-drop/transactions", registrar.getAddDropTransactions);
router.post("/registrar/add-drop/transactions", registrar.postAddDropTransaction);
router.delete("/registrar/add-drop/transactions/:id", registrar.deleteAddDropTransaction);

router.get("/registrar/add-drop/withdrawals", registrar.getAddDropWithdrawn);
router.post("/registrar/add-drop/withdrawals", registrar.postAddDropWithdrawn);
router.delete("/registrar/add-drop/withdrawals/:id", registrar.deleteAddDropWithdrawn);

router.get("/registrar/add-drop/schedule", registrar.getAddDropSchedule);
router.put("/registrar/add-drop/schedule", registrar.putAddDropSchedule);

router.get("/registrar/add-drop/staging", registrar.getAddDropStaging);
router.put("/registrar/add-drop/staging", registrar.putAddDropStaging);

router.get("/registrar/add-drop/module-config", registrar.getAddDropModuleConfig);
router.put("/registrar/add-drop/module-config", registrar.putAddDropModuleConfig);

router.get("/registrar/grade-sheet-inventory", registrar.getGradeSheetInventory);
router.put("/registrar/grade-sheet-inventory", registrar.putGradeSheetInventory);

router.get("/registrar/unposted-grades-inventory", registrar.getUnpostedGradesInventory);
router.put("/registrar/unposted-grades-inventory", registrar.putUnpostedGradesInventory);

router.get("/registrar/correction-of-grades", registrar.getCorrectionOfGrades);
router.put("/registrar/correction-of-grades", registrar.putCorrectionOfGrades);

router.get("/registrar/students-with-incomplete-grade", registrar.getStudentsWithIncompleteGrade);
router.put("/registrar/students-with-incomplete-grade/settings", registrar.putStudentsWithIncompleteGradeSettings);
router.post("/registrar/students-with-incomplete-grade/convert", registrar.postStudentsWithIncompleteGradeConvert);

router.get("/registrar/recalculate-summary-of-grades", registrar.getRecalculateSummaryOfGrades);
router.post("/registrar/recalculate-summary-of-grades", registrar.postRecalculateSummaryOfGrades);

router.get("/registrar/grade-encoding", registrar.getGradeEncoding);
router.put("/registrar/grade-encoding", registrar.putGradeEncoding);
router.put("/registrar/grade-encoding/evaluation", registrar.putGradeEncodingEvaluation);
router.put("/registrar/grade-encoding/settings", registrar.putGradeEncodingSettings);
router.put("/registrar/grade-encoding/transcript", registrar.putGradeEncodingTranscript);

router.get("/registrar/report-of-grades/options", registrar.getReportOfGradesOptions);
router.get("/registrar/report-of-grades/students", registrar.getReportOfGradesStudents);
router.post("/registrar/report-of-grades/preview", registrar.postReportOfGradesPreview);

router.get("/registrar/grade-point-average-ranking/options", registrar.getGradePointAverageRankingOptions);
router.get("/registrar/grade-point-average-ranking/students", registrar.getGradePointAverageRankingStudents);
router.post("/registrar/grade-point-average-ranking/preview", registrar.postGradePointAverageRankingPreview);

router.get("/registrar/worksheet-for-consolidated-grades/options", registrar.getWorksheetForConsolidatedGradesOptions);
router.post("/registrar/worksheet-for-consolidated-grades/preview", registrar.postWorksheetForConsolidatedGradesPreview);

router.get("/registrar/tag-graduating-students/options", registrar.getTagGraduatingStudentsOptions);
router.get("/registrar/tag-graduating-students/list", registrar.getTagGraduatingStudentsList);
router.get("/registrar/tag-graduating-students/student", registrar.getTagGraduatingStudentWorkspace);
router.get("/registrar/tag-graduating-students/students", registrar.getTagGraduatingStudentsSearch);
router.get("/registrar/tag-graduating-students/candidates", registrar.getTagGraduatingMassCandidates);
router.post("/registrar/tag-graduating-students", registrar.postTagGraduatingStudent);
router.post("/registrar/tag-graduating-students/void", registrar.postTagGraduatingStudentVoid);
router.post("/registrar/tag-graduating-students/mass", registrar.postTagGraduatingStudentsMass);

router.get("/registrar/graduate-candidates-for-graduation", registrar.getGraduateCandidatesForGraduation);

router.get("/registrar/certification/options", registrar.getCertificationOptions);
router.get("/registrar/certification/students", registrar.getCertificationStudents);
router.get("/registrar/certification/student", registrar.getCertificationStudent);
router.get("/registrar/certification/signatories", registrar.getCertificationSignatories);
router.put("/registrar/certification/signatories", registrar.putCertificationSignatories);
router.get("/registrar/certification/print-history", registrar.getCertificationPrintHistory);
router.post("/registrar/certification/preview", registrar.postCertificationPreview);
router.post("/registrar/certification/print", registrar.postCertificationPrint);

router.get("/registrar/ched-reports/options", registrar.getChedReportsOptions);
router.post("/registrar/ched-reports/preview", registrar.postChedReportsPreview);

router.get("/registrar/list-of-reports/options", registrar.getListOfReportsOptions);
router.post("/registrar/list-of-reports/preview", registrar.postListOfReportsPreview);

export default router;
