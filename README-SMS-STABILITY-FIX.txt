Carrtell SMS Stability Patch

مسیر فایل:
src/admin/services/smsApi.ts

این پچ فایل smsApi.ts را کامل و پایدار می‌کند و exportهای زیر را یکجا فراهم می‌کند:
- logSmsEvent
- makeReviewLink
- makeServiceReviewLink
- sendSmsByTemplate
- sendOrderCreatedSms
- sendOrderStatusSms
- sendReviewLinkSms
- sendServiceAssignedSms
- sendServiceCompletedSms
- getSmsSettings / saveSmsSettings
- getSmsTemplates / updateSmsTemplate
- getSmsLogs / retrySmsLog / markSmsLogSent / markSmsLogFailed

SQL جدید لازم ندارد؛ همان SQL پچ پیامک قبلی کافی است.
