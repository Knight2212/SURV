import * as XLSX from 'xlsx';
import { Room, Poll, PollResponse, QAQuestion, Survey, SurveyResponse } from '@/types';

export interface SessionExportData {
  room: Room;
  polls: (Poll & { responses: PollResponse[] })[];
  qaQuestions: QAQuestion[];
  surveys: (Survey & { responses: SurveyResponse[] })[];
  exportedAt: string;
}

/**
 * Triggers browser download of a text/binary blob
 */
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Escapes CSV field value according to RFC 4180
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * EXCEL (.xlsx) Multi-Tab Export
 */
export function exportSessionToExcel(data: SessionExportData) {
  const wb = XLSX.utils.book_new();

  // 1. OVERVIEW SHEET
  const overviewRows = [
    ['SURV Session Analytics & Data Report'],
    ['Report Generated', new Date().toLocaleString()],
    [],
    ['METRIC', 'VALUE'],
    ['Session Title', data.room.title],
    ['Session PIN', data.room.pin],
    ['Description', data.room.description || 'None'],
    ['Session Status', data.room.status],
    ['Created At', new Date(data.room.createdAt).toLocaleString()],
    ['Participant Count', data.room.participantCount],
    ['Total Polls / Quizzes', data.polls.length],
    ['Total Audience Q&A Items', data.qaQuestions.length],
    ['Total Surveys', data.surveys.length],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Session Overview');

  // 2. POLLS SUMMARY SHEET
  const pollSummaryRows: (string | number)[][] = [
    ['Poll #', 'Question Title', 'Format', 'Time Limit (s)', 'Options', 'Total Responses', 'Correct Answer']
  ];

  data.polls.forEach((poll, idx) => {
    const totalVotes = poll.responses.length;
    const correctOption = poll.options?.find(o => o.isCorrect)?.text || (poll.type === 'quiz' ? 'Not specified' : 'N/A');
    const optionsText = poll.options ? poll.options.map(o => o.text).join(' | ') : 'Freeform Input';

    pollSummaryRows.push([
      idx + 1,
      poll.title,
      poll.type.replace('_', ' '),
      poll.timeLimit || 'Untimed',
      optionsText,
      totalVotes,
      correctOption
    ]);
  });
  const wsPolls = XLSX.utils.aoa_to_sheet(pollSummaryRows);
  XLSX.utils.book_append_sheet(wb, wsPolls, 'Polls Summary');

  // 3. POLL VOTES & RESULTS DETAIL
  const votesRows: (string | number)[][] = [
    ['Poll #', 'Question Title', 'Participant ID', 'Participant Name', 'Selected Option / Value', 'Submitted At']
  ];

  data.polls.forEach((poll, pIdx) => {
    poll.responses.forEach(resp => {
      let displayVal = String(resp.value);
      if (poll.options && poll.options.length > 0) {
        const matchingOpt = poll.options.find(o => o.id === resp.value);
        if (matchingOpt) {
          displayVal = matchingOpt.text;
        }
      }

      votesRows.push([
        pIdx + 1,
        poll.title,
        resp.participantId,
        resp.participantName || 'Anonymous',
        displayVal,
        new Date(resp.createdAt).toLocaleString()
      ]);
    });
  });
  const wsVotes = XLSX.utils.aoa_to_sheet(votesRows);
  XLSX.utils.book_append_sheet(wb, wsVotes, 'Detailed Poll Votes');

  // 4. AUDIENCE Q&A SHEET
  const qaRows: (string | number)[][] = [
    ['#', 'Author Name', 'Anonymous?', 'Question Prompt', 'Upvotes', 'Pinned on Stage?', 'Answered Status', 'Submitted At']
  ];

  data.qaQuestions.forEach((q, idx) => {
    qaRows.push([
      idx + 1,
      q.authorName,
      q.isAnonymous ? 'Yes' : 'No',
      q.text,
      q.upvotes,
      q.isPinned ? 'Yes' : 'No',
      q.isAnswered ? 'Answered' : 'Unanswered',
      new Date(q.createdAt).toLocaleString()
    ]);
  });
  const wsQA = XLSX.utils.aoa_to_sheet(qaRows);
  XLSX.utils.book_append_sheet(wb, wsQA, 'Audience Q&A');

  // 5. SURVEYS SHEET
  const surveyRows: (string | number)[][] = [
    ['Survey Title', 'Question #', 'Question Prompt', 'Question Type', 'Participant Name', 'Response Answer', 'Submitted At']
  ];

  data.surveys.forEach(survey => {
    survey.responses.forEach(resp => {
      survey.questions.forEach((q, qIdx) => {
        const answer = resp.answers[q.id];
        surveyRows.push([
          survey.title,
          qIdx + 1,
          q.title,
          q.type.replace('_', ' '),
          resp.participantName || 'Attendee',
          answer !== undefined ? String(answer) : 'No Answer',
          new Date(resp.submittedAt).toLocaleString()
        ]);
      });
    });
  });
  const wsSurveys = XLSX.utils.aoa_to_sheet(surveyRows);
  XLSX.utils.book_append_sheet(wb, wsSurveys, 'Surveys & Feedback');

  // Generate and download XLSX file
  const filename = `surv-session-${data.room.pin}-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * SPREADSHEET / CSV (.csv) Export
 */
export function exportSessionToCSV(data: SessionExportData) {
  const lines: string[] = [];

  // 1. SESSION OVERVIEW BLOCK
  lines.push('=== SURV SESSION OVERVIEW ===');
  lines.push(['Title', escapeCSV(data.room.title)].join(','));
  lines.push(['PIN', escapeCSV(data.room.pin)].join(','));
  lines.push(['Description', escapeCSV(data.room.description || 'None')].join(','));
  lines.push(['Created At', escapeCSV(new Date(data.room.createdAt).toLocaleString())].join(','));
  lines.push(['Exported At', escapeCSV(new Date().toLocaleString())].join(','));
  lines.push(['Total Attendees', data.room.participantCount].join(','));
  lines.push(['Total Polls', data.polls.length].join(','));
  lines.push(['Total Q&A Questions', data.qaQuestions.length].join(','));
  lines.push(['Total Surveys', data.surveys.length].join(','));
  lines.push('');

  // 2. POLL QUESTIONS & BREAKDOWN
  lines.push('=== POLL QUESTIONS & RESPONSES ===');
  lines.push(['Poll #', 'Title', 'Format', 'Time Limit (s)', 'Participant', 'Selected Option / Value', 'Submitted At'].map(escapeCSV).join(','));
  
  data.polls.forEach((poll, pIdx) => {
    if (poll.responses.length === 0) {
      lines.push([
        pIdx + 1,
        escapeCSV(poll.title),
        escapeCSV(poll.type),
        escapeCSV(poll.timeLimit || 'Untimed'),
        escapeCSV('No responses recorded'),
        escapeCSV('-'),
        escapeCSV('-')
      ].join(','));
    } else {
      poll.responses.forEach(resp => {
        let displayVal = String(resp.value);
        if (poll.options && poll.options.length > 0) {
          const matchingOpt = poll.options.find(o => o.id === resp.value);
          if (matchingOpt) displayVal = matchingOpt.text;
        }

        lines.push([
          pIdx + 1,
          escapeCSV(poll.title),
          escapeCSV(poll.type),
          escapeCSV(poll.timeLimit || 'Untimed'),
          escapeCSV(resp.participantName || 'Anonymous'),
          escapeCSV(displayVal),
          escapeCSV(new Date(resp.createdAt).toLocaleString())
        ].join(','));
      });
    }
  });
  lines.push('');

  // 3. AUDIENCE Q&A
  lines.push('=== AUDIENCE Q&A LOG ===');
  lines.push(['#', 'Author', 'Anonymous?', 'Question Prompt', 'Upvotes', 'Pinned on Stage?', 'Answered Status', 'Submitted At'].map(escapeCSV).join(','));
  
  if (data.qaQuestions.length === 0) {
    lines.push(['-', 'No questions submitted in this session', '-', '-', '-', '-', '-', '-'].map(escapeCSV).join(','));
  } else {
    data.qaQuestions.forEach((q, idx) => {
      lines.push([
        idx + 1,
        escapeCSV(q.authorName),
        escapeCSV(q.isAnonymous ? 'Yes' : 'No'),
        escapeCSV(q.text),
        q.upvotes,
        escapeCSV(q.isPinned ? 'Yes' : 'No'),
        escapeCSV(q.isAnswered ? 'Answered' : 'Unanswered'),
        escapeCSV(new Date(q.createdAt).toLocaleString())
      ].join(','));
    });
  }
  lines.push('');

  // 4. SURVEYS & FEEDBACK
  lines.push('=== SURVEYS & FEEDBACK ===');
  lines.push(['Survey Title', 'Question #', 'Question Prompt', 'Question Type', 'Participant', 'Answer', 'Submitted At'].map(escapeCSV).join(','));
  
  if (data.surveys.length === 0) {
    lines.push(['-', 'No surveys created in this session', '-', '-', '-', '-', '-'].map(escapeCSV).join(','));
  } else {
    data.surveys.forEach(survey => {
      if (survey.responses.length === 0) {
        survey.questions.forEach((q, qIdx) => {
          lines.push([
            escapeCSV(survey.title),
            qIdx + 1,
            escapeCSV(q.title),
            escapeCSV(q.type),
            escapeCSV('No submissions yet'),
            escapeCSV('-'),
            escapeCSV('-')
          ].join(','));
        });
      } else {
        survey.responses.forEach(resp => {
          survey.questions.forEach((q, qIdx) => {
            const answer = resp.answers[q.id];
            lines.push([
              escapeCSV(survey.title),
              qIdx + 1,
              escapeCSV(q.title),
              escapeCSV(q.type),
              escapeCSV(resp.participantName || 'Attendee'),
              escapeCSV(answer !== undefined ? String(answer) : 'No Answer'),
              escapeCSV(new Date(resp.submittedAt).toLocaleString())
            ].join(','));
          });
        });
      }
    });
  }

  const csvContent = '\uFEFF' + lines.join('\r\n'); // Add UTF-8 BOM for Excel/Sheets compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `surv-session-${data.room.pin}-${Date.now()}.csv`);
}

/**
 * RAW JSON (.json) Export
 */
export function exportSessionToJSON(data: SessionExportData) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadFile(blob, `surv-session-${data.room.pin}-${Date.now()}.json`);
}
