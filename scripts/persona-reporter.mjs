import fs from 'node:fs';
import path from 'node:path';

export default class PersonaReporter {
  constructor() { this.rows = []; this.feedback = []; this.startedAt = new Date(); }
  onTestEnd(test, result) {
    const title = test.titlePath().join(' › ');
    this.rows.push({ title, status: result.status, durationMs: result.duration, project: test.parent?.projectName || '' });
    for (const attachment of result.attachments || []) {
      if (attachment.name !== 'ux-feedback' || !attachment.body) continue;
      try {
        const items = JSON.parse(Buffer.from(attachment.body).toString('utf8'));
        if (Array.isArray(items)) this.feedback.push(...items.map((item) => ({ ...item, test: title })));
      } catch {}
    }
    if (result.status === 'failed') this.feedback.push({ severity: 'error', area: 'automated-test', message: result.error?.message || 'Automated test failed', test: title });
  }
  onEnd(result) {
    const outDir = path.resolve('reports/carrtell-agent'); fs.mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const counts = { passed: this.rows.filter((x) => x.status === 'passed').length, failed: this.rows.filter((x) => x.status === 'failed').length, skipped: this.rows.filter((x) => x.status === 'skipped').length };
    const feedbackCounts = { error: this.feedback.filter((x) => x.severity === 'error').length, warning: this.feedback.filter((x) => x.severity === 'warning').length, info: this.feedback.filter((x) => x.severity === 'info').length };
    const payload = { generatedAt: new Date().toISOString(), startedAt: this.startedAt.toISOString(), status: result.status, counts, feedbackCounts, tests: this.rows, feedback: this.feedback };
    const md = this.toMarkdown(payload);
    for (const [name, content] of [[`report-${stamp}.json`, JSON.stringify(payload, null, 2)], [`report-${stamp}.md`, md], ['latest.json', JSON.stringify(payload, null, 2)], ['latest.md', md]]) fs.writeFileSync(path.join(outDir, name), content, 'utf8');
    console.log(`\nCarrtell Agent report: ${path.join(outDir, 'latest.md')}`);
    console.log(`Visual feedback: ${feedbackCounts.error} error(s), ${feedbackCounts.warning} warning(s), ${feedbackCounts.info} info`);
  }
  toMarkdown(data) {
    const severityRank = { error: 0, warning: 1, info: 2 };
    const feedback = [...data.feedback].sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9));
    const lines = ['# گزارش Carrtell Persona QA Agent v3.1', '', `- زمان: ${data.generatedAt}`, `- وضعیت تست خودکار: **${data.status.toUpperCase()}**`, `- Passed: **${data.counts.passed}** | Failed: **${data.counts.failed}** | Skipped: **${data.counts.skipped}**`, `- خطای Agent: **${data.feedbackCounts.error}** | هشدار UX/Visual: **${data.feedbackCounts.warning}** | Info: **${data.feedbackCounts.info}**`, '', '## بازخورد Agent', ''];
    if (!feedback.length) lines.push('مورد بحرانی یا هشدار UX ثبت نشد.');
    for (const item of feedback) { const icon = item.severity === 'error' ? '🔴' : item.severity === 'warning' ? '🟡' : '🔵'; lines.push(`- ${icon} **${item.area || 'general'}**${item.route ? ` \`${item.route}\`` : ''}: ${String(item.message || '').replace(/\n/g, ' ')}`); }
    lines.push('', '## نکته مهم', '', 'Pass شدن تست Functional به‌تنهایی به معنی تأیید ظاهر نیست. هشدارهای Visual/UX بالا باید جداگانه بررسی شوند.', '', '## نتایج تست‌ها', '');
    for (const row of data.tests) lines.push(`- ${row.status === 'passed' ? '✅' : row.status === 'skipped' ? '⏭️' : '❌'} ${row.title} — ${row.durationMs}ms`);
    lines.push(''); return lines.join('\n');
  }
}
