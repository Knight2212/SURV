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
 * Includes a rich primary "Session Report & Results" sheet where all data is immediately
 * visible upon opening the file, followed by dedicated tabs for deep-dive analysis.
 */
export function exportSessionToExcel(data: SessionExportData) {
  const wb = XLSX.utils.book_new();

  const totalVotesCast = data.polls.reduce((acc, p) => acc + (p.responses?.length || 0), 0);

  // -------------------------------------------------------------
  // 1. PRIMARY CONSOLIDATED SHEET: "Session Report & Results"
  // -------------------------------------------------------------
  const reportRows: (string | number)[][] = [
    ['SURV Session Analytics & Complete Results Report'],
    ['Report Generated', new Date().toLocaleString()],
    ['Session PIN', data.room.pin],
    [],
    ['=== 1. EXECUTIVE SESSION OVERVIEW ==='],
    ['METRIC', 'VALUE'],
    ['Session Title', data.room.title],
    ['Session PIN', data.room.pin],
    ['Description', data.room.description || 'None'],
    ['Session Status', data.room.status],
    ['Created At', new Date(data.room.createdAt).toLocaleString()],
    ['Total Attendees Joined', data.room.participantCount || 0],
    ['Total Polls / Quizzes', data.polls.length],
    ['Total Votes Cast', totalVotesCast],
    ['Total Audience Q&A Questions', data.qaQuestions.length],
    ['Total Surveys', data.surveys.length],
    [],
    ['=== 2. LIVE POLLS & QUIZZES RESULTS ==='],
    ['Poll #', 'Question Title', 'Format', 'Time Limit (s)', 'Options & Vote Distribution', 'Total Responses', 'Correct Answer']
  ];

  if (data.polls.length === 0) {
    reportRows.push([
      '-',
      'No polls or quizzes were added to this session yet.',
      '-',
      '-',
      'Create polls or generate questions via AI from the Host Studio.',
      0,
      '-'
    ]);
  } else {
    data.polls.forEach((poll, idx) => {
      const totalVotes = poll.responses?.length || 0;
      const correctOption = poll.options?.find(o => o.isCorrect)?.text || (poll.type === 'quiz' ? 'None specified' : 'N/A');

      // Calculate option-by-option vote breakdown
      let optionsDistribution = 'Freeform Input';
      if (poll.options && poll.options.length > 0) {
        optionsDistribution = poll.options.map(opt => {
          const optVotes = poll.responses?.filter(r => r.value === opt.id || r.value === opt.text).length || 0;
          const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
          const marker = opt.isCorrect ? ' [CORRECT]' : '';
          return `${opt.text}${marker}: ${optVotes} vote(s) (${pct}%)`;
        }).join(' | ');
      } else if (totalVotes > 0) {
        optionsDistribution = `${totalVotes} freeform answer(s) submitted`;
      }

      reportRows.push([
        idx + 1,
        poll.title,
        poll.type.replace('_', ' '),
        poll.timeLimit ? `${poll.timeLimit}s` : 'Untimed',
        optionsDistribution,
        totalVotes,
        correctOption
      ]);
    });
  }

  reportRows.push([]);
  reportRows.push(['=== 3. AUDIENCE Q&A ACTIVITY LOG ===']);
  reportRows.push(['#', 'Author Name', 'Anonymous?', 'Question Prompt', 'Upvotes', 'Pinned on Stage?', 'Answered Status', 'Submitted At']);

  if (data.qaQuestions.length === 0) {
    reportRows.push(['-', 'No audience questions submitted in this session.', '-', '-', 0, '-', '-', '-']);
  } else {
    data.qaQuestions.forEach((q, idx) => {
      reportRows.push([
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
  }

  reportRows.push([]);
  reportRows.push(['=== 4. SURVEYS & ATTENDEE EVALUATIONS ===']);
  reportRows.push(['Survey Title', 'Question #', 'Question Prompt', 'Question Type', 'Participant Name', 'Response Answer', 'Submitted At']);

  let hasSurveyRows = false;
  data.surveys.forEach(survey => {
    if (!survey.responses || survey.responses.length === 0) {
      survey.questions.forEach((q, qIdx) => {
        hasSurveyRows = true;
        reportRows.push([
          survey.title,
          qIdx + 1,
          q.title,
          q.type.replace('_', ' '),
          'No participants submitted yet',
          '-',
          '-'
        ]);
      });
    } else {
      survey.responses.forEach(resp => {
        survey.questions.forEach((q, qIdx) => {
          hasSurveyRows = true;
          const answer = resp.answers ? resp.answers[q.id] : undefined;
          reportRows.push([
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
    }
  });

  if (!hasSurveyRows) {
    reportRows.push(['No surveys created in this session.', '-', '-', '-', '-', '-', '-']);
  }

  const wsMain = XLSX.utils.aoa_to_sheet(reportRows);
  wsMain['!cols'] = [
    { wch: 18 }, // Col A: Index / Metric / Survey Title
    { wch: 38 }, // Col B: Question / Value
    { wch: 18 }, // Col C: Format
    { wch: 16 }, // Col D: Time Limit / Type
    { wch: 45 }, // Col E: Options Breakdown / Participant
    { wch: 16 }, // Col F: Total Votes / Answer
    { wch: 24 }, // Col G: Correct Answer / Submitted At
  ];
  XLSX.utils.book_append_sheet(wb, wsMain, 'Session Report & Results');

  // -------------------------------------------------------------
  // 2. DEDICATED TAB: "Polls Summary"
  // -------------------------------------------------------------
  const pollSummaryRows: (string | number)[][] = [
    ['Poll #', 'Question Title', 'Format', 'Time Limit (s)', 'Options & Vote Breakdown', 'Total Responses', 'Correct Answer']
  ];

  if (data.polls.length === 0) {
    pollSummaryRows.push(['-', 'No polls created yet in this session', '-', '-', '-', 0, '-']);
  } else {
    data.polls.forEach((poll, idx) => {
      const totalVotes = poll.responses?.length || 0;
      const correctOption = poll.options?.find(o => o.isCorrect)?.text || (poll.type === 'quiz' ? 'None specified' : 'N/A');
      const optionsText = poll.options
        ? poll.options.map(o => {
            const count = poll.responses?.filter(r => r.value === o.id || r.value === o.text).length || 0;
            return `${o.text}${o.isCorrect ? ' [CORRECT]' : ''} (${count} votes)`;
          }).join(' | ')
        : 'Freeform Input';

      pollSummaryRows.push([
        idx + 1,
        poll.title,
        poll.type.replace('_', ' '),
        poll.timeLimit ? `${poll.timeLimit}s` : 'Untimed',
        optionsText,
        totalVotes,
        correctOption
      ]);
    });
  }
  const wsPolls = XLSX.utils.aoa_to_sheet(pollSummaryRows);
  wsPolls['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 18 }, { wch: 15 }, { wch: 50 }, { wch: 16 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsPolls, 'Polls Summary');

  // -------------------------------------------------------------
  // 3. DEDICATED TAB: "Detailed Poll Votes"
  // -------------------------------------------------------------
  const votesRows: (string | number)[][] = [
    ['Poll #', 'Question Title', 'Participant ID', 'Participant Name', 'Selected Option / Value', 'Submitted At']
  ];

  let totalIndividualVotes = 0;
  data.polls.forEach((poll, pIdx) => {
    (poll.responses || []).forEach(resp => {
      totalIndividualVotes++;
      let displayVal = String(resp.value);
      if (poll.options && poll.options.length > 0) {
        const matchingOpt = poll.options.find(o => o.id === resp.value || o.text === resp.value);
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

  if (totalIndividualVotes === 0) {
    votesRows.push(['-', 'No participant votes recorded yet in this session', '-', '-', '-', '-']);
  }

  const wsVotes = XLSX.utils.aoa_to_sheet(votesRows);
  wsVotes['!cols'] = [{ wch: 8 }, { wch: 38 }, { wch: 20 }, { wch: 22 }, { wch: 28 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsVotes, 'Detailed Poll Votes');

  // -------------------------------------------------------------
  // 4. DEDICATED TAB: "Audience Q&A"
  // -------------------------------------------------------------
  const qaRows: (string | number)[][] = [
    ['#', 'Author Name', 'Anonymous?', 'Question Prompt', 'Upvotes', 'Pinned on Stage?', 'Answered Status', 'Submitted At']
  ];

  if (data.qaQuestions.length === 0) {
    qaRows.push(['-', 'No questions submitted in this session', '-', '-', 0, '-', '-', '-']);
  } else {
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
  }
  const wsQA = XLSX.utils.aoa_to_sheet(qaRows);
  wsQA['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 14 }, { wch: 45 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsQA, 'Audience Q&A');

  // -------------------------------------------------------------
  // 5. DEDICATED TAB: "Surveys & Feedback"
  // -------------------------------------------------------------
  const surveyRows: (string | number)[][] = [
    ['Survey Title', 'Question #', 'Question Prompt', 'Question Type', 'Participant Name', 'Response Answer', 'Submitted At']
  ];

  let surveySubmissionCount = 0;
  data.surveys.forEach(survey => {
    (survey.responses || []).forEach(resp => {
      survey.questions.forEach((q, qIdx) => {
        surveySubmissionCount++;
        const answer = resp.answers ? resp.answers[q.id] : undefined;
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

  if (surveySubmissionCount === 0) {
    surveyRows.push(['No survey submissions recorded yet', '-', '-', '-', '-', '-', '-']);
  }

  const wsSurveys = XLSX.utils.aoa_to_sheet(surveyRows);
  wsSurveys['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 38 }, { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 24 }];
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

  const totalVotesCast = data.polls.reduce((acc, p) => acc + (p.responses?.length || 0), 0);

  // 1. SESSION OVERVIEW BLOCK
  lines.push('=== SURV SESSION OVERVIEW ===');
  lines.push(['Title', escapeCSV(data.room.title)].join(','));
  lines.push(['PIN', escapeCSV(data.room.pin)].join(','));
  lines.push(['Description', escapeCSV(data.room.description || 'None')].join(','));
  lines.push(['Session Status', escapeCSV(data.room.status)].join(','));
  lines.push(['Created At', escapeCSV(new Date(data.room.createdAt).toLocaleString())].join(','));
  lines.push(['Exported At', escapeCSV(new Date().toLocaleString())].join(','));
  lines.push(['Total Attendees Joined', data.room.participantCount || 0].join(','));
  lines.push(['Total Polls', data.polls.length].join(','));
  lines.push(['Total Poll Votes Cast', totalVotesCast].join(','));
  lines.push(['Total Q&A Questions', data.qaQuestions.length].join(','));
  lines.push(['Total Surveys', data.surveys.length].join(','));
  lines.push('');

  // 2. POLL QUESTIONS & BREAKDOWN
  lines.push('=== POLL QUESTIONS & RESULTS SUMMARY ===');
  lines.push(['Poll #', 'Question Title', 'Format', 'Time Limit (s)', 'Options & Vote Distribution', 'Total Responses', 'Correct Answer'].map(escapeCSV).join(','));

  if (data.polls.length === 0) {
    lines.push(['-', escapeCSV('No polls created yet in this session'), '-', '-', '-', '0', '-'].join(','));
  } else {
    data.polls.forEach((poll, pIdx) => {
      const totalVotes = poll.responses?.length || 0;
      const correctOption = poll.options?.find(o => o.isCorrect)?.text || (poll.type === 'quiz' ? 'None specified' : 'N/A');

      let optionsDistribution = 'Freeform Input';
      if (poll.options && poll.options.length > 0) {
        optionsDistribution = poll.options.map(opt => {
          const optVotes = poll.responses?.filter(r => r.value === opt.id || r.value === opt.text).length || 0;
          const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
          return `${opt.text}${opt.isCorrect ? ' [CORRECT]' : ''}: ${optVotes} vote(s) (${pct}%)`;
        }).join(' | ');
      }

      lines.push([
        pIdx + 1,
        escapeCSV(poll.title),
        escapeCSV(poll.type.replace('_', ' ')),
        escapeCSV(poll.timeLimit ? `${poll.timeLimit}s` : 'Untimed'),
        escapeCSV(optionsDistribution),
        totalVotes,
        escapeCSV(correctOption)
      ].join(','));
    });
  }
  lines.push('');

  // 3. DETAILED VOTES LOG
  lines.push('=== DETAILED POLL VOTER LOG ===');
  lines.push(['Poll #', 'Question Title', 'Participant ID', 'Participant Name', 'Selected Option / Value', 'Submitted At'].map(escapeCSV).join(','));

  let hasVotes = false;
  data.polls.forEach((poll, pIdx) => {
    (poll.responses || []).forEach(resp => {
      hasVotes = true;
      let displayVal = String(resp.value);
      if (poll.options && poll.options.length > 0) {
        const matchingOpt = poll.options.find(o => o.id === resp.value || o.text === resp.value);
        if (matchingOpt) displayVal = matchingOpt.text;
      }

      lines.push([
        pIdx + 1,
        escapeCSV(poll.title),
        escapeCSV(resp.participantId),
        escapeCSV(resp.participantName || 'Anonymous'),
        escapeCSV(displayVal),
        escapeCSV(new Date(resp.createdAt).toLocaleString())
      ].join(','));
    });
  });

  if (!hasVotes) {
    lines.push(['-', escapeCSV('No participant votes recorded yet in this session'), '-', '-', '-', '-'].join(','));
  }
  lines.push('');

  // 4. AUDIENCE Q&A
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

  // 5. SURVEYS & FEEDBACK
  lines.push('=== SURVEYS & FEEDBACK ===');
  lines.push(['Survey Title', 'Question #', 'Question Prompt', 'Question Type', 'Participant', 'Answer', 'Submitted At'].map(escapeCSV).join(','));

  let hasSurveys = false;
  data.surveys.forEach(survey => {
    if (!survey.responses || survey.responses.length === 0) {
      survey.questions.forEach((q, qIdx) => {
        hasSurveys = true;
        lines.push([
          escapeCSV(survey.title),
          qIdx + 1,
          escapeCSV(q.title),
          escapeCSV(q.type),
          escapeCSV('No participants submitted yet'),
          escapeCSV('-'),
          escapeCSV('-')
        ].join(','));
      });
    } else {
      survey.responses.forEach(resp => {
        survey.questions.forEach((q, qIdx) => {
          hasSurveys = true;
          const answer = resp.answers ? resp.answers[q.id] : undefined;
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

  if (!hasSurveys) {
    lines.push(['-', 'No surveys created in this session', '-', '-', '-', '-', '-'].map(escapeCSV).join(','));
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
